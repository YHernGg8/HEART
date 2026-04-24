/**
 * HEART RAG System with Vertex AI Search Integration
 *
 * Grounds the decision engine in medical evidence through Vertex AI Search
 * over indexed clinical guidelines. Fallback to the mock knowledge base is
 * intentionally handled by rag-system.ts, so setup errors remain visible here.
 */
import { GoogleAuth } from 'google-auth-library';
import { MedicalGuideline, RiskFactors } from './types.js';
import { KNOWLEDGE_BASE } from './rag-system-mock.js';

let authClient: any = null;

export function initializeVertexSearch() {
    try {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
        });
        authClient = auth;
        console.log('✅ Vertex AI Search REST Auth initialized');
    } catch (error) {
        authClient = null;
        console.warn('⚠️ Vertex AI Search Auth init failed:', error);
    }
}

/**
 * Retrieve medical guidelines from Vertex AI Search.
 */
export async function retrieveGuidelinesFromVertex(
    riskProfile: RiskFactors,
    queryTerms?: string
): Promise<MedicalGuideline[]> {
    if (!authClient) throw new Error('Vertex Auth client not initialized');
    const client = await authClient.getClient();
    const tokenRes = await client.getAccessToken();
    const accessToken = tokenRes.token;

    const query = buildSearchQuery(riskProfile, queryTerms);
    const servingConfigs = buildServingConfigCandidates();

    if (servingConfigs.length === 0) {
        throw new Error('VERTEX_SEARCH_ENGINE_ID not configured');
    }

    const errors: string[] = [];

    for (const servingConfig of servingConfigs) {
        try {
            console.log('Searching Vertex REST API:', { servingConfig, query });
            const url = `https://discoveryengine.googleapis.com/v1alpha/${servingConfig}:search`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    pageSize: 5,
                    contentSearchSpec: {
                        snippetSpec: { returnSnippet: true, maxSnippetCount: 3 },
                        extractiveContentSpec: { maxExtractiveAnswerCount: 3, maxExtractiveSegmentCount: 2 }
                    }
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`REST Error: ${res.status} - ${errText}`);
            }

            const data = await res.json();
            const results = data.results || [];
            
            const guidelines = results
                .slice(0, 5)
                .map((result: any) => parseVertexSearchResult(result))
                .filter((guideline: any): guideline is MedicalGuideline => guideline !== null);

            if (guidelines.length > 0) return guidelines;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push(`${servingConfig}: ${errorMsg}`);
            console.warn('Vertex AI Search candidate failed:', { servingConfig, error: errorMsg });
        }
    }

    if (errors.length > 0) {
        throw new Error(`All Vertex AI Search serving configs failed: ${errors.join(' | ')}`);
    }

    return [];
}

function buildServingConfigCandidates(): string[] {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.VERTEX_SEARCH_LOCATION || 'global';
    const collection = process.env.VERTEX_SEARCH_COLLECTION || 'default_collection';
    const engineId = process.env.VERTEX_SEARCH_ENGINE_ID;
    const dataStoreId = process.env.VERTEX_SEARCH_DATASTORE_ID;
    const configuredServingConfig = process.env.VERTEX_SEARCH_SERVING_CONFIG;
    const servingConfigIds = configuredServingConfig
        ? [configuredServingConfig]
        : ['default_search', 'default_serving_config', 'default_config', 'default'];

    if (!projectId) {
        throw new Error('GCP_PROJECT_ID is required for Vertex AI Search');
    }

    const candidates: string[] = [];

    for (const servingConfigId of servingConfigIds) {
        if (engineId) {
            candidates.push(
                `projects/${projectId}/locations/${location}/collections/${collection}/engines/${engineId}/servingConfigs/${servingConfigId}`
            );
        }

        if (dataStoreId) {
            candidates.push(
                `projects/${projectId}/locations/${location}/collections/${collection}/dataStores/${dataStoreId}/servingConfigs/${servingConfigId}`
            );
        }
    }

    // Keep deterministic order while avoiding duplicates.
    return Array.from(new Set(candidates));
}

/**
 * Build semantic search query for Vertex AI Search.
 */
function buildSearchQuery(riskProfile: RiskFactors, customTerms?: string): string {
    const terms: string[] = [];

    if (customTerms) {
        return customTerms;
    }

    if (riskProfile.mobilityRisk >= 7) {
        terms.push('mobility decline collapse immobility elderly fall');
    }
    if (riskProfile.cardiovascularRisk >= 7) {
        terms.push('cardiac heart rate arrhythmia tachycardia elderly');
    }
    if (riskProfile.engagementRisk >= 7) {
        terms.push('unresponsive check-in engagement elderly care');
    }
    if (
        riskProfile.mobilityRisk >= 6 &&
        riskProfile.engagementRisk >= 6 &&
        riskProfile.combinedRiskScore >= 8
    ) {
        terms.push('emergency critical multi-factor deterioration');
    }

    if (terms.length === 0) {
        terms.push('gradual decline behavioral change elderly monitoring');
    }

    return terms.join(' ');
}

