/**
 * HEART AI Backend Server
 * Uses Google Generative AI (Gemini 2.5 Flash) for clinical reasoning
 * Reads .env manually since dotenv may not be installed
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeRAGSystem, retrieveRelevantGuidelines, buildRAGEnrichedPrompt } from './rag-system.js';
import { VertexAI } from '@google-cloud/vertexai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─── Load .env manually ─── */
function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
    console.log('✅ Loaded .env from', envPath);
  } else {
    console.warn('⚠️ No .env file found at', envPath);
  }
}
loadEnv();

/* ─── Initialize RAG ─── */
initializeRAGSystem();

/* ─── Setup Vertex AI (SDK implementation) ─── */
const chatProjectId = process.env.GCP_PROJECT_ID || '';
const chatLocation = process.env.GCP_REGION || 'asia-southeast1';
const chatModel = process.env.CHAT_MODEL || 'gemini-2.5-flash';

let vertexAI: any = null;
if (chatProjectId) {
  try {
    vertexAI = new VertexAI({ project: chatProjectId, location: chatLocation });
  } catch (err) {
    console.warn('⚠️ Failed to init VertexAI', err);
  }
} else {
  console.warn('⚠️ WARNING: GCP_PROJECT_ID is not set. Vertex AI features will fail and use mock fallback.');
}

function getFallbackMockResponse(prompt: string, systemPrompt: string) {
  if (systemPrompt.includes('HEART AI Assistant')) {
    return { response: { text: () => "This is a fallback response from HEART AI. The Google Gemini API is currently rate-limited (Quota Exceeded) for this API key. But I am here to help you monitor patients!" } };
  }
  
  const fallbackJSON = {
    riskScore: 7,
    action: "CLINIC_VISIT",
    confidencePercent: 88,
    reasoning: {
      en: "Patient shows signs of decline but the AI API is rate-limited. Serving fallback assessment.",
      ms: "Pesakit menunjukkan kemerosotan tetapi API AI terhad. Menyediakan penilaian sandaran."
    },
    riskFactors: { cardiovascularRisk: 6, mobilityRisk: 7, engagementRisk: 5, socialRisk: 3, combinedRiskScore: 7 },
    actionPlan: {
      en: "Schedule a non-emergency clinical visit within 48 hours for a thorough checkup.",
      ms: "Jadualkan lawatan klinik bukan kecemasan dalam masa 48 jam untuk pemeriksaan menyeluruh."
    },
    estimatedOutcome: {
      en: "With clinical intervention, the risk of hospitalization decreases by 75%.",
      ms: "Dengan campur tangan klinikal, risiko kemasukan ke hospital berkurangan sebanyak 75%."
    },
    roleInsights: {
      family: {
        en: "Noticeable drop in steps combined with high heart rate indicates distress.",
        ms: "Penurunan ketara dalam langkah harian berserta degupan jantung tinggi menunjukkan tekanan."
      },
      fieldUnit: "Tachycardia and immobility. Advise standard cardiac protocols upon arrival.",
      doctor: "Gradual decline over 7 days in ambulation. Heart rate above baseline. Suspect decompensation.",
      operator: "Priority dispatch requested. Heart rate elevated, steps critical."
    },
    referencedGuidelines: ["Fallback Guideline 101"],
    whatsappMessage: {
      en: "HEART Alert: Patient requires a clinic visit. Please arrange an appointment soon.",
      ms: "Amaran HEART: Pesakit memerlukan lawatan ke klinik. Sila aturkan janji temu segera."
    }
  };
  return { response: { text: () => JSON.stringify(fallbackJSON) } };
}

async function generateContent(prompt: string, systemPrompt: string, config: any) {
  if (!vertexAI) {
    console.warn('⚠️ Vertex AI is not initialized. Falling back to mock RAG response.');
    return getFallbackMockResponse(prompt, systemPrompt);
  }
  try {
    const generativeModel = vertexAI.getGenerativeModel({
      model: chatModel,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: config
    });
    
    const request = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };
    
    const responseStream = await generativeModel.generateContent(request);
    const data = await responseStream.response;
    const textVal = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { response: { text: () => textVal } };
  } catch (err: any) {
    console.warn(`⚠️ Vertex AI Fetch Error: ${err.message}`);
    console.warn('🔄 Falling back to mock RAG response to prevent UI crash.');
    return getFallbackMockResponse(prompt, systemPrompt);
  }
}

