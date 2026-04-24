/**
 * HEART Firestore Service
 * CRUD operations for patients, decisions, and trend snapshots
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';

let db: Firestore | null = null;

export function initializeFirestore(): void {
  try {
    if (getApps().length === 0) {
      const projectId = process.env.GCP_PROJECT_ID;
      if (projectId) {
        initializeApp({ projectId });
      } else {
        initializeApp();
      }
    }
    db = getFirestore();
    console.log('✅ Firestore initialized');
  } catch (error) {
    console.warn('⚠️ Firestore initialization failed (running in mock mode):', (error as Error).message);
    db = null;
  }
}

function getDb(): Firestore {
  if (!db) throw new Error('Firestore not initialized. Call initializeFirestore() first.');
  return db;
}

export async function getAllPatients(): Promise<any[]> {
  try {
    const snapshot = await getDb().collection('patients').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch {
    console.warn('⚠️ Firestore unavailable, returning empty patient list');
    return [];
  }
}

export async function getRecentCheckIns(patientId: string, days: number): Promise<any[]> {
  try {
    const since = Timestamp.fromDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
    const snapshot = await getDb()
      .collection('patients').doc(patientId)
      .collection('checkins')
      .where('timestamp', '>=', since)
      .orderBy('timestamp', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch {
    return [];
  }
}

export async function storeTrendSnapshot(patientId: string, snapshot: any): Promise<void> {
  try {
    await getDb()
      .collection('patients').doc(patientId)
      .collection('trends')
      .add({ ...snapshot, createdAt: Timestamp.now() });
  } catch (error) {
    console.warn(`⚠️ Failed to store trend snapshot for ${patientId}:`, (error as Error).message);
  }
}

export async function storeDecision(patientId: string, decision: any): Promise<void> {
  try {
    await getDb()
      .collection('patients').doc(patientId)
      .collection('decisions')
      .add({ ...decision, createdAt: Timestamp.now() });
  } catch (error) {
    console.warn(`⚠️ Failed to store decision for ${patientId}:`, (error as Error).message);
  }
}

export async function getDecisionHistory(patientId: string, limit: number = 30): Promise<any[]> {
  try {
    const snapshot = await getDb()
      .collection('patients').doc(patientId)
      .collection('decisions')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch {
    return [];
  }
}

export async function getPatientsWithRisk(minRisk: number = 0): Promise<any[]> {
  try {
    const snapshot = await getDb()
      .collection('patients')
      .where('lastRiskScore', '>=', minRisk)
      .orderBy('lastRiskScore', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, patientId: doc.id, ...doc.data() }));
  } catch {
    return [];
  }
}

export async function getCohortStats(): Promise<{
  totalPatients: number;
  criticalRiskCount: number;
  highRiskCount: number;
  averageRiskScore: number;
}> {
  try {
    const patients = await getAllPatients();
    const riskScores = patients.map((p: any) => p.lastRiskScore || 0);
    return {
      totalPatients: patients.length,
      criticalRiskCount: riskScores.filter((r: number) => r >= 9).length,
      highRiskCount: riskScores.filter((r: number) => r >= 6).length,
      averageRiskScore: riskScores.length > 0
        ? Math.round((riskScores.reduce((a: number, b: number) => a + b, 0) / riskScores.length) * 10) / 10
        : 0,
    };
  } catch {
    return { totalPatients: 0, criticalRiskCount: 0, highRiskCount: 0, averageRiskScore: 0 };
  }
}
