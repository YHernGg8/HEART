/**
 * HEART Demo Scenarios for Backend API
 */

export const DEMO_SCENARIOS: Record<string, {
  name: string;
  expectedAction: string;
  snapshot: any;
  baseline: any;
}> = {
  stable_patient: {
    name: 'Ahmad bin Abdullah',
    expectedAction: 'MONITOR',
    snapshot: {
      patientId: 'pat_001',
      timestamp: new Date(),
      averageHeartRate: 74,
      dailySteps: 5200,
      daysSinceLastCheckin: 0,
      checkInResponseRate: 95,
    },
    baseline: { averageHeartRate: 72, averageSteps: 5500, averageSleepDuration: 7.5 },
  },
  gradual_decline: {
    name: 'Mary Tan Siew Lian',
    expectedAction: 'FAMILY_CHECK',
    snapshot: {
      patientId: 'pat_002',
      timestamp: new Date(),
      averageHeartRate: 75,
      dailySteps: 3000,
      daysSinceLastCheckin: 1,
      checkInResponseRate: 80,
    },
    baseline: { averageHeartRate: 68, averageSteps: 4000, averageSleepDuration: 8 },
  },
  urgent_clinic: {
    name: 'Rajendran a/l Muthu',
    expectedAction: 'CLINIC_VISIT',
    snapshot: {
      patientId: 'pat_003',
      timestamp: new Date(),
      averageHeartRate: 85,
      dailySteps: 3300,
      daysSinceLastCheckin: 1,
      checkInResponseRate: 60,
    },
    baseline: { averageHeartRate: 70, averageSteps: 6000, averageSleepDuration: 7 },
  },
  critical_alert: {
    name: 'Fatimah binti Hassan',
    expectedAction: 'CALL_999',
    snapshot: {
      patientId: 'pat_004',
      timestamp: new Date(),
      averageHeartRate: 95,
      dailySteps: 200,
      daysSinceLastCheckin: 2,
      checkInResponseRate: 20,
    },
    baseline: { averageHeartRate: 76, averageSteps: 3000, averageSleepDuration: 8.5 },
  },
  excellent_health: {
    name: 'Wong Ah Kow',
    expectedAction: 'MONITOR',
    snapshot: {
      patientId: 'pat_005',
      timestamp: new Date(),
      averageHeartRate: 64,
      dailySteps: 9500,
      daysSinceLastCheckin: 0,
      checkInResponseRate: 100,
    },
    baseline: { averageHeartRate: 65, averageSteps: 8000, averageSleepDuration: 6.5 },
  },
};