/* ─── System Prompt ─── */
const HEART_SYSTEM_PROMPT = `You are HEART (Homecare & Emergency AI Routing Technology), an autonomous care decision engine for elderly patients in Malaysia.

You analyze smartwatch telemetry (Heart Rate, Steps) and check-in responses to detect gradual decline. You route decisions to 4 escalation levels:
- MONITOR (Green): Patient stable, continue monitoring
- FAMILY_CHECK (Yellow): Contact family for welfare check
- CLINIC_VISIT (Orange): Schedule clinic visit within 24-48 hours
- CALL_999 (Red): Immediate emergency response

Your responses MUST be in this exact JSON format:
{
  "riskScore": <number 1-10>,
  "action": "<MONITOR|FAMILY_CHECK|CLINIC_VISIT|CALL_999>",
  "confidencePercent": <number 1-100>,
  "reasoning": {
    "en": "<clinical reasoning in English>",
    "ms": "<clinical reasoning in Bahasa Malaysia>"
  },
  "riskFactors": {
    "cardiovascularRisk": <number 1-10>,
    "mobilityRisk": <number 1-10>,
    "engagementRisk": <number 1-10>,
    "socialRisk": <number 1-10>,
    "combinedRiskScore": <number 1-10>
  },
  "actionPlan": {
    "en": "<specific action plan in English>",
    "ms": "<specific action plan in Bahasa Malaysia>"
  },
  "estimatedOutcome": {
    "en": "<prognosis in English>",
    "ms": "<prognosis in Bahasa Malaysia>"
  },
  "roleInsights": {
    "family": {
      "en": "<simple, empathetic explanation for patient family>",
      "ms": "<penerangan ringkas dan empati untuk keluarga pesakit>"
    },
    "fieldUnit": "<concise transmission summary for EMTs (e.g., 'Tachycardia, suspected cardiac event. ETA 10 mins.')>",
    "doctor": "<detailed clinical assessment with baseline comparisons>",
    "operator": "<dispatch and triage instruction for 999 response coordinator>"
  },
  "referencedGuidelines": ["<relevant clinical guideline names>"],
  "whatsappMessage": {
    "en": "<message template for WhatsApp notification>",
    "ms": "<message template in Bahasa Malaysia>"
  }
}

Clinical knowledge to reference:
- NHS Guidelines for Elderly Care
- KKM (Kementerian Kesihatan Malaysia) clinical standards
- NICE Guidelines for Heart Failure
- WHO Integrated Care Guidelines
- Fall Prevention Protocols

CRITICAL RULES:
1. A riskScore of 1–3 = MONITOR, 4–5 = FAMILY_CHECK, 6–7 = CLINIC_VISIT, 8–10 = CALL_999
2. No check-in for 2+ days with declining vitals = minimum CLINIC_VISIT
3. Heart rate >100 or <50 with other declining signals = CALL_999
4. Steps declining >50% from baseline = at minimum FAMILY_CHECK
5. Always provide bilingual reasoning (English + Bahasa Malaysia)
6. Reference specific clinical guidelines when applicable
7. Return ONLY valid JSON, no markdown or extra text`;

/* ─── Express App ─── */
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

/* ─── Serve static frontend in production ─── */
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
}

/* ─── Health Check ─── */
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'HEART AI Backend',
    timestamp: new Date().toISOString(),
    model: 'gemini-2.5-flash',
  });
});

