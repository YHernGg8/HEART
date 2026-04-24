/**
 * HEART Frontend API Service
 * Calls the backend AI endpoints via Vite proxy (/api → localhost:3000)
 */

export interface AIDecision {
  riskScore: number;
  action: 'MONITOR' | 'FAMILY_CHECK' | 'CLINIC_VISIT' | 'CALL_999';
  confidencePercent: number;
  reasoning: { en: string; ms: string };
  riskFactors: {
    cardiovascularRisk: number;
    mobilityRisk: number;
    engagementRisk: number;
    socialRisk: number;
    combinedRiskScore: number;
  };
  actionPlan: { en: string; ms: string };
  estimatedOutcome: { en: string; ms: string };
  referencedGuidelines: string[];
  whatsappMessage?: { en: string; ms: string };
}

export interface SnapshotInput {
  averageHeartRate: number;
  dailySteps: number;
  daysSinceLastCheckin: number;
  patientName?: string;
  age?: number;
  gender?: string;
  medicalHistory?: string;
}

export interface EnhancedInput extends SnapshotInput {
  baselineHeartRate?: number;
  baselineSteps?: number;
  previousDecisions?: any[];
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  timestamp: string;
}

const API_BASE = '/api';

/**
 * Check if backend is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch('/health', { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Snapshot care decision — quick assessment from current vitals
 */
export async function getSnapshotDecision(input: SnapshotInput): Promise<{ success: boolean; decision?: AIDecision; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/care-decision/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return { success: true, decision: data.decision };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Enhanced care decision — with baseline comparison and trend analysis
 */
export async function getEnhancedDecision(input: EnhancedInput): Promise<{ success: boolean; decision?: AIDecision; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/care-decision/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return { success: true, decision: data.decision };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Batch care decisions — assess multiple patients at once
 */
export async function getBatchDecisions(patients: any[]): Promise<{ success: boolean; results?: any[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/care-decision/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patients }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return { success: true, results: data.results };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Chat with HEART AI assistant
 */
export async function sendChatMessage(message: string, patientContext?: any): Promise<ChatResponse> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, patientContext }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return { success: true, reply: data.reply, timestamp: data.timestamp };
  } catch (err: any) {
    return { success: false, reply: '', timestamp: new Date().toISOString() };
  }
}
