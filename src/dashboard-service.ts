// ============================================================================
// HEART: Dashboard Service - Transform Decisions to Caregiver Insights
// ============================================================================

import type { DecisionOutput, DashboardPatient, CohortSummary, PatientProfile, MultilingualText, CareAction } from './types';
import { getRiskColor } from './types';

/**
 * Generate WhatsApp deep link with pre-filled message
 * Uses standard wa.me deep-linking (no API key needed)
 */
function generateWhatsAppLink(
  phone: string,
  patientName: string,
  action: CareAction,
  reasoning: MultilingualText,
  actionPlan: MultilingualText,
  language: 'en' | 'ms'
): string {
  // Normalize Malaysian phone number
  let normalizedPhone = phone.replace(/[^0-9]/g, '');
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '60' + normalizedPhone.slice(1);
  }
  if (!normalizedPhone.startsWith('60')) {
    normalizedPhone = '60' + normalizedPhone;
  }

  const actionEmojis: Record<CareAction, string> = {
    MONITOR: '✅',
    FAMILY_CHECK: '⚠️',
    CLINIC_VISIT: '🏥',
    CALL_999: '🚨',
  };

  const actionLabels: Record<CareAction, Record<string, string>> = {
    MONITOR: { en: 'MONITORING', ms: 'PEMANTAUAN' },
    FAMILY_CHECK: { en: 'FAMILY CHECK NEEDED', ms: 'SEMAKAN KELUARGA DIPERLUKAN' },
    CLINIC_VISIT: { en: 'CLINIC VISIT RECOMMENDED', ms: 'LAWATAN KLINIK DISYORKAN' },
    CALL_999: { en: 'EMERGENCY - CALL 999', ms: 'KECEMASAN - HUBUNGI 999' },
  };

  const emoji = actionEmojis[action];
  const label = actionLabels[action][language] || actionLabels[action].en;
  const reasoningText = reasoning[language as keyof MultilingualText] || reasoning.en;
  const actionPlanText = actionPlan[language as keyof MultilingualText] || actionPlan.en;

  const isEmergency = action === 'CALL_999' || action === 'CLINIC_VISIT';
  const header = isEmergency ? `${emoji} *HEART Care URGENT Alert* ${emoji}` : `${emoji} *HEART Care Alert*`;

  const message = `${header}

${language === 'ms' ? 'Hai' : 'Hi'}, ${language === 'ms' ? 'ini adalah makluman automatik mengenai' : 'this is an automated alert regarding'} *${patientName}*.
${language === 'ms' ? 'Status Semasa' : 'Current Status'}: *${label}*

${language === 'ms' ? 'Pemerhatian sistem' : 'System observation'}: ${reasoningText}

${language === 'ms' ? 'Tindakan yang disyorkan' : 'Recommended action'}: ${actionPlanText}

${language === 'ms' ? 'Sila semak mereka secepat mungkin.' : 'Please check on them as soon as possible.'}`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate alerts based on decision
 */
function generateAlerts(decision: DecisionOutput): MultilingualText[] {
  const alerts: MultilingualText[] = [];

  if (decision.riskScore >= 9) {
    alerts.push({
      en: '🚨 CRITICAL: Immediate emergency response required',
      ms: '🚨 KRITIKAL: Tindak balas kecemasan segera diperlukan',
    });
  }

  if (decision.riskFactors.mobilityRisk > 7) {
    alerts.push({
      en: '⚠️ Severe mobility decline detected',
      ms: '⚠️ Penurunan mobiliti teruk dikesan',
    });
  }

  if (decision.riskFactors.cardiovascularRisk > 6) {
    alerts.push({
      en: '❤️ Cardiac concern: abnormal heart rate pattern',
      ms: '❤️ Kebimbangan jantung: corak degupan jantung tidak normal',
    });
  }

  if (decision.riskFactors.engagementRisk > 5) {
    alerts.push({
      en: '📱 Patient not responding to check-ins',
      ms: '📱 Pesakit tidak bertindak balas terhadap semakan',
    });
  }

  if (decision.riskScore <= 3) {
    alerts.push({
      en: '✅ Patient responding well to check-ins',
      ms: '✅ Pesakit bertindak balas dengan baik terhadap semakan',
    });
  }

  return alerts;
}

/**
 * Generate recommended actions based on decision
 */