/* ─── Snapshot Decision ─── */
app.post('/api/care-decision/snapshot', async (req, res) => {
  try {
    const { averageHeartRate, dailySteps, daysSinceLastCheckin, patientName, age, gender, medicalHistory } = req.body;

    if (!averageHeartRate || dailySteps === undefined || daysSinceLastCheckin === undefined) {
      res.status(400).json({ error: 'Missing required fields: averageHeartRate, dailySteps, daysSinceLastCheckin' });
      return;
    }

    const prompt = `Analyze this elderly patient's vital signs and provide a care decision:

Patient: ${patientName || 'Unknown'} (${age || 'Unknown'} years, ${gender || 'Unknown'})
Medical History: ${medicalHistory || 'None provided'}

Current telemetry (7-day averages):
- Average Heart Rate: ${averageHeartRate} BPM
- Daily Steps: ${dailySteps}
- Days Since Last Check-in: ${daysSinceLastCheckin}

Provide your clinical assessment and care routing decision.`;

    // Mock risk assessment for RAG retrieval
    const simulatedRisks = {
      cardiovascularRisk: averageHeartRate > 100 || averageHeartRate < 50 ? 8 : 4,
      mobilityRisk: dailySteps < 1000 ? 7 : 3,
      engagementRisk: daysSinceLastCheckin > 1 ? 8 : 2,
      socialRisk: 3,
      combinedRiskScore: 0,
    };
    simulatedRisks.combinedRiskScore = Math.max(simulatedRisks.cardiovascularRisk, simulatedRisks.mobilityRisk, simulatedRisks.engagementRisk);

    // Retrieve guidelines via RAG
    const guidelines = await retrieveRelevantGuidelines(simulatedRisks);
    const ragPrompt = buildRAGEnrichedPrompt(guidelines);

    const result = await generateContent(
      prompt,
      ragPrompt + '\n' + HEART_SYSTEM_PROMPT,
      {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      }
    );

    const text = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.warn('⚠️ Invalid JSON returned by Vertex AI (possibly truncated by safety filters). Using Fallback.', parseError);
      parsed = JSON.parse(getFallbackMockResponse(prompt, HEART_SYSTEM_PROMPT).response.text());
    }

    res.json({
      success: true,
      decision: parsed,
      metadata: {
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString(),
        input: { averageHeartRate, dailySteps, daysSinceLastCheckin },
      },
    });
  } catch (error: any) {
    console.error('❌ Snapshot decision error:', error.message);
    res.status(500).json({ error: 'AI decision failed', details: error.message });
  }
});

/* ─── Enhanced Decision (with history) ─── */
app.post('/api/care-decision/enhanced', async (req, res) => {
  try {
    const {
      averageHeartRate, dailySteps, daysSinceLastCheckin,
      patientName, age, gender, medicalHistory,
      baselineHeartRate, baselineSteps, previousDecisions,
    } = req.body;

    const prompt = `Perform enhanced clinical analysis on this elderly patient:

Patient: ${patientName || 'Unknown'} (${age || 'Unknown'} years, ${gender || 'Unknown'})
Medical History: ${medicalHistory || 'None provided'}

CURRENT telemetry (7-day averages):
- Heart Rate: ${averageHeartRate} BPM (Baseline: ${baselineHeartRate || 'N/A'} BPM)
- Daily Steps: ${dailySteps} (Baseline: ${baselineSteps || 'N/A'})
- Days Since Last Check-in: ${daysSinceLastCheckin}

${baselineHeartRate ? `Heart Rate Change: ${((averageHeartRate - baselineHeartRate) / baselineHeartRate * 100).toFixed(1)}%` : ''}
${baselineSteps ? `Steps Change: ${((dailySteps - baselineSteps) / baselineSteps * 100).toFixed(1)}%` : ''}

Previous decisions: ${previousDecisions ? JSON.stringify(previousDecisions) : 'None'}

Provide enhanced clinical assessment with trend analysis.`;

    // Mock risk assessment for RAG retrieval
    const simulatedRisks = {
      cardiovascularRisk: averageHeartRate > 100 || averageHeartRate < 50 ? 8 : 4,
      mobilityRisk: dailySteps < 1000 ? 7 : 3,
      engagementRisk: daysSinceLastCheckin > 1 ? 8 : 2,
      socialRisk: 3,
      combinedRiskScore: 0,
    };
    simulatedRisks.combinedRiskScore = Math.max(simulatedRisks.cardiovascularRisk, simulatedRisks.mobilityRisk, simulatedRisks.engagementRisk);

    const guidelines = await retrieveRelevantGuidelines(simulatedRisks);
    const ragPrompt = buildRAGEnrichedPrompt(guidelines);

    const result = await generateContent(
      prompt,
      ragPrompt + '\n' + HEART_SYSTEM_PROMPT,
      {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      }
    );

    const text = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.warn('⚠️ Invalid JSON returned by Vertex AI (possibly truncated by safety filters). Using Fallback.', parseError);
      parsed = JSON.parse(getFallbackMockResponse(prompt, HEART_SYSTEM_PROMPT).response.text());
    }

    res.json({
      success: true,
      decision: parsed,
      metadata: {
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString(),
        enhanced: true,
      },
    });
  } catch (error: any) {
    console.error('❌ Enhanced decision error:', error.message);
    res.status(500).json({ error: 'Enhanced AI decision failed', details: error.message });
  }
});

