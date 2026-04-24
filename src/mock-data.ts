// ============================================================================
// HEART: Mock Data - Realistic Demo Scenarios for Hackathon
// ============================================================================

import type { PatientProfile, DecisionOutput, DashboardPatient } from './types';
import { transformToDashboardPatient, generateCohortSummary } from './dashboard-service';

// ============================================================================
// Patient Profiles
// ============================================================================

export const patientProfiles: PatientProfile[] = [
  {
    patientId: 'pat_001',
    name: 'Ahmad bin Abdullah',
    age: 78,
    gender: 'M',
    preferredLanguage: 'ms',
    emergencyContacts: [
      { name: 'Siti binti Ahmad', phone: '60191234567', relationship: 'Daughter', preferredLanguage: 'ms' },
      { name: 'Dr. Tan Wei Ming', phone: '60187654321', relationship: 'GP', preferredLanguage: 'en' },
    ],
    baseline: { averageHeartRate: 72, averageSteps: 5500, typicalSleepHours: 7.5 },
    medicalConditions: ['Hypertension', 'Type 2 Diabetes'],
    location: { lat: 3.1390, lng: 101.6869, address: '12 Jalan Bukit Bintang, KL' },
  },
  {
    patientId: 'pat_002',
    name: 'Mary Tan Siew Lian',
    age: 82,
    gender: 'F',
    preferredLanguage: 'en',
    emergencyContacts: [
      { name: 'James Tan', phone: '60123456789', relationship: 'Son', preferredLanguage: 'en' },
      { name: 'Susan Tan', phone: '60198765432', relationship: 'Daughter', preferredLanguage: 'en' },
    ],
    baseline: { averageHeartRate: 68, averageSteps: 4000, typicalSleepHours: 8 },
    medicalConditions: ['Osteoarthritis', 'Mild Cognitive Impairment'],
    location: { lat: 3.1576, lng: 101.7122, address: '45 Jalan Ampang, KL' },
  },
  {
    patientId: 'pat_003',
    name: 'Rajendran a/l Muthu',
    age: 75,
    gender: 'M',
    preferredLanguage: 'ms',
    emergencyContacts: [
      { name: 'Priya a/p Rajendran', phone: '60171234567', relationship: 'Daughter', preferredLanguage: 'ms' },
    ],
    baseline: { averageHeartRate: 70, averageSteps: 6000, typicalSleepHours: 7 },
    medicalConditions: ['Coronary Artery Disease', 'Chronic Kidney Disease Stage 3'],
    location: { lat: 3.0738, lng: 101.5183, address: '89 Jalan Klang Lama, KL' },
  },
  {
    patientId: 'pat_004',
    name: 'Fatimah binti Hassan',
    age: 85,
    gender: 'F',
    preferredLanguage: 'ms',
    emergencyContacts: [
      { name: 'Mohd Amin bin Hassan', phone: '60161234567', relationship: 'Son', preferredLanguage: 'ms' },
      { name: 'Normah binti Hassan', phone: '60141234567', relationship: 'Daughter', preferredLanguage: 'ms' },
    ],
    baseline: { averageHeartRate: 76, averageSteps: 3000, typicalSleepHours: 8.5 },
    medicalConditions: ['Heart Failure (NYHA II)', 'Osteoporosis', 'Depression'],
    location: { lat: 3.1209, lng: 101.6538, address: '23 Jalan Bangsar, KL' },
  },
  {
    patientId: 'pat_005',
    name: 'Wong Ah Kow',
    age: 71,
    gender: 'M',
    preferredLanguage: 'en',
    emergencyContacts: [
      { name: 'Wong Mei Ling', phone: '60111234567', relationship: 'Wife', preferredLanguage: 'en' },
    ],
    baseline: { averageHeartRate: 65, averageSteps: 8000, typicalSleepHours: 6.5 },
    medicalConditions: ['Hyperlipidemia'],
    location: { lat: 3.1500, lng: 101.7000, address: '7 Jalan Tun Razak, KL' },
  },
  {
    patientId: 'pat_006',
    name: 'Kamaruddin bin Osman',
    age: 80,
    gender: 'M',
    preferredLanguage: 'ms',
    emergencyContacts: [
      { name: 'Zainal bin Kamaruddin', phone: '60131234567', relationship: 'Son', preferredLanguage: 'ms' },
    ],
    baseline: { averageHeartRate: 74, averageSteps: 4500, typicalSleepHours: 7 },
    medicalConditions: ['COPD', 'Atrial Fibrillation'],
    location: { lat: 3.1000, lng: 101.6500, address: '56 Jalan Petaling, KL' },
  },
  {
    patientId: 'pat_007',
    name: 'Letchumi a/p Krishnan',
    age: 77,
    gender: 'F',
    preferredLanguage: 'ms',
    emergencyContacts: [
      { name: 'Kumar a/l Krishnan', phone: '60151234567', relationship: 'Son', preferredLanguage: 'en' },
    ],
    baseline: { averageHeartRate: 69, averageSteps: 5000, typicalSleepHours: 7.5 },
    medicalConditions: ['Type 2 Diabetes', 'Peripheral Neuropathy'],
    location: { lat: 3.1300, lng: 101.6800, address: '34 Jalan Cheras, KL' },
  },
  {
    patientId: 'pat_008',
    name: 'Lee Chong Wei',
    age: 73,
    gender: 'M',
    preferredLanguage: 'en',
    emergencyContacts: [
      { name: 'Lee Mei Fong', phone: '60181234567', relationship: 'Wife', preferredLanguage: 'en' },
      { name: 'Lee Jun Wei', phone: '60191234568', relationship: 'Son', preferredLanguage: 'en' },
    ],
    baseline: { averageHeartRate: 62, averageSteps: 10000, typicalSleepHours: 7 },
    medicalConditions: ['None - previously active athlete'],
    location: { lat: 3.1600, lng: 101.7200, address: '15 Jalan Duta, KL' },
  },
];

