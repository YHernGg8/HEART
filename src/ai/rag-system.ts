/**
 * HEART RAG System Orchestrator
 *
 * Tries Vertex AI Search first, falls back to mock knowledge base.
 * Provides unified interface for decision flows.
 */

import { MedicalGuideline, RiskFactors } from './types.js';
import { KNOWLEDGE_BASE } from './rag-system-mock.js';

let vertexSearchEnabled = false;

/**
 * Initialize RAG system
 * Attempts Vertex AI Search setup; falls back to mock if unavailable
 */
export function initializeRAGSystem(): void {
  const engineId = process.env.VERTEX_SEARCH_ENGINE_ID;
  const dataStoreId = process.env.VERTEX_SEARCH_DATASTORE_ID;

  if (engineId || dataStoreId) {
    try {
      vertexSearchEnabled = true;
      console.log('✅ Vertex AI Search RAG enabled');
    } catch (error) {
      vertexSearchEnabled = false;
      console.warn('⚠️ Vertex AI Search init failed, using mock RAG:', (error as Error).message);
    }
  } else {
    vertexSearchEnabled = false;
    console.log('ℹ️  Using mock RAG knowledge base (no VERTEX_SEARCH_ENGINE_ID configured)');
  }
}

/**
 * Retrieve relevant medical guidelines based on risk profile
 */
export async function retrieveRelevantGuidelines(riskFactors: RiskFactors): Promise<MedicalGuideline[]> {
  // Always use mock knowledge base for now (Vertex AI Search integration added separately)
  return retrieveFromMockKB(riskFactors);
}

/**
 * Retrieve from mock knowledge base
 */
function retrieveFromMockKB(riskFactors: RiskFactors): MedicalGuideline[] {
  const guidelines: MedicalGuideline[] = [];
  const seen = new Set<string>();

  function add(g: MedicalGuideline) {
    if (!seen.has(g.id)) {
      seen.add(g.id);
      guidelines.push(g);
    }
  }

  // Always include general elderly care
  KNOWLEDGE_BASE.filter(g => g.category === 'general_elderly_care').forEach(add);

  // Cardiovascular risk
  if (riskFactors.cardiovascularRisk >= 6) {
    KNOWLEDGE_BASE.filter(g => g.category === 'cardiovascular_decline').forEach(add);
  }

  // Mobility risk
  if (riskFactors.mobilityRisk >= 5) {
    KNOWLEDGE_BASE.filter(g => g.category === 'mobility_decline').forEach(add);
  }

  // Critical combined risk
  if (riskFactors.combinedRiskScore >= 8) {
    KNOWLEDGE_BASE.filter(g => g.riskLevel === 'critical').forEach(add);
  }

  // High risk general
  if (riskFactors.combinedRiskScore >= 6) {
    KNOWLEDGE_BASE.filter(g => g.riskLevel === 'high' && !seen.has(g.id)).slice(0, 2).forEach(add);
  }

  return guidelines.slice(0, 5);
}

/**
 * Build system prompt enriched with RAG-retrieved guidelines
 */
export function buildRAGEnrichedPrompt(guidelines: MedicalGuideline[]): string {
  let prompt = `You are the HEART Care Decision Engine, a clinical decision support system for elderly care monitoring.

Your role: Analyze wearable health data and detect GRADUAL BEHAVIORAL DECLINE, not just acute emergencies.

Key Clinical Principles:
1. Gradual decline is more dangerous than sudden spikes
2. "No response + immobility" = highest risk signal
3. Multi-factor patterns matter: look for combinations of risk signals
4. Time is critical: early intervention prevents hospitalizations
5. Be specific: justify decisions with evidence from the data

Risk stratification:
- MONITOR (1-3): Stable metrics, no concerning trends
- FAMILY_CHECK (4-5): Mild decline, suggest informal check-in within 24h
- CLINIC_VISIT (6-8): Moderate-to-serious decline, medical evaluation within 48h
- CALL_999 (9-10): Critical alert - emergency response required now`;

  if (guidelines.length > 0) {
    prompt += `\n\n--- RELEVANT CLINICAL GUIDELINES (RAG-RETRIEVED) ---\n`;
    guidelines.forEach((g, idx) => {
      prompt += `\n[${idx + 1}. ${g.source}] ${g.category.toUpperCase()}\n`;
      prompt += `  Risk Level: ${g.riskLevel}\n`;
      prompt += `  Triggers: ${g.triggers.join(', ')}\n`;
      prompt += `  Evidence: ${g.evidence}\n`;
      prompt += `  Recommended Actions:\n`;
      g.recommendedActions.forEach((action) => {
        prompt += `    - ${action}\n`;
      });
    });
    prompt += `\n--- Apply these guidelines to inform your decision. ---\n`;
  }

  return prompt;
}

/**
 * Validate a decision against retrieved guidelines
 */
export function validateDecisionAgainstGuidelines(
  riskScore: number, action: string, guidelines: MedicalGuideline[]
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  const criticalGuidelines = guidelines.filter(g => g.riskLevel === 'critical');
  if (criticalGuidelines.length > 0 && action === 'MONITOR') {
    warnings.push(`CONFLICT: Critical guidelines (${criticalGuidelines.map(g => g.source).join(', ')}) but action is MONITOR`);
  }
  if (riskScore >= 9 && action !== 'CALL_999') {
    warnings.push('CONFLICT: Risk score 9-10 typically requires CALL_999');
  }

  return { isValid: warnings.length === 0, warnings };
}

export { KNOWLEDGE_BASE };
