/**
 * HEART Zod Validation Schemas (Production)
 */
import { z } from 'zod';

const MultilingualTextSchema = z.object({
  en: z.string().describe('English text'),
  ms: z.string().describe('Bahasa Malaysia text'),
});

// --- Input Schemas ---

export const SnapshotInputSchema = z.object({
  averageHeartRate: z.number().min(30).max(220).describe('Current average heart rate (BPM)'),
  dailySteps: z.number().min(0).max(50000).describe('Steps taken today'),
  daysSinceLastCheckin: z.number().min(0).max(30).describe('Days since patient last checked in'),
});

export const EnhancedInputSchema = z.object({
  patientId: z.string().describe('Unique patient identifier'),
  timestamp: z.coerce.date().describe('Timestamp of the reading'),
  averageHeartRate: z.number().min(30).max(220),
  dailySteps: z.number().min(0).max(50000),
  daysSinceLastCheckin: z.number().min(0).max(30),
  last7DaysAverageSteps: z.number().min(0).optional(),
  last7DaysAverageHeartRate: z.number().min(30).max(220).optional(),
  checkInResponseRate: z.number().min(0).max(100).optional(),
  missedCheckinsThisWeek: z.number().min(0).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  patientBaseline: z.object({
    typicalHeartRate: z.number(),
    typicalDailySteps: z.number(),
    typicalSleepHours: z.number().optional(),
  }).optional(),
});

// --- Output Schemas ---

const CareActionSchema = z.enum(['MONITOR', 'FAMILY_CHECK', 'CLINIC_VISIT', 'CALL_999']);

const RiskFactorsSchema = z.object({
  cardiovascularRisk: z.number().min(0).max(10),
  mobilityRisk: z.number().min(0).max(10),
  engagementRisk: z.number().min(0).max(10),
  socialRisk: z.number().min(0).max(10),
  combinedRiskScore: z.number().min(0).max(10),
});

export const OutputSchema = z.object({
  riskScore: z.number().min(1).max(10),
  reasoning: MultilingualTextSchema,
  action: CareActionSchema,
});

export const EnhancedOutputSchema = z.object({
  riskScore: z.number().min(1).max(10),
  reasoning: MultilingualTextSchema,
  actionPlan: MultilingualTextSchema.optional(),
  estimatedOutcome: MultilingualTextSchema.optional(),
  action: CareActionSchema,
  decisionId: z.string().optional(),
  confidencePercent: z.number().min(0).max(100).optional(),
  riskFactors: RiskFactorsSchema.optional(),
  trendInsights: z.object({
    direction: z.enum(['improving', 'stable', 'declining', 'critical']),
    percentChange: z.number(),
    velocity: z.string(),
  }).optional(),
  referencedGuidelines: z.array(z.string()).optional(),
});

// --- Type Exports ---
export type SnapshotInput = z.infer<typeof SnapshotInputSchema>;
export type EnhancedInput = z.infer<typeof EnhancedInputSchema>;
export type Output = z.infer<typeof OutputSchema>;
export type EnhancedOutput = z.infer<typeof EnhancedOutputSchema>;
