/**
 * Analytics Engine for HEART
 *
 * Detects gradual behavioral decline through:
 * 1. Velocity Analysis (rate of change, not absolute values)
 * 2. Anomaly Detection (deviation from patient's personal baseline)
 * 3. Multi-factor Risk Aggregation (weighted combination of signals)
 * 4. Temporal Normalization (accounting for day-of-week, time patterns)
 */

import { WearableDataPoint, PatientBaseline, TrendMetrics, RiskFactors } from './types.js';

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b) / values.length;
  const squareDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b) / values.length);
}

function anomalyToScore(stdDevs: number): number {
  return 1 / (1 + Math.exp(-stdDevs));
}

function calculateVelocity(dataPoints: WearableDataPoint[], metric: 'steps' | 'heartRate'): number {
  if (dataPoints.length < 2) return 0;
  const sorted = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const field = metric as keyof WearableDataPoint;
  const deltaValue = (last[field] as number) - (first[field] as number);
  const deltaTime = (last.timestamp.getTime() - first.timestamp.getTime()) / (1000 * 60 * 60 * 24);
  return deltaTime > 0 ? deltaValue / deltaTime : 0;
}

export function computeTrendMetrics(
  dataPoints: WearableDataPoint[],
  baseline: PatientBaseline
): TrendMetrics {
  if (dataPoints.length === 0) {
    return {
      heartRateVelocity: 0, stepsVelocity: 0, heartRateAnomaly: 0,
      stepsAnomaly: 0, engagementScore: 0, trendDirection: 'stable', confidencePercent: 0,
    };
  }
  const sorted = [...dataPoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const stepsVelocity = calculateVelocity(sorted, 'steps');
  const heartRateVelocity = calculateVelocity(sorted, 'heartRate');
  const currentSteps = sorted[sorted.length - 1].steps;
  const currentHeartRate = sorted[sorted.length - 1].heartRate;
  const stepsValues = sorted.map((d) => d.steps);
  const heartRateValues = sorted.map((d) => d.heartRate);
  const stepsStdDev = calculateStdDev(stepsValues);
  const heartRateStdDev = calculateStdDev(heartRateValues);
  const stepsDeviation = (currentSteps - baseline.averageSteps) / (stepsStdDev || 1);
  const heartRateDeviation = (currentHeartRate - baseline.averageHeartRate) / (heartRateStdDev || 1);
  const stepsAnomaly = Math.max(0, Math.min(1, anomalyToScore(Math.abs(stepsDeviation))));
  const heartRateAnomaly = Math.max(0, Math.min(1, anomalyToScore(Math.abs(heartRateDeviation))));

  let sleepAnomaly = 0;
  if (sorted[sorted.length - 1].sleepDuration && baseline.averageSleepDuration) {
    const sleepDiff = sorted[sorted.length - 1].sleepDuration! - baseline.averageSleepDuration;
    sleepAnomaly = anomalyToScore(Math.abs(sleepDiff));
  }

  let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
  if (stepsVelocity < -30 && heartRateVelocity < -2) trendDirection = 'declining';
  else if (stepsVelocity > 30 && heartRateAnomaly < 0.3) trendDirection = 'improving';

  const confidencePercent = Math.min(100, sorted.length * 10);
  return {
    heartRateVelocity, stepsVelocity, heartRateAnomaly, stepsAnomaly, sleepAnomaly,
    engagementScore: 0, trendDirection, confidencePercent,
  };
}

export function aggregateRiskFactors(
  trends: TrendMetrics, currentData: WearableDataPoint,
  baseline: PatientBaseline, engagementScore: number,
  missedCheckinsThisWeek?: number
): RiskFactors {
  let cardiovascularRisk = 1;
  if (trends.heartRateAnomaly > 0.7) cardiovascularRisk = 8 + (trends.heartRateAnomaly - 0.7) * 20;
  else if (trends.heartRateAnomaly > 0.5) cardiovascularRisk = 5 + (trends.heartRateAnomaly - 0.5) * 20;
  else if (trends.heartRateAnomaly > 0.3) cardiovascularRisk = 3 + (trends.heartRateAnomaly - 0.3) * 10;
  cardiovascularRisk = Math.min(10, Math.max(1, cardiovascularRisk));

  let mobilityRisk = 1;
  const stepsPercentOfBaseline = (currentData.steps / baseline.averageSteps) * 100;
  if (stepsPercentOfBaseline < 30) mobilityRisk = 9;
  else if (stepsPercentOfBaseline < 50) mobilityRisk = 7;
  else if (stepsPercentOfBaseline < 70) mobilityRisk = 5;
  else if (stepsPercentOfBaseline < 85) mobilityRisk = 3;
  if (trends.stepsVelocity < -50) mobilityRisk = Math.min(10, mobilityRisk + 2);

  let engagementRisk = 1;
  if (engagementScore < 50) engagementRisk = 9;
  else if (engagementScore < 70) engagementRisk = 6;
  else if (engagementScore < 85) engagementRisk = 3;
  if (missedCheckinsThisWeek && missedCheckinsThisWeek > 3) engagementRisk = Math.min(10, engagementRisk + 2);

  const socialRisk = 2;
  const combinedRiskScore = engagementRisk * 0.4 + mobilityRisk * 0.35 + cardiovascularRisk * 0.2 + socialRisk * 0.05;

  return {
    cardiovascularRisk: Math.round(cardiovascularRisk * 10) / 10,
    mobilityRisk: Math.round(mobilityRisk * 10) / 10,
    engagementRisk: Math.round(engagementRisk * 10) / 10,
    socialRisk: Math.round(socialRisk * 10) / 10,
    combinedRiskScore: Math.round(Math.min(10, Math.max(1, combinedRiskScore)) * 10) / 10,
  };
}

export function detectDeclinePatterns(
  trends: TrendMetrics, currentData: WearableDataPoint, baseline: PatientBaseline
): string[] {
  const patterns: string[] = [];
  const stepsRatio = currentData.steps / baseline.averageSteps;
  if (stepsRatio < 0.5 && trends.stepsVelocity < -50)
    patterns.push('Severe mobility decline: 50% reduction in daily activity over past week');
  else if (stepsRatio < 0.7 && trends.stepsVelocity < -30)
    patterns.push('Moderate mobility decline: Consistent decrease in daily movement');
  if (trends.sleepAnomaly && trends.sleepAnomaly > 0.6)
    patterns.push('Sleep pattern abnormality: Significant deviation from typical sleep duration');
  if (trends.heartRateVelocity > 3 && trends.heartRateAnomaly > 0.5)
    patterns.push('Elevated heart rate trend: May indicate stress, infection, or cardiac strain');
  if (currentData.steps < 100 && trends.stepsVelocity === 0)
    patterns.push('Sedentary behavior: Patient showing minimal movement for extended period');
  return patterns;
}

export function assessDecisionConfidence(trends: TrendMetrics, riskFactors: RiskFactors): number {
  let confidence = trends.confidencePercent;
  if (Math.abs(riskFactors.mobilityRisk - riskFactors.cardiovascularRisk) > 4) confidence -= 10;
  if (trends.heartRateAnomaly > 0.8 || trends.stepsAnomaly > 0.8) confidence -= 15;
  return Math.max(20, Math.min(100, confidence));
}
