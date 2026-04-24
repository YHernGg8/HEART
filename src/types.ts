// ============================================================================
// HEART: Core TypeScript Interfaces
// ============================================================================

/** Bilingual text for EN/BM support */
export interface MultilingualText {
  en: string;
  ms: string;
}

/** Risk action levels - ordered by severity */
export type CareAction = 'MONITOR' | 'FAMILY_CHECK' | 'CLINIC_VISIT' | 'CALL_999';

/** Risk color mapping */
export type RiskColor = 'green' | 'yellow' | 'orange' | 'red';

/** Supported languages */
export type Language = 'en' | 'ms';

/** Trend direction */
export type TrendDirection = 'improving' | 'stable' | 'declining' | 'critical';

/** Trend velocity */
export type TrendVelocity = 'stable' | 'gradual' | 'rapid' | 'acute';

/** Emergency contact for WhatsApp integration */
export interface EmergencyContact {
  name: string;
  phone: string;         // Malaysian format: 60XXXXXXXXX
  relationship: string;
  preferredLanguage: Language;
}

/** Patient baseline metrics */
export interface PatientBaseline {
  averageHeartRate: number;
  averageSteps: number;
  typicalSleepHours: number;
}

/** Patient profile */
export interface PatientProfile {
  patientId: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  preferredLanguage: Language;
  emergencyContacts: EmergencyContact[];
  baseline: PatientBaseline;
  medicalConditions: string[];
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

/** Snapshot input (quick assessment) */
export interface SnapshotInput {
  averageHeartRate: number;
  dailySteps: number;
  daysSinceLastCheckin: number;
}

/** Enhanced input (full pipeline) */
export interface EnhancedInput {
  patientId: string;
  timestamp: string;
  averageHeartRate: number;
  dailySteps: number;
  daysSinceLastCheckin: number;
  last7DaysAverageSteps?: number;
  last7DaysAverageHeartRate?: number;
  checkInResponseRate?: number;
  missedCheckinsThisWeek?: number;
  patientBaseline?: PatientBaseline;
}

/** Risk factors breakdown */
export interface RiskFactors {
  cardiovascularRisk: number;
  mobilityRisk: number;
  engagementRisk: number;
  socialRisk: number;
  combinedRiskScore: number;
}

/** Trend insights */
export interface TrendInsights {
  direction: TrendDirection;
  percentChange: number;
  velocity: TrendVelocity;
}

/** Decision output from AI */
export interface DecisionOutput {
  riskScore: number;
  reasoning: MultilingualText;
  actionPlan: MultilingualText;
  estimatedOutcome: MultilingualText;
  action: CareAction;
  decisionId: string;
  confidencePercent: number;
  riskFactors: RiskFactors;
  trendInsights: TrendInsights;
  referencedGuidelines: string[];
}

/** Dashboard patient card */
export interface DashboardPatient {
  patientId: string;
  patientName: string;
  age: number;
  gender: 'M' | 'F';
  riskStatus: RiskColor;
  riskTrend: TrendDirection;
  riskPercentChange: number;
  lastDecision: DecisionOutput;
  keyMetrics: {
    avgHeartRate: number;
    avgSteps: number;
    checkInResponse: number;
  };
  alerts: MultilingualText[];
  recommendedActions: MultilingualText[];
  nextReviewDue: string;
  whatsappDeepLinks: Record<string, string>;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  telemetryBaseline: {
    day: string;
    heartRate: number;
    steps: number;
  }[];
  telemetryCurrent: {
    day: string;
    heartRate: number;
    steps: number;
  }[];
}

/** Cohort summary for admin dashboard */
export interface CohortSummary {
  cohortSize: number;
  riskDistribution: {
    critical: number;
    high: number;
    moderate: number;
    stable: number;
  };
  criticalAlerts: number;
  averageRiskScore: number;
  actionItemsToday: number;
  timestamp: string;
}

/** Field dispatch status */
export type DispatchStatus = 'pending' | 'en_route' | 'on_scene' | 'transporting' | 'completed';

/** User roles */
export type UserRole = 'user' | 'operator' | 'field' | 'hospital';

// ============================================================================
// Utility Functions
// ============================================================================

/** Map risk score to traffic light color */
export function getRiskColor(score: number): RiskColor {
  if (score <= 3) return 'green';
  if (score <= 5) return 'yellow';
  if (score <= 8) return 'orange';
  return 'red';
}

/** Map risk color to Tailwind classes */
export function getRiskColorClasses(color: RiskColor): { bg: string; text: string; border: string; badge: string } {
  switch (color) {
    case 'green':
      return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400' };
    case 'yellow':
      return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500', badge: 'bg-amber-500/20 text-amber-400' };
    case 'orange':
      return { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', badge: 'bg-orange-500/20 text-orange-400' };
    case 'red':
      return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', badge: 'bg-red-500/20 text-red-400' };
  }
}

/** Map action to user-friendly label */
export function getActionLabel(action: CareAction): MultilingualText {
  switch (action) {
    case 'MONITOR':
      return { en: 'All Clear - Monitoring', ms: 'Semua Baik - Pemantauan' };
    case 'FAMILY_CHECK':
      return { en: 'Family Check Required', ms: 'Semakan Keluarga Diperlukan' };
    case 'CLINIC_VISIT':
      return { en: 'Clinic Visit Recommended', ms: 'Lawatan Klinik Disyorkan' };
    case 'CALL_999':
      return { en: 'Emergency - Call 999', ms: 'Kecemasan - Hubungi 999' };
  }
}

/** Map action to emoji */
export function getActionEmoji(action: CareAction): string {
  switch (action) {
    case 'MONITOR': return '✅';
    case 'FAMILY_CHECK': return '⚠️';
    case 'CLINIC_VISIT': return '🏥';
    case 'CALL_999': return '🚨';
  }
}
