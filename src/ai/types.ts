/**
 * HEART Backend Type Definitions
 * Shared interfaces for type-safe AI workflows
 */

/**
 * Multilingual text content (English, Bahasa Malaysia)
 * Used for internationalized responses
 */
export interface MultilingualText {
  en: string;
  ms: string;
}

/**
 * Emergency contact for patient
 * Malaysian healthcare context: Family notification for elderly care
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string; // Malaysian format: "60123456789"
}

/**
 * Patient profile with emergency contacts for WhatsApp integration
 */
export interface PatientProfile {
  patientId: string;
  name: string;
  emergencyContacts: EmergencyContact[];
  preferredLanguage: 'en' | 'ms';
}

/**
 * Raw hardware telemetry from wearable devices
 */
export interface WearableDataPoint {
  timestamp: Date;
  heartRate: number;
  steps: number;
  sleepDuration?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  distanceTraveled?: number;
}

/**
 * Patient's baseline for normalization
 */
export interface PatientBaseline {
  patientId: string;
  averageHeartRate: number;
  averageSteps: number;
  averageSleepDuration: number;
  typicalActivityPattern: string;
  lastBaselineUpdate: Date;
}

/**
 * Computed trend metrics over a time window
 */
export interface TrendMetrics {
  heartRateVelocity: number;
  stepsVelocity: number;
  heartRateAnomaly: number;
  stepsAnomaly: number;
  sleepAnomaly?: number;
  engagementScore: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  confidencePercent: number;
}

/**
 * Multi-factor risk assessment
 */
export interface RiskFactors {
  cardiovascularRisk: number;
  mobilityRisk: number;
  engagementRisk: number;
  socialRisk: number;
  combinedRiskScore: number;
}

/**
 * Care decision with extended context
 */
export interface CareDecision {
  patientId: string;
  decisionId: string;
  timestamp: Date;
  riskScore: number;
  riskFactors: RiskFactors;
  reasoning: MultilingualText;
  actionPlan?: MultilingualText;
  action: 'MONITOR' | 'FAMILY_CHECK' | 'CLINIC_VISIT' | 'CALL_999';
  trends: TrendMetrics;
  confidencePercent: number;
  medicalGuidelinesApplied: string[];
  estimatedOutcome?: MultilingualText;
}

/**
 * Caregiver dashboard intelligence payload
 */
export interface CaregiversInsights {
  patientId: string;
  patientName: string;
  riskStatus: 'green' | 'yellow' | 'orange' | 'red';
  riskTrend: 'improving' | 'stable' | 'declining';
  riskPercentChange: number;
  lastDecision: CareDecision;
  keyMetrics: {
    avgHeartRate: number;
    avgSteps: number;
    checkInResponse: number;
    daysSinceLastActivity: number;
  };
  alerts: MultilingualText[];
  recommendedActions: MultilingualText[];
  nextReviewDue: Date;
  whatsappPayloads?: { [contactIndex: number]: string };
  whatsappDeepLinks?: { [contactIndex: number]: string };
}

/**
 * Medical guideline entry (from RAG system)
 */
export interface MedicalGuideline {
  id: string;
  category: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  triggers: string[];
  recommendedActions: string[];
  source: string;
  evidence: string;
  retrievalSource?: 'vertex_search' | 'mock';
}

/**
 * Error response for API contracts
 */
export interface ErrorResponse {
  error: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  traceId?: string;
}