// ============================================================================
// Pre-computed mock decisions (simulating AI output for demo)
// ============================================================================

const mockDecisions: Record<string, DecisionOutput> = {
  pat_001: {
    riskScore: 2,
    reasoning: {
      en: 'Patient stable across all metrics. Heart rate within normal range at 74 BPM. Daily activity of 5200 steps aligns with baseline of 5500. Regular check-in compliance. Blood pressure medication appears well-managed based on stable cardiovascular indicators.',
      ms: 'Pesakit stabil di semua metrik. Degupan jantung dalam julat normal pada 74 BPM. Aktiviti harian 5200 langkah sejajar dengan asas 5500. Pematuhan semakan berkala. Ubat tekanan darah kelihatan terurus dengan baik berdasarkan petunjuk kardiovaskular yang stabil.',
    },
    actionPlan: {
      en: 'Continue routine monitoring. Maintain daily check-in schedule. Next comprehensive review in 1 month. Encourage maintaining current activity levels.',
      ms: 'Teruskan pemantauan rutin. Kekalkan jadual semakan harian. Semakan menyeluruh seterusnya dalam 1 bulan. Galakkan mengekalkan tahap aktiviti semasa.',
    },
    estimatedOutcome: {
      en: 'Patient expected to remain stable with consistent monitoring. Low probability of adverse events in the next 30 days.',
      ms: 'Pesakit dijangka kekal stabil dengan pemantauan yang konsisten. Kebarangkalian rendah kejadian buruk dalam 30 hari akan datang.',
    },
    action: 'MONITOR',
    decisionId: 'dec_mock_001',
    confidencePercent: 94,
    riskFactors: { cardiovascularRisk: 1.8, mobilityRisk: 1.5, engagementRisk: 1.0, socialRisk: 1.2, combinedRiskScore: 1.4 },
    trendInsights: { direction: 'stable', percentChange: -5.5, velocity: 'stable' },
    referencedGuidelines: ['NHS_Elderly_Care_Pathway_2024', 'KKM_Warga_Emas_Guideline_2023'],
  },
  pat_002: {
    riskScore: 5,
    reasoning: {
      en: 'Moderate concern: 25% decline in daily steps over the past week (3000 vs baseline 4000). Heart rate slightly elevated at 75 BPM vs baseline 68. One missed check-in this week. Pattern consistent with early-stage mobility decline possibly related to osteoarthritis flare. Cognitive impairment may affect check-in compliance.',
      ms: 'Kebimbangan sederhana: Penurunan 25% dalam langkah harian sepanjang minggu lalu (3000 berbanding asas 4000). Degupan jantung sedikit meningkat pada 75 BPM berbanding asas 68. Satu semakan terlepas minggu ini. Corak konsisten dengan penurunan mobiliti peringkat awal mungkin berkaitan dengan kambuhan osteoartritis. Masalah kognitif mungkin menjejaskan pematuhan semakan.',
    },
    actionPlan: {
      en: 'Schedule family welfare check within 24 hours. Monitor for continued decline over next 48 hours. If decline continues, escalate to clinic visit. Review pain management for osteoarthritis.',
      ms: 'Jadualkan semakan kebajikan keluarga dalam 24 jam. Pantau penurunan berterusan selama 48 jam akan datang. Jika penurunan berterusan, tingkatkan ke lawatan klinik. Semak pengurusan kesakitan untuk osteoartritis.',
    },
    estimatedOutcome: {
      en: 'With family check and monitoring: 80% chance of stabilization. Without intervention: risk of progressive decline leading to fall risk within 2 weeks.',
      ms: 'Dengan semakan keluarga dan pemantauan: 80% peluang kestabilan. Tanpa campur tangan: risiko penurunan progresif yang membawa kepada risiko jatuh dalam 2 minggu.',
    },
    action: 'FAMILY_CHECK',
    decisionId: 'dec_mock_002',
    confidencePercent: 82,
    riskFactors: { cardiovascularRisk: 2.5, mobilityRisk: 4.2, engagementRisk: 3.0, socialRisk: 3.5, combinedRiskScore: 3.4 },
    trendInsights: { direction: 'declining', percentChange: -25, velocity: 'gradual' },
    referencedGuidelines: ['NHS_Elderly_Care_Pathway_2024', 'NICE_CG161_Falls_Prevention'],
  },
  pat_003: {
    riskScore: 7,
    reasoning: {
      en: 'High concern: Significant activity decline of 45% (3300 steps vs baseline 6000). Heart rate elevated to 85 BPM (baseline 70), suggesting cardiovascular stress. Check-in response rate dropped to 60%. Patient has existing coronary artery disease and CKD Stage 3. Combination of cardiac stress markers and reduced mobility warrants urgent clinical evaluation to rule out disease progression.',
      ms: 'Kebimbangan tinggi: Penurunan aktiviti ketara sebanyak 45% (3300 langkah berbanding asas 6000). Degupan jantung meningkat kepada 85 BPM (asas 70), menunjukkan tekanan kardiovaskular. Kadar tindak balas semakan turun ke 60%. Pesakit mempunyai penyakit arteri koronari dan CKD Tahap 3 sedia ada. Gabungan penanda tekanan jantung dan mobiliti berkurangan memerlukan penilaian klinikal segera untuk menolak perkembangan penyakit.',
    },
    actionPlan: {
      en: 'Schedule urgent clinic visit within 24 hours. Request bloods (renal function, troponin, BNP). ECG at clinic. Review cardiac medications. Contact family to arrange transport to clinic.',
      ms: 'Jadualkan lawatan klinik segera dalam 24 jam. Minta ujian darah (fungsi buah pinggang, troponin, BNP). ECG di klinik. Semak ubat jantung. Hubungi keluarga untuk mengatur pengangkutan ke klinik.',
    },
    estimatedOutcome: {
      en: 'With prompt clinic assessment: early detection of potential cardiac deterioration or CKD progression, enabling timely intervention. Without: risk of acute cardiac event within 7-14 days estimated at 15-20%.',
      ms: 'Dengan penilaian klinik segera: pengesanan awal kemungkinan kemerosotan jantung atau perkembangan CKD, membolehkan campur tangan tepat pada masanya. Tanpa: risiko kejadian jantung akut dalam 7-14 hari dianggarkan pada 15-20%.',
    },
    action: 'CLINIC_VISIT',
    decisionId: 'dec_mock_003',
    confidencePercent: 87,
    riskFactors: { cardiovascularRisk: 5.8, mobilityRisk: 5.5, engagementRisk: 3.5, socialRisk: 4.2, combinedRiskScore: 5.1 },
    trendInsights: { direction: 'declining', percentChange: -45, velocity: 'rapid' },
    referencedGuidelines: ['NHS_Elderly_Care_Pathway_2024', 'NICE_NG27_Transition_Care', 'RCP_NEWS2_Community'],
  },
  pat_004: {
    riskScore: 9,
    reasoning: {
      en: 'CRITICAL: Patient shows severe multi-system decline. Steps collapsed to 200 (baseline 3000, -93%). Heart rate erratic at 95 BPM (baseline 76). No check-in for 2 days. Known heart failure (NYHA II) and depression increase decompensation risk. Pattern suggests acute decompensated heart failure or severe depressive episode with self-neglect. Immediate emergency assessment required.',
      ms: 'KRITIKAL: Pesakit menunjukkan penurunan multi-sistem yang teruk. Langkah jatuh ke 200 (asas 3000, -93%). Degupan jantung tidak menentu pada 95 BPM (asas 76). Tiada semakan selama 2 hari. Kegagalan jantung sedia ada (NYHA II) dan kemurungan meningkatkan risiko dekompensasi. Corak menunjukkan kegagalan jantung dekompensasi akut atau episod kemurungan teruk dengan pengabaian diri. Penilaian kecemasan segera diperlukan.',
    },
    actionPlan: {
      en: 'CALL 999 immediately. Alert A&E of incoming heart failure patient. Notify all emergency contacts. Prepare medication list and recent telemetry for handover. Do not delay for further assessment.',
      ms: 'HUBUNGI 999 segera. Maklumkan A&E tentang pesakit kegagalan jantung yang akan tiba. Maklumkan semua kenalan kecemasan. Sediakan senarai ubat dan telemetri terkini untuk penghantaran. Jangan tangguh untuk penilaian lanjut.',
    },
    estimatedOutcome: {
      en: 'With immediate intervention: stabilization and likely hospital admission for heart failure management. Without: high risk of cardiac arrest or fatal decompensation within 24-48 hours.',
      ms: 'Dengan campur tangan segera: penstabilan dan kemungkinan kemasukan hospital untuk pengurusan kegagalan jantung. Tanpa: risiko tinggi serangan jantung atau dekompensasi maut dalam 24-48 jam.',
    },
    action: 'CALL_999',
    decisionId: 'dec_mock_004',
    confidencePercent: 95,
    riskFactors: { cardiovascularRisk: 8.5, mobilityRisk: 9.2, engagementRisk: 7.0, socialRisk: 8.0, combinedRiskScore: 8.5 },
    trendInsights: { direction: 'critical', percentChange: -93, velocity: 'acute' },
    referencedGuidelines: ['NHS_Emergency_Protocol_2024', 'MEMS_Malaysia_Emergency_Protocol', 'HEART_Critical_Deterioration_Criteria'],
  },
  pat_005: {
    riskScore: 1,
    reasoning: {
      en: 'Patient in excellent condition. Heart rate at optimal 64 BPM. Activity level of 9500 steps exceeds baseline of 8000. Perfect check-in compliance. No risk indicators detected. Previously active lifestyle maintained.',
      ms: 'Pesakit dalam keadaan cemerlang. Degupan jantung pada 64 BPM yang optimum. Tahap aktiviti 9500 langkah melebihi asas 8000. Pematuhan semakan sempurna. Tiada petunjuk risiko dikesan. Gaya hidup aktif sebelumnya dikekalkan.',
    },
    actionPlan: {
      en: 'Continue standard monitoring. No action required. Commend patient on maintaining excellent activity levels.',
      ms: 'Teruskan pemantauan standard. Tiada tindakan diperlukan. Puji pesakit kerana mengekalkan tahap aktiviti yang cemerlang.',
    },
    estimatedOutcome: {
      en: 'Excellent prognosis. Patient demonstrating protective health behaviors. Very low risk of adverse outcomes.',
      ms: 'Prognosis cemerlang. Pesakit menunjukkan tingkah laku kesihatan pelindung. Risiko sangat rendah kejadian buruk.',
    },
    action: 'MONITOR',
    decisionId: 'dec_mock_005',
    confidencePercent: 97,
    riskFactors: { cardiovascularRisk: 0.5, mobilityRisk: 0.3, engagementRisk: 0.2, socialRisk: 0.3, combinedRiskScore: 0.3 },
    trendInsights: { direction: 'improving', percentChange: 18.75, velocity: 'gradual' },
    referencedGuidelines: ['NHS_Elderly_Care_Pathway_2024'],
  },
  pat_006: {
    riskScore: 6,
    reasoning: {
      en: 'Moderate-high concern: Activity decline of 35% (2900 steps vs baseline 4500). Heart rate irregular at 82 BPM with known atrial fibrillation. Missed 1 check-in. COPD and AF combination increases risk of exacerbation. Step decline may indicate breathlessness on exertion, consistent with COPD worsening.',
      ms: 'Kebimbangan sederhana-tinggi: Penurunan aktiviti 35% (2900 langkah berbanding asas 4500). Degupan jantung tidak teratur pada 82 BPM dengan fibrilasi atrium yang diketahui. Terlepas 1 semakan. Gabungan COPD dan AF meningkatkan risiko pemburukan. Penurunan langkah mungkin menunjukkan sesak nafas semasa bersenam, konsisten dengan pemburukan COPD.',
    },
    actionPlan: {
      en: 'Schedule clinic visit within 48 hours. Check oxygen saturation and spirometry. Review COPD action plan and inhaler technique. Check INR/anticoagulation compliance for AF.',
      ms: 'Jadualkan lawatan klinik dalam 48 jam. Semak ketepuan oksigen dan spirometri. Semak pelan tindakan COPD dan teknik inhaler. Semak pematuhan INR/antikoagulasi untuk AF.',
    },
    estimatedOutcome: {
      en: 'With clinic visit: early detection of COPD exacerbation, medication adjustment. Without: risk of hospitalization for COPD exacerbation within 7 days.',
      ms: 'Dengan lawatan klinik: pengesanan awal pemburukan COPD, pelarasan ubat. Tanpa: risiko kemasukan hospital untuk pemburukan COPD dalam 7 hari.',
    },
    action: 'CLINIC_VISIT',
    decisionId: 'dec_mock_006',
    confidencePercent: 84,
    riskFactors: { cardiovascularRisk: 4.5, mobilityRisk: 4.8, engagementRisk: 2.5, socialRisk: 3.0, combinedRiskScore: 4.0 },
    trendInsights: { direction: 'declining', percentChange: -35.6, velocity: 'gradual' },
    referencedGuidelines: ['NHS_Elderly_Care_Pathway_2024', 'NICE_NG115_COPD', 'NICE_AF_Management_2021'],
  },
  pat_007: {
    riskScore: 4,
    reasoning: {
      en: 'Mild concern: Minor step decline of 15% (4250 steps vs baseline 5000). Heart rate normal at 71 BPM. Check-in response 85% (slightly below target). Peripheral neuropathy may be causing some days with reduced walking. No urgent flags but warrants family awareness.',
      ms: 'Kebimbangan ringan: Penurunan langkah kecil 15% (4250 langkah berbanding asas 5000). Degupan jantung normal pada 71 BPM. Tindak balas semakan 85% (sedikit di bawah sasaran). Neuropati periferal mungkin menyebabkan beberapa hari dengan perjalanan berkurangan. Tiada bendera segera tetapi perlu kesedaran keluarga.',
    },
    actionPlan: {
      en: 'Recommend family check-in call. Monitor step trend for next 3 days. If decline continues below 3500 steps, escalate to clinic visit. Review diabetic foot care compliance.',
      ms: 'Syorkan panggilan semakan keluarga. Pantau trend langkah selama 3 hari akan datang. Jika penurunan berterusan di bawah 3500 langkah, tingkatkan ke lawatan klinik. Semak pematuhan penjagaan kaki diabetik.',
    },
    estimatedOutcome: {
      en: 'Likely temporary dip. With monitoring: expected recovery to baseline within 5-7 days. Watch for diabetic foot complications.',
      ms: 'Kemungkinan penurunan sementara. Dengan pemantauan: dijangka pulih ke asas dalam 5-7 hari. Pantau komplikasi kaki diabetik.',
    },
    action: 'FAMILY_CHECK',
    decisionId: 'dec_mock_007',
    confidencePercent: 78,
    riskFactors: { cardiovascularRisk: 1.5, mobilityRisk: 3.0, engagementRisk: 2.0, socialRisk: 2.5, combinedRiskScore: 2.3 },
    trendInsights: { direction: 'declining', percentChange: -15, velocity: 'gradual' },
    referencedGuidelines: ['NHS_Elderly_Care_Pathway_2024', 'NICE_NG19_Diabetic_Foot'],
  },
  pat_008: {
    riskScore: 3,
    reasoning: {
      en: 'Patient generally well. Activity at 7500 steps, slightly below baseline 10000 but still above average for age group. Heart rate stable at 63 BPM. Perfect check-in record. Minor step reduction may reflect normal variation or slight fatigue. Previously athletic background provides good functional reserve.',
      ms: 'Pesakit secara amnya baik. Aktiviti pada 7500 langkah, sedikit di bawah asas 10000 tetapi masih di atas purata untuk kumpulan umur. Degupan jantung stabil pada 63 BPM. Rekod semakan sempurna. Pengurangan langkah kecil mungkin mencerminkan variasi normal atau keletihan ringan. Latar belakang sukan terdahulu memberikan rizab fungsi yang baik.',
    },
    actionPlan: {
      en: 'Continue monitoring. Note step trend for next weekly review. No action needed at this time.',
      ms: 'Teruskan pemantauan. Perhatikan trend langkah untuk semakan mingguan seterusnya. Tiada tindakan diperlukan pada masa ini.',
    },
    estimatedOutcome: {
      en: 'Expected to stabilize or return to baseline. No significant risk indicators.',
      ms: 'Dijangka stabil atau kembali ke asas. Tiada petunjuk risiko yang ketara.',
    },
    action: 'MONITOR',
    decisionId: 'dec_mock_008',
    confidencePercent: 91,
    riskFactors: { cardiovascularRisk: 1.0, mobilityRisk: 1.8, engagementRisk: 0.5, socialRisk: 1.0, combinedRiskScore: 1.2 },
    trendInsights: { direction: 'stable', percentChange: -25, velocity: 'gradual' },
    referencedGuidelines: ['NHS_Elderly_Care_Pathway_2024'],
  },
};