/**
 * Parse Vertex AI Search result into MedicalGuideline format.
 */
function parseVertexSearchResult(result: any): MedicalGuideline | null {
    try {
        const document = result.document;
        if (!document) return null;

        const derived = normalizeStruct(document.derivedStructData);
        const structData = normalizeStruct(document.structData);
        const content = normalizeStruct(document.content);
        const uri = readString(content.uri || derived.link || structData.uri);
        const title = readString(derived.title) || readString(structData.title) || document.id || '';
        const sourceLabel =
            readString(structData.source || derived.source) ||
            title ||
            extractFileName(uri) ||
            document.id ||
            'Vertex_AI_Search_Guideline';
        const extractiveAnswers = readArray(derived.extractive_answers || derived.extractiveAnswers);
        const snippets = readArray(derived.snippets);
        const evidence =
            readString(structData.evidence) ||
            (extractiveAnswers.length > 0
                ? readString(extractiveAnswers[0]?.content || extractiveAnswers[0])
                : '') ||
            (snippets.length > 0 ? readString(snippets[0]?.snippet || snippets[0]) : '') ||
            (uri
                ? `Guideline retrieved from ${extractFileName(uri) || uri}`
                : 'Medical guideline from Malaysian Ministry of Health');

        const category = readString(structData.category || derived.category);
        const severity =
            readString(structData.severity || derived.severity) ||
            readString(structData.riskLevel || derived.riskLevel);
        const triggers = readStringArray(structData.triggers || derived.triggers);
        const actionsFromMetadata = readStringArray(structData.actions || derived.actions);
        const recommendedActions =
            actionsFromMetadata.length > 0
                ? actionsFromMetadata
                : readStringArray(structData.recommendedActions || derived.recommendedActions);
        if (category || severity || triggers.length > 0 || recommendedActions.length > 0) {
            return {
                id: document.id || title,
                category: category || 'geriatric_care',
                riskLevel: parseRiskLevel(severity),
                triggers: triggers.length > 0 ? triggers : ['age-related decline', 'behavioral changes'],
                recommendedActions:
                    recommendedActions.length > 0
                        ? recommendedActions
                        : ['Comprehensive geriatric assessment', 'Regular monitoring and follow-up'],
                source: sourceLabel,
                evidence: evidence.substring(0, 500),
                retrievalSource: 'vertex_search',
            };
        }

        const lowerTitle = title.toLowerCase();

        if (lowerTitle.includes('hip') || lowerTitle.includes('fracture')) {
            return {
                id: document.id || title,
                category: 'mobility_decline',
                riskLevel: 'high',
                triggers: ['falls', 'immobility', 'hip fracture risk', 'age-related bone loss'],
                recommendedActions: [
                    'Physical assessment and balance evaluation',
                    'Fall prevention strategies',
                    'Bone density screening',
                    'Immediate medical evaluation if fall suspected',
                ],
                source: 'KKM_Geriatric_Hip_Fracture_Protocol',
                evidence: evidence.substring(0, 500),
                retrievalSource: 'vertex_search',
            };
        }

        if (lowerTitle.includes('pharmacy') || lowerTitle.includes('medication')) {
            return {
                id: document.id || title,
                category: 'medication_management',
                riskLevel: 'moderate',
                triggers: ['polypharmacy', 'drug interactions', 'medication non-compliance', 'adverse effects'],
                recommendedActions: [
                    'Comprehensive pharmacy review',
                    'Medication reconciliation',
                    'Deprescribing assessment',
                    'Patient and caregiver education',
                ],
                source: 'KKM_Geriatric_Pharmacy_Services_Protocol',
                evidence: evidence.substring(0, 500),
                retrievalSource: 'vertex_search',
            };
        }

        return {
            id: document.id || title,
            category: 'geriatric_care',
            riskLevel: 'moderate',
            triggers: ['age-related decline', 'functional assessment needed', 'behavioral changes'],
            recommendedActions: [
                'Comprehensive geriatric assessment',
                'Care coordination with family',
                'Regular monitoring and follow-up',
            ],
            source: title || 'KKM_Malaysian_Geriatric_Guidelines',
            evidence: evidence.substring(0, 500),
            retrievalSource: 'vertex_search',
        };
    } catch (error) {
        console.warn('Failed to parse Vertex search result:', error);
        return null;
    }
}

function readString(value: any): string {
    if (!value && value !== 0 && value !== false) return '';
    const normalized = normalizeValue(value);
    if (typeof normalized === 'string') return normalized;
    if (typeof normalized === 'number' || typeof normalized === 'boolean') return String(normalized);
    return '';
}

function readStringArray(value: any): string[] {
    if (!value) return [];
    const normalized = normalizeValue(value);
    if (Array.isArray(normalized)) {
        return normalized.map(readString).filter(Boolean);
    }

    const asString = readString(normalized);
    return asString
        ? asString
            .split(/[,;\n]/)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
}

