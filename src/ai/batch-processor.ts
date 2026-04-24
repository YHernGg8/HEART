/**
 * HEART Batch Processor
 * Scheduled daily/weekly trend analysis
 */

import { getAllPatients, getRecentCheckIns, storeTrendSnapshot, storeDecision } from './firestore-service.js';
import { computeTrendMetrics, aggregateRiskFactors, detectDeclinePatterns } from './analytics.js';
import { retrieveRelevantGuidelines, buildRAGEnrichedPrompt } from './rag-system.js';
import { VertexAI } from '@google-cloud/vertexai';
import { WearableDataPoint } from './types.js';

const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_REGION || 'asia-southeast1';

let vertexAI: VertexAI | null = null;
if (projectId) {
  vertexAI = new VertexAI({ project: projectId, location });
}

export async function processDailyTrends(): Promise<void> {
  console.log('🔄 Starting daily trend analysis...');
  const patients = await getAllPatients();
  console.log(`📊 Processing ${patients.length} patients`);

  for (const patient of patients) {
    try {
      await processTrendForPatient(patient.patientId, patient.baseline);
    } catch (error) {
      console.error(`❌ Failed for ${patient.patientId}:`, error);
    }
  }
  console.log('✅ Daily trend analysis complete');
}

async function processTrendForPatient(patientId: string, baseline: any): Promise<void> {
  const checkIns = await getRecentCheckIns(patientId, 7);
  if (checkIns.length === 0) return;

  const dataPoints: WearableDataPoint[] = checkIns
    .filter((c: any) => c.responded && c.deviceData)
    .map((c: any) => ({
      timestamp: c.timestamp.toDate(),
      heartRate: c.deviceData.heartRate,
      steps: c.deviceData.steps,
      sleepDuration: c.deviceData?.sleepHours,
      activityLevel: c.deviceData?.activityLevel || 'light',
    }));

  if (dataPoints.length === 0) return;

  const trends = computeTrendMetrics(dataPoints, baseline);
  const currentData = dataPoints[dataPoints.length - 1];
  const engagementScore = (checkIns.filter((c: any) => c.responded).length / checkIns.length) * 100;
  const riskFactors = aggregateRiskFactors(trends, currentData, baseline, engagementScore);

  await storeTrendSnapshot(patientId, {
    date: new Date().toISOString().split('T')[0],
    averageHeartRate: dataPoints.reduce((sum, d) => sum + d.heartRate, 0) / dataPoints.length,
    totalSteps: dataPoints.reduce((sum, d) => sum + d.steps, 0),
    riskScore: riskFactors.combinedRiskScore,
    trendDirection: trends.trendDirection,
    anomalies: detectDeclinePatterns(trends, currentData, baseline),
  });

  if (riskFactors.combinedRiskScore >= 6 && vertexAI) {
    await generateBatchDecision(patientId, riskFactors, trends, checkIns.length);
  }
}

async function generateBatchDecision(patientId: string, riskFactors: any, trends: any, checkInCount: number): Promise<void> {
  if (!vertexAI) return;
  try {
    const guidelines = await retrieveRelevantGuidelines(riskFactors);
    const ragPrompt = buildRAGEnrichedPrompt(guidelines);
    const prompt = `${ragPrompt}\n\nBatch Trend Analysis for Patient ${patientId}:\nRisk: CV ${riskFactors.cardiovascularRisk}/10, Mobility ${riskFactors.mobilityRisk}/10, Combined ${riskFactors.combinedRiskScore}/10\nTrend: ${trends.trendDirection}, Data points: ${checkInCount}\n\nProvide JSON assessment.`;

    const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const decision = JSON.parse(text.match(/\{[\s\S]*\}/)![0]);

    await storeDecision(patientId, {
      patientId, decisionId: `batch_${Date.now()}`, timestamp: new Date(),
      riskScore: decision.riskScore, reasoning: decision.reasoning, action: decision.action,
      confidencePercent: decision.confidencePercent, riskFactors, trends,
      medicalGuidelinesApplied: guidelines.map(g => g.source),
    });
    console.log(`📋 Batch decision: ${patientId} → ${decision.action}`);
  } catch (error) {
    console.error(`Failed batch decision for ${patientId}:`, error);
  }
}

export async function processWeeklyCohortAnalysis(): Promise<void> {
  console.log('🏥 Starting weekly cohort analysis...');
  const patients = await getAllPatients();
  const riskScores = patients.map((p: any) => p.lastRiskScore || 0);
  const avgRisk = riskScores.length > 0 ? riskScores.reduce((a: number, b: number) => a + b, 0) / riskScores.length : 0;

  console.log(`📊 Cohort: ${patients.length} patients, Avg Risk: ${avgRisk.toFixed(1)}/10, Critical: ${riskScores.filter((r: number) => r >= 9).length}`);
}

export const jobSchedules = {
  dailyTrends: '0 0 * * *',
  weeklyCohort: '0 0 ? * MON',
  monthlyReview: '0 0 1 * *',
};