function generateRecommendedActions(decision: DecisionOutput): MultilingualText[] {
  const actions: MultilingualText[] = [];

  switch (decision.action) {
    case 'MONITOR':
      actions.push({
        en: 'Continue routine monitoring with daily check-ins',
        ms: 'Teruskan pemantauan rutin dengan semakan harian',
      });
      break;
    case 'FAMILY_CHECK':
      actions.push(
        {
          en: 'Family member should visit or call patient within 12 hours',
          ms: 'Ahli keluarga perlu melawat atau menghubungi pesakit dalam 12 jam',
        },
        {
          en: 'Ensure patient has access to medication and food',
          ms: 'Pastikan pesakit mempunyai akses kepada ubat dan makanan',
        }
      );
      break;
    case 'CLINIC_VISIT':
      actions.push(
        {
          en: 'Schedule GP or clinic visit within 24 hours',
          ms: 'Jadualkan lawatan GP atau klinik dalam 24 jam',
        },
        {
          en: 'Bring recent medication list and symptom log',
          ms: 'Bawa senarai ubat terkini dan log simptom',
        }
      );
      break;
    case 'CALL_999':
      actions.push(
        {
          en: 'Call 999 immediately - do not delay',
          ms: 'Hubungi 999 segera - jangan tangguh',
        },
        {
          en: 'Stay with patient until emergency services arrive',
          ms: 'Kekal bersama pesakit sehingga perkhidmatan kecemasan tiba',
        }
      );
      break;
  }

  return actions;
}

/**
 * Transform a decision + patient profile into a dashboard-ready patient card
 */
export function transformToDashboardPatient(
  profile: PatientProfile,
  decision: DecisionOutput,
  telemetryBaseline: { day: string; heartRate: number; steps: number }[],
  telemetryCurrent: { day: string; heartRate: number; steps: number }[],
  keyMetrics: { avgHeartRate: number; avgSteps: number; checkInResponse: number }
): DashboardPatient {
  const whatsappDeepLinks: Record<string, string> = {};
  profile.emergencyContacts.forEach((contact, idx) => {
    whatsappDeepLinks[String(idx)] = generateWhatsAppLink(
      contact.phone,
      profile.name,
      decision.action,
      decision.reasoning,
      decision.actionPlan,
      contact.preferredLanguage
    );
  });

  const nextReview = new Date();
  switch (decision.action) {
    case 'CALL_999': nextReview.setHours(nextReview.getHours() + 1); break;
    case 'CLINIC_VISIT': nextReview.setHours(nextReview.getHours() + 6); break;
    case 'FAMILY_CHECK': nextReview.setHours(nextReview.getHours() + 12); break;
    case 'MONITOR': nextReview.setHours(nextReview.getHours() + 24); break;
  }

  return {
    patientId: profile.patientId,
    patientName: profile.name,
    age: profile.age,
    gender: profile.gender,
    riskStatus: getRiskColor(decision.riskScore),
    riskTrend: decision.trendInsights?.direction || 'stable',
    riskPercentChange: decision.trendInsights?.percentChange || 0,
    lastDecision: decision,
    keyMetrics,
    alerts: generateAlerts(decision),
    recommendedActions: generateRecommendedActions(decision),
    nextReviewDue: nextReview.toISOString(),
    whatsappDeepLinks,
    location: profile.location,
    telemetryBaseline,
    telemetryCurrent,
  };
}

/**
 * Generate cohort summary from multiple dashboard patients
 */
export function generateCohortSummary(patients: DashboardPatient[]): CohortSummary {
  const distribution = { critical: 0, high: 0, moderate: 0, stable: 0 };
  let totalRisk = 0;
  let actionItems = 0;

  patients.forEach(p => {
    const score = p.lastDecision.riskScore;
    totalRisk += score;
    if (score >= 9) { distribution.critical++; actionItems++; }
    else if (score >= 6) { distribution.high++; actionItems++; }
    else if (score >= 4) { distribution.moderate++; }
    else { distribution.stable++; }
  });

  return {
    cohortSize: patients.length,
    riskDistribution: distribution,
    criticalAlerts: distribution.critical,
    averageRiskScore: patients.length > 0 ? Math.round((totalRisk / patients.length) * 10) / 10 : 0,
    actionItemsToday: actionItems,
    timestamp: new Date().toISOString(),
  };
}