// ============================================================================
// Mock telemetry data (7-day baseline vs current incident)
// ============================================================================

function generateTelemetry(
  baseHR: number, baseSteps: number, driftHR: number, driftSteps: number
): { baseline: { day: string; heartRate: number; steps: number }[]; current: { day: string; heartRate: number; steps: number }[] } {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const baseline = days.map((day, i) => ({
    day,
    heartRate: baseHR + Math.round((Math.random() - 0.5) * 4),
    steps: baseSteps + Math.round((Math.random() - 0.5) * 400),
  }));
  const current = days.map((day, i) => ({
    day,
    heartRate: baseHR + driftHR * (i / 6) + Math.round((Math.random() - 0.5) * 3),
    steps: Math.max(0, baseSteps + driftSteps * (i / 6) + Math.round((Math.random() - 0.5) * 300)),
  }));
  return { baseline, current };
}

const telemetryData: Record<string, ReturnType<typeof generateTelemetry>> = {
  pat_001: generateTelemetry(72, 5500, 2, -300),
  pat_002: generateTelemetry(68, 4000, 7, -1000),
  pat_003: generateTelemetry(70, 6000, 15, -2700),
  pat_004: generateTelemetry(76, 3000, 19, -2800),
  pat_005: generateTelemetry(65, 8000, -1, 1500),
  pat_006: generateTelemetry(74, 4500, 8, -1600),
  pat_007: generateTelemetry(69, 5000, 2, -750),
  pat_008: generateTelemetry(62, 10000, 1, -2500),
};