function readArray(value: any): any[] {
    if (!value) return [];
    const normalized = normalizeValue(value);
    if (Array.isArray(normalized)) return normalized;
    return [];
}

function normalizeStruct(value: any): Record<string, any> {
    const normalized = normalizeValue(value);
    if (!normalized || Array.isArray(normalized) || typeof normalized !== 'object') {
        return {};
    }

    return normalized as Record<string, any>;
}

function normalizeValue(value: any): any {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map((item) => normalizeValue(item));
    if (typeof value !== 'object') return value;

    if (typeof value.stringValue === 'string') return value.stringValue;
    if (typeof value.numberValue === 'number') return value.numberValue;
    if (typeof value.boolValue === 'boolean') return value.boolValue;
    if (Object.prototype.hasOwnProperty.call(value, 'nullValue')) return null;

    if (Array.isArray(value.listValue?.values)) {
        return value.listValue.values.map((item: any) => normalizeValue(item));
    }

    if (value.structValue?.fields && typeof value.structValue.fields === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(value.structValue.fields)) {
            out[k] = normalizeValue(v);
        }
        return out;
    }

    if (value.fields && typeof value.fields === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(value.fields)) {
            out[k] = normalizeValue(v);
        }
        return out;
    }

    return value;
}

function extractFileName(uri: string): string {
    if (!uri) return '';
    const cleaned = uri.split('?')[0];
    const parts = cleaned.split('/');
    return parts.length > 0 ? parts[parts.length - 1] : '';
}

function parseRiskLevel(
    severity: string | undefined
): 'low' | 'moderate' | 'high' | 'critical' {
    if (!severity) return 'moderate';
    const lower = severity.toLowerCase();
    if (lower.includes('critical') || lower.includes('emergency')) return 'critical';
    if (lower.includes('high') || lower.includes('urgent')) return 'high';
    if (lower.includes('moderate') || lower.includes('watch')) return 'moderate';
    return 'low';
}

/**
 * Enhanced RAG Prompt Builder with Vertex AI Search Corpus Results.
 */
export function buildVertexRAGPrompt(guidelines: MedicalGuideline[]): string {
    let prompt = `You are the HEART Care Decision Engine, a clinical decision support system for elderly care monitoring.

Your role: Analyze wearable health data and detect GRADUAL BEHAVIORAL DECLINE, not just acute emergencies.

Key Clinical Principles:
1. Gradual decline is more dangerous than sudden spikes
2. "No response + immobility" = highest risk signal
3. Multi-factor patterns matter: look for combinations of risk signals
4. Time is critical: early intervention prevents hospitalizations
5. Be specific: justify decisions with evidence from the data

You MUST respond with ONLY valid JSON (no markdown, no explanation):
{
  "riskScore": <1-10>,
  "reasoning": "<clinical reasoning with specific data references>",
  "action": "<MONITOR | FAMILY_CHECK | CLINIC_VISIT | CALL_999>"
}

Risk stratification:
- MONITOR (1-3): Stable metrics, no concerning trends
- FAMILY_CHECK (4-5): Mild decline indicators, suggest informal check-in within 24 hours
- CLINIC_VISIT (6-8): Moderate-to-serious decline, recommend medical evaluation within 48 hours
- CALL_999 (9-10): Critical alert indicating immediate danger - emergency response required now`;

    if (guidelines.length > 0) {
        prompt += `\n\n--- RELEVANT CLINICAL GUIDELINES FROM VERTEX AI SEARCH ---\n`;
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
        prompt += `\n--- Apply these guidelines to inform your decision. If patterns match triggers, prioritize recommended actions. ---\n`;
    } else {
        prompt += `\n\n--- No indexed guidelines available. Use clinical best practices for geriatric elderly care. ---\n`;
    }

    return prompt;
}

/**
 * Validate decision against Vertex-retrieved guidelines.
 */
export function validateAgainstVertexGuidelines(
    riskScore: number,
    action: string,
    guidelines: MedicalGuideline[]
): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    const criticalGuidelines = guidelines.filter((g) => g.riskLevel === 'critical');
    if (criticalGuidelines.length > 0 && action === 'MONITOR') {
        warnings.push(
            `CONFLICT: Critical-level guidelines (${criticalGuidelines.map((g) => g.source).join(', ')}) recommend emergency action, but decision is MONITOR`
        );
    }

    if (riskScore >= 9 && action !== 'CALL_999') {
        warnings.push('CONFLICT: Risk score 9-10 typically requires CALL_999 action');
    }

    return {
        isValid: warnings.length === 0,
        warnings,
    };
}

/**
 * Log guideline application for audit trail.
 */
export function logGuidelineApplication(
    patientId: string,
    decisionId: string,
    appliedGuidelines: MedicalGuideline[]
): void {
    console.log(`Decision ${decisionId} for patient ${patientId} applied Vertex AI Search guidelines:`, {
        count: appliedGuidelines.length,
        sources: appliedGuidelines.map((g) => g.source),
        timestamp: new Date().toISOString(),
    });
}

export { KNOWLEDGE_BASE };
