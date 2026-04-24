/**
 * HEART Dashboard Service
 * Transforms AI decisions into caregiver-friendly intelligence
 */

import { CareDecision, MultilingualText, EmergencyContact } from './types.js';

function riskScoreToStatus(riskScore: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (riskScore <= 3) return 'green';
  if (riskScore <= 5) return 'yellow';
  if (riskScore <= 8) return 'orange';
  return 'red';
}

export function generateWhatsAppPayload(decision: CareDecision, patientName: string, language: 'en' | 'ms' = 'en'): string {
  const emoji = decision.action === 'CALL_999' ? '🚨' : '⚠️';
  let text = `*HEART Care Alert* ${emoji}\n\nHi, this is an automated alert regarding *${patientName}*.\nCurrent Status: *${decision.action.replace(/_/g, ' ')}*\n\nSystem observation: ${decision.reasoning[language]}\n\nRecommended action: ${decision.actionPlan?.[language] || 'Please contact healthcare provider'}\n\nPlease check on them as soon as possible.`;
  return encodeURIComponent(text);
}

export function generateWhatsAppDeepLink(contact: EmergencyContact, decision: CareDecision, patientName: string, language: 'en' | 'ms' = 'en'): string {
  const payload = generateWhatsAppPayload(decision, patientName, language);
  const phoneFormatted = contact.phone.startsWith('60') ? contact.phone : '60' + contact.phone.replace(/^0/, '');
  return `https://wa.me/${phoneFormatted}?text=${payload}`;
}

export function generateClinicalSummary(decision: CareDecision, patientName: string, language: 'en' | 'ms' = 'en'): string {
  const labels = language === 'en' ? {
    title: 'HEART CARE DECISION ENGINE - CLINICAL SUMMARY',
    patient: 'Patient', riskAssessment: 'RISK ASSESSMENT', overallRisk: 'Overall Risk Score',
    confidence: 'Confidence Level', clinicalReasoning: 'CLINICAL REASONING',
    recommendedAction: 'RECOMMENDED ACTION', guidelines: 'MEDICAL GUIDELINES APPLIED',
  } : {
    title: 'HEART ENJIN PENENTUAN PENJAGAAN - RINGKASAN KLINIKAL',
    patient: 'Pesakit', riskAssessment: 'PENILAIAN RISIKO', overallRisk: 'Skor Risiko Keseluruhan',
    confidence: 'Tahap Keyakinan', clinicalReasoning: 'PENALARAN KLINIKAL',
    recommendedAction: 'TINDAKAN YANG DISYORKAN', guidelines: 'GARIS PANDUAN PERUBATAN DIGUNAKAN',
  };

  return `
═══════════════════════════════════════════════
${labels.title}
═══════════════════════════════════════════════

${labels.patient}: ${patientName}
Decision ID: ${decision.decisionId}
Generated: ${decision.timestamp.toISOString()}

${labels.riskAssessment}
───────────────────────────────────────────────
${labels.overallRisk}: ${decision.riskScore}/10
${labels.confidence}: ${decision.confidencePercent}%

${labels.clinicalReasoning}
───────────────────────────────────────────────
${decision.reasoning[language]}

${labels.recommendedAction}
───────────────────────────────────────────────
${decision.action}
${decision.actionPlan ? `\n${decision.actionPlan[language]}` : ''}

${labels.guidelines}
───────────────────────────────────────────────
${decision.medicalGuidelinesApplied.map(g => `  • ${g}`).join('\n')}
═══════════════════════════════════════════════
`;
}

export function generateCohortSummary(insights: any[]) {
  const totalPatients = insights.length;
  const criticalCount = insights.filter(i => i.riskStatus === 'red').length;
  const warningCount = insights.filter(i => i.riskStatus === 'orange').length;
  return {
    totalPatients,
    criticalCount,
    warningCount,
    urgentActionRequired: criticalCount > 0,
    riskDistribution: {
      critical: criticalCount,
      high: warningCount,
      moderate: insights.filter(i => i.riskStatus === 'yellow').length,
      stable: insights.filter(i => i.riskStatus === 'green').length,
    },
    averageRiskScore: Math.round((insights.reduce((sum: number, i: any) => sum + (i.lastDecision?.riskScore || 0), 0) / totalPatients) * 10) / 10,
    actionDueToday: criticalCount + warningCount,
  };
}