const keyMetricsMap: Record<string, { avgHeartRate: number; avgSteps: number; checkInResponse: number }> = {
  pat_001: { avgHeartRate: 74, avgSteps: 5200, checkInResponse: 95 },
  pat_002: { avgHeartRate: 75, avgSteps: 3000, checkInResponse: 80 },
  pat_003: { avgHeartRate: 85, avgSteps: 3300, checkInResponse: 60 },
  pat_004: { avgHeartRate: 95, avgSteps: 200, checkInResponse: 20 },
  pat_005: { avgHeartRate: 64, avgSteps: 9500, checkInResponse: 100 },
  pat_006: { avgHeartRate: 82, avgSteps: 2900, checkInResponse: 75 },
  pat_007: { avgHeartRate: 71, avgSteps: 4250, checkInResponse: 85 },
  pat_008: { avgHeartRate: 63, avgSteps: 7500, checkInResponse: 100 },
};

// ============================================================================
// Build dashboard patients
// ============================================================================

export function getMockDashboardPatients(): DashboardPatient[] {
  return patientProfiles.map(profile => {
    const decision = mockDecisions[profile.patientId];
    const telemetry = telemetryData[profile.patientId];
    const metrics = keyMetricsMap[profile.patientId];
    return transformToDashboardPatient(
      profile,
      decision,
      telemetry.baseline,
      telemetry.current,
      metrics
    );
  });
}