/* ─── Chat Endpoint ─── */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, patientContext } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const contextPrompt = patientContext
      ? `\n\nPatient context: ${JSON.stringify(patientContext)}`
      : '';

    const chatSystemPrompt = `You are HEART AI Assistant, a clinical decision support chatbot for caregivers and healthcare operators in Malaysia.

CRITICAL INSTRUCTION: You MUST output your response in **English ONLY**, unless the user explicitly requests Bahasa Malaysia. Do NOT generate bilingual responses.
Do NOT use markdown symbols like * or # in your response because they will not render on the frontend. Use clean paragraphs and numbered lists natively.

You help with:
1. Interpreting patient vital signs and risk assessments
2. Explaining care decisions and their reasoning
3. Providing general elderly care guidance
4. Answering questions about the HEART monitoring system

Always be professional, empathetic, and evidence-based. If a question involves emergency symptoms, advise calling 999 immediately.${contextPrompt}`;

    const result = await generateContent(
      message,
      chatSystemPrompt,
      {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    );

    const reply = result.response.text();

    res.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Chat error:', error.message);
    res.status(500).json({ error: 'Chat failed', details: error.message });
  }
});

/* ─── Demo Patients (mock data endpoint) ─── */
app.get('/api/demo/patients', (_req, res) => {
  res.json({
    success: true,
    patients: [
      { patientId: 'pat_001', name: 'Ahmad bin Abdullah', age: 78, gender: 'M', avgHR: 74, steps: 5200, checkinDays: 0 },
      { patientId: 'pat_002', name: 'Lee Chong Wei', age: 73, gender: 'M', avgHR: 63, steps: 7500, checkinDays: 0 },
      { patientId: 'pat_003', name: 'Fatimah binti Hassan', age: 85, gender: 'F', avgHR: 95, steps: 200, checkinDays: 2 },
      { patientId: 'pat_004', name: 'Rajendran a/l Muthu', age: 75, gender: 'M', avgHR: 85, steps: 3300, checkinDays: 1 },
      { patientId: 'pat_005', name: 'Mary Tan Siew Lian', age: 82, gender: 'F', avgHR: 75, steps: 3000, checkinDays: 1 },
    ],
  });
});

/* ─── Batch Decision for Multiple Patients ─── */
app.post('/api/care-decision/batch', async (req, res) => {
  try {
    const { patients } = req.body;

    if (!patients || !Array.isArray(patients)) {
      res.status(400).json({ error: 'patients array is required' });
      return;
    }

    const results = [];
    for (const patient of patients) {
      try {
        const prompt = `Analyze this elderly patient's vital signs and provide a care decision:
Patient: ${patient.name || 'Unknown'} (${patient.age || 'Unknown'} years, ${patient.gender || 'Unknown'})
Medical History: ${patient.medicalHistory || 'None provided'}
- Average Heart Rate: ${patient.avgHR || patient.averageHeartRate} BPM
- Daily Steps: ${patient.steps || patient.dailySteps}
- Days Since Last Check-in: ${patient.checkinDays || patient.daysSinceLastCheckin || 0}
Provide your clinical assessment.`;

        const result = await generateContent(
          prompt,
          HEART_SYSTEM_PROMPT,
          {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          }
        );

        let parsed;
        try {
          parsed = JSON.parse(result.response.text());
        } catch (parseError) {
          console.warn('⚠️ Invalid JSON returned by Vertex AI in Batch. Using Fallback.', parseError);
          parsed = JSON.parse(getFallbackMockResponse(prompt, HEART_SYSTEM_PROMPT).response.text());
        }
        results.push({ patientId: patient.patientId, success: true, decision: parsed });
      } catch (err: any) {
        results.push({ patientId: patient.patientId, success: false, error: err.message });
      }
    }

    res.json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('❌ Batch decision error:', error.message);
    res.status(500).json({ error: 'Batch decision failed', details: error.message });
  }
});

/* ─── SPA Fallback (production) — must be AFTER all API routes ─── */
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

/* ─── Start Server ─── */
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`\n🫀 HEART AI Backend running on http://localhost:${PORT}`);
  console.log(`   Model: gemini-2.5-flash`);
  console.log(`   Endpoints:`);
  console.log(`   POST /api/care-decision/snapshot`);
  console.log(`   POST /api/care-decision/enhanced`);
  console.log(`   POST /api/care-decision/batch`);
  console.log(`   POST /api/chat`);
  console.log(`   GET  /api/demo/patients`);
  console.log(`   GET  /health\n`);
});
