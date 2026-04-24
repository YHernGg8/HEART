/**
 * HEART Vertex AI Decision Flows
 *
 * Uses Google Cloud Vertex AI SDK for model calls
 * Native IAM authentication for Cloud Run deployment
 */

import { VertexAI } from '@google-cloud/vertexai';
import { OutputSchema, EnhancedInput, EnhancedOutput, Output } from './schemas.js';
import {
  computeTrendMetrics, aggregateRiskFactors,
  detectDeclinePatterns, assessDecisionConfidence,
} from './analytics.js';
import {
  retrieveRelevantGuidelines, buildRAGEnrichedPrompt,
  validateDecisionAgainstGuidelines,
} from './rag-system.js';
import { CareDecision, PatientBaseline } from './types.js';

const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_REGION || 'asia-southeast1';

let vertexAI: VertexAI | null = null;
if (projectId) {
  vertexAI = new VertexAI({ project: projectId, location });
}

/**
 * FLOW 1: Snapshot Decision (Fast Path)
 */
export async function snapshotDecisionFlow(input: any): Promise<Output> {
  // Gatekeeper: deterministic safety first
  if (input.daysSinceLastCheckin > 1 && input.dailySteps < 50) {
    return {
      riskScore: 10,
      reasoning: {
        en: 'Critical: No response and minimal movement detected. Immobility + unresponsiveness indicates acute medical crisis.',
        ms: 'Kritikal: Tiada respons dan pergerakan minimal dikesan. Ketidakmampuan bergerak + ketiadaan respons menunjukkan krisis perubatan akut.',
      },
      action: 'CALL_999',
    };
  }

  if (!vertexAI) {
    return {
      riskScore: 5,
      reasoning: {
        en: 'Vertex AI not configured. Defaulting to caution.',
        ms: 'Vertex AI tidak dikonfigurasi. Menggunakan pendekatan berhati-hati.',
      },
      action: 'FAMILY_CHECK',
    };
  }

  const systemPrompt = `You are the HEART Care Decision Engine for elderly homecare monitoring in Malaysia.

CRITICAL LANGUAGE INSTRUCTIONS:
Response MUST be valid JSON only with multilingual reasoning:
{
  "riskScore": <1-10>,
  "reasoning": { "en": "<clinical>", "ms": "<layperson Bahasa Malaysia>" },
  "action": "<MONITOR | FAMILY_CHECK | CLINIC_VISIT | CALL_999>"
}

Risk: 1-3=Stable, 4-5=Family check, 6-8=Clinic visit, 9-10=Emergency`;

  const userPrompt = `PATIENT SNAPSHOT:
- Heart Rate: ${input.averageHeartRate} bpm
- Daily Steps: ${input.dailySteps}
- Days Since Last Response: ${input.daysSinceLastCheckin}

Provide risk assessment as JSON.`;

  try {
    const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON response');
    return OutputSchema.parse(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('❌ [snapshotDecisionFlow]:', (error as Error).message);
    return {
      riskScore: 5,
      reasoning: {
        en: 'System unable to process. Defaulting to caution.',
        ms: 'Sistem tidak dapat memproses. Menggunakan pendekatan berhati-hati.',
      },
      action: 'FAMILY_CHECK',
    };
  }
}

/**
 * FLOW 2: Enhanced Decision with Trend Analysis (Full Intelligence)
 */
export async function enhancedDecisionFlow(input: EnhancedInput): Promise<EnhancedOutput> {
  const decisionId = `dec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  try {
    let baseline = input.patientBaseline;
    if (!baseline) {
      baseline = {
        typicalHeartRate: input.last7DaysAverageHeartRate || input.averageHeartRate,
        typicalDailySteps: input.last7DaysAverageSteps || input.dailySteps,
        typicalSleepHours: 7,
      };
    }

    const fullBaseline: PatientBaseline = {
      patientId: input.patientId,
      averageHeartRate: baseline.typicalHeartRate,
      averageSteps: baseline.typicalDailySteps,
      averageSleepDuration: baseline.typicalSleepHours || 7,
      typicalActivityPattern: 'mixed',
      lastBaselineUpdate: new Date(),
    };

    const mockHistoricalData = [
      { timestamp: new Date(Date.now() - 7 * 86400000), heartRate: baseline.typicalHeartRate, steps: baseline.typicalDailySteps },
      { timestamp: new Date(), heartRate: input.averageHeartRate, steps: input.dailySteps },
    ];

    const trends = computeTrendMetrics(mockHistoricalData, fullBaseline);
    const currentData = { timestamp: input.timestamp, heartRate: input.averageHeartRate, steps: input.dailySteps, sleepDuration: input.sleepHours };
    const riskFactors = aggregateRiskFactors(trends, currentData, fullBaseline, input.checkInResponseRate || 80, input.missedCheckinsThisWeek);
    const applicableGuidelines = await retrieveRelevantGuidelines(riskFactors);
    const declinePatterns = detectDeclinePatterns(trends, currentData, fullBaseline);
    const ragPrompt = buildRAGEnrichedPrompt(applicableGuidelines);

    const analysisPrompt = `PATIENT ASSESSMENT (Malaysian Elderly Care):

Current: HR ${input.averageHeartRate} bpm (baseline ${fullBaseline.averageHeartRate}), Steps ${input.dailySteps} (baseline ${fullBaseline.averageSteps}), ${input.daysSinceLastCheckin} days since check-in, Response rate ${input.checkInResponseRate || 80}%

Trends: HR ${trends.heartRateVelocity > 0 ? '↑' : '↓'} ${Math.abs(trends.heartRateVelocity).toFixed(1)}/day, Steps ${trends.stepsVelocity > 0 ? '↑' : '↓'} ${Math.abs(trends.stepsVelocity).toFixed(0)}/day, Direction: ${trends.trendDirection}

Risk: CV ${riskFactors.cardiovascularRisk}/10, Mobility ${riskFactors.mobilityRisk}/10, Engagement ${riskFactors.engagementRisk}/10

Patterns: ${declinePatterns.length > 0 ? declinePatterns.join('; ') : 'None'}

MUST respond with valid JSON only:
{
  "riskScore": <1-10>,
  "reasoning": { "en": "<clinical>", "ms": "<layperson BM>" },
  "actionPlan": { "en": "<steps>", "ms": "<langkah>" },
  "action": "<MONITOR|FAMILY_CHECK|CLINIC_VISIT|CALL_999>",
  "estimatedOutcome": { "en": "<prognosis>", "ms": "<jangkaan>" }
}`;

    if (!vertexAI) {
      return buildFallbackEnhancedOutput(decisionId, riskFactors, trends, fullBaseline, input, applicableGuidelines);
    }

    const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`${ragPrompt}\n\n${analysisPrompt}`);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON response');

    const output = JSON.parse(jsonMatch[0]) as EnhancedOutput;
    const validation = validateDecisionAgainstGuidelines(output.riskScore, output.action, applicableGuidelines);
    if (!validation.isValid) console.warn('Decision validation:', validation.warnings);

    const confidence = assessDecisionConfidence(trends, riskFactors);

    return {
      ...output,
      decisionId,
      confidencePercent: confidence,
      riskFactors: { ...riskFactors },
      trendInsights: {
        direction: trends.trendDirection,
        percentChange: ((input.dailySteps - fullBaseline.averageSteps) / fullBaseline.averageSteps) * 100,
        velocity: trends.stepsVelocity < -30 ? 'steep decline' : trends.stepsVelocity < 0 ? 'gradual decline' : 'stable',
      },
      referencedGuidelines: applicableGuidelines.map(g => g.source),
    };
  } catch (error) {
    console.error('❌ [enhancedDecisionFlow]:', (error as Error).message);
    return {
      riskScore: 5,
      reasoning: { en: 'System unable to complete analysis.', ms: 'Sistem tidak dapat menyelesaikan analisis.' },
      action: 'FAMILY_CHECK',
      decisionId,
      confidencePercent: 20,
      riskFactors: { cardiovascularRisk: 5, mobilityRisk: 5, engagementRisk: 5, socialRisk: 5, combinedRiskScore: 5 },
      trendInsights: { direction: 'stable', percentChange: 0, velocity: 'unknown' },
      referencedGuidelines: [],
      estimatedOutcome: { en: 'Unable to establish prognosis', ms: 'Tidak dapat menentukan prognosis' },
    };
  }
}

function buildFallbackEnhancedOutput(
  decisionId: string, riskFactors: any, trends: any,
  baseline: any, input: any, guidelines: any[]
): EnhancedOutput {
  // Deterministic fallback when Vertex AI is unavailable
  let action: 'MONITOR' | 'FAMILY_CHECK' | 'CLINIC_VISIT' | 'CALL_999' = 'MONITOR';
  let riskScore = riskFactors.combinedRiskScore;

  if (input.daysSinceLastCheckin > 1 && input.dailySteps < 50) { action = 'CALL_999'; riskScore = 10; }
  else if (riskFactors.combinedRiskScore >= 8) { action = 'CALL_999'; riskScore = 9; }
  else if (riskFactors.combinedRiskScore >= 5) { action = 'CLINIC_VISIT'; riskScore = Math.round(riskFactors.combinedRiskScore); }
  else if (riskFactors.combinedRiskScore >= 3) { action = 'FAMILY_CHECK'; riskScore = Math.round(riskFactors.combinedRiskScore); }
  else { action = 'MONITOR'; riskScore = Math.max(1, Math.round(riskFactors.combinedRiskScore)); }

  return {
    riskScore,
    reasoning: { en: `Deterministic assessment (Vertex AI offline). Combined risk: ${riskFactors.combinedRiskScore}/10.`, ms: `Penilaian deterministik (Vertex AI luar talian). Risiko gabungan: ${riskFactors.combinedRiskScore}/10.` },
    actionPlan: { en: `Action: ${action}. Review within 24 hours.`, ms: `Tindakan: ${action}. Semak dalam 24 jam.` },
    action,
    decisionId,
    confidencePercent: 50,
    riskFactors: { ...riskFactors },
    trendInsights: { direction: trends.trendDirection, percentChange: 0, velocity: 'unknown' },
    referencedGuidelines: guidelines.map((g: any) => g.source),
    estimatedOutcome: { en: 'Pending AI evaluation', ms: 'Menunggu penilaian AI' },
  };
}

/**
 * FLOW 3: Dashboard Aggregation Flow
 */
export async function dashboardAggregationFlow(input: EnhancedInput): Promise<CareDecision> {
  const decision = await enhancedDecisionFlow(input);
  return {
    patientId: input.patientId,
    decisionId: decision.decisionId || `dec_${Date.now()}`,
    timestamp: input.timestamp,
    riskScore: decision.riskScore,
    riskFactors: decision.riskFactors || { cardiovascularRisk: 0, mobilityRisk: 0, engagementRisk: 0, socialRisk: 0, combinedRiskScore: 0 },
    reasoning: decision.reasoning,
    action: decision.action,
    trends: { heartRateVelocity: 0, stepsVelocity: 0, heartRateAnomaly: 0, stepsAnomaly: 0, engagementScore: input.checkInResponseRate || 80, trendDirection: decision.trendInsights?.direction || 'stable', confidencePercent: decision.confidencePercent || 50 },
    confidencePercent: decision.confidencePercent || 50,
    medicalGuidelinesApplied: decision.referencedGuidelines || [],
    estimatedOutcome: decision.estimatedOutcome,
  };
}

export default { snapshotDecisionFlow, enhancedDecisionFlow, dashboardAggregationFlow };