export function getMockCohortSummary(): ReturnType<typeof generateCohortSummary> {
  return generateCohortSummary(getMockDashboardPatients());
}

export function getMockDecision(patientId: string): DecisionOutput | undefined {
  return mockDecisions[patientId];
}

export function getMockPatientProfile(patientId: string): PatientProfile | undefined {
  return patientProfiles.find(p => p.patientId === patientId);
}

// Demo scenarios for /api/demo/scenarios
export const demoScenarios = [
  { id: 'stable_patient', patientId: 'pat_001', name: 'Ahmad bin Abdullah (Stable)', expectedAction: 'MONITOR', description: 'Stable elderly patient with well-managed hypertension and diabetes.' },
  { id: 'gradual_decline', patientId: 'pat_002', name: 'Mary Tan (Declining)', expectedAction: 'FAMILY_CHECK', description: 'Gradual mobility decline with mild cognitive impairment - needs family welfare check.' },
  { id: 'urgent_clinic', patientId: 'pat_003', name: 'Rajendran (Urgent)', expectedAction: 'CLINIC_VISIT', description: 'Significant decline with cardiac stress markers - requires urgent clinic evaluation.' },
  { id: 'critical_alert', patientId: 'pat_004', name: 'Fatimah (Critical)', expectedAction: 'CALL_999', description: 'Severe multi-system collapse - heart failure decompensation suspected.' },
  { id: 'excellent_health', patientId: 'pat_005', name: 'Wong Ah Kow (Excellent)', expectedAction: 'MONITOR', description: 'Formerly active athlete maintaining excellent health metrics.' },
  { id: 'copd_concern', patientId: 'pat_006', name: 'Kamaruddin (COPD)', expectedAction: 'CLINIC_VISIT', description: 'COPD with atrial fibrillation - worsening breathlessness indicators.' },
  { id: 'mild_concern', patientId: 'pat_007', name: 'Letchumi (Mild)', expectedAction: 'FAMILY_CHECK', description: 'Diabetic neuropathy causing mild mobility reduction.' },
  { id: 'active_senior', patientId: 'pat_008', name: 'Lee Chong Wei (Active)', expectedAction: 'MONITOR', description: 'Active senior with minor step reduction - likely normal variation.' },
];
