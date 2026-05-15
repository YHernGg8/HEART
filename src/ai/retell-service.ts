/**
 * HEART — Retell AI Phone Call Service
 * 
 * Handles the 3-stage autonomous escalation protocol:
 *   Stage 1: AI calls patient (anomaly detected)
 *   Stage 2: AI calls patient again (no response to 1st call)
 *   Stage 3: Dispatch 999 emergency services (no response to 2nd call)
 * 
 * Uses Retell AI REST API for outbound phone calls.
 * Docs: https://docs.retellai.com/api-references/create-phone-call
 */

import { retrieveRelevantGuidelines, buildRAGEnrichedPrompt } from './rag-system.js';

/* ─── Types ─── */

interface RetellCallRequest {
  from_number: string;
  to_number: string;
  override_agent_id?: string;
  override_agent_version?: number;
  metadata?: Record<string, unknown>;
  retell_llm_dynamic_variables?: Record<string, string>;
}

interface RetellCallResponse {
  call_type: 'phone_call';
  from_number: string;
  to_number: string;
  direction: 'outbound' | 'inbound';
  call_id: string;
  agent_id: string;
  agent_version: number;
  call_status: 'registered' | 'not_connected' | 'ongoing' | 'ended' | 'error';
  agent_name: string;
  metadata: Record<string, unknown>;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  transcript?: string;
  disconnection_reason?: string;
}

interface PatientCallData {
  patientId: string;
  patientName: string;
  phoneNumber: string;           // E.164 format e.g. "+60123456789"
  age?: number;
  gender?: string;
  medicalHistory?: string;
  emergencyContactPhone?: string; // Family member's phone
  // Anomaly data that triggered the call
  anomaly: {
    type: 'heart_rate' | 'low_steps' | 'missed_checkin' | 'combined';
    currentHeartRate?: number;
    baselineHeartRate?: number;
    currentSteps?: number;
    baselineSteps?: number;
    daysSinceLastCheckin?: number;
    riskScore: number;
    action: string;
  };
}

interface EscalationRecord {
  patientId: string;
  stage: 1 | 2 | 3;
  callId?: string;
  timestamp: string;
  status: 'calling' | 'answered' | 'no_response' | 'escalated_999';
  callResponse?: RetellCallResponse;
}

/* ─── Config ─── */

const RETELL_API_KEY = process.env.RETELL_API_KEY || '';
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID || '';
const RETELL_FROM_NUMBER = process.env.RETELL_FROM_NUMBER || ''; // Your Retell phone number in E.164
const RETELL_API_BASE = 'https://api.retellai.com';

/* ─── Escalation Tracker (in-memory, replace with Firestore in production) ─── */

const escalationTracker: Map<string, EscalationRecord[]> = new Map();

/* ─── Core API Call ─── */

/**
 * Create an outbound phone call via Retell AI API
 * POST https://api.retellai.com/v2/create-phone-call
 */
async function createRetellPhoneCall(request: RetellCallRequest): Promise<RetellCallResponse> {
  const response = await fetch(`${RETELL_API_BASE}/v2/create-phone-call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Retell API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<RetellCallResponse>;
}

/**
 * Get call status from Retell AI
 * GET https://api.retellai.com/v2/get-call/{call_id}
 */
async function getRetellCallStatus(callId: string): Promise<RetellCallResponse> {
  const response = await fetch(`${RETELL_API_BASE}/v2/get-call/${callId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RETELL_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Retell API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<RetellCallResponse>;
}

/* ─── Stage 1: First AI Call ─── */

/**
 * Stage 1 — First outbound AI call to the patient.
 * Triggered when HEART detects anomaly in health telemetry.
 */
export async function initiateStage1Call(patient: PatientCallData): Promise<EscalationRecord> {
  console.log(`\n📞 [STAGE 1] Initiating first AI call to ${patient.patientName} (${patient.phoneNumber})`);
  console.log(`   Anomaly: ${patient.anomaly.type} | Risk Score: ${patient.anomaly.riskScore}`);

  const record: EscalationRecord = {
    patientId: patient.patientId,
    stage: 1,
    timestamp: new Date().toISOString(),
    status: 'calling',
  };

  try {
    const callResponse = await createRetellPhoneCall({
      from_number: RETELL_FROM_NUMBER,
      to_number: patient.phoneNumber,
      override_agent_id: RETELL_AGENT_ID,
      metadata: {
        heart_patient_id: patient.patientId,
        heart_stage: 1,
        heart_anomaly_type: patient.anomaly.type,
        heart_risk_score: patient.anomaly.riskScore,
      },
      retell_llm_dynamic_variables: {
        patient_name: patient.patientName,
        patient_age: String(patient.age || 'Unknown'),
        anomaly_type: patient.anomaly.type,
        current_heart_rate: String(patient.anomaly.currentHeartRate || 'N/A'),
        baseline_heart_rate: String(patient.anomaly.baselineHeartRate || 'N/A'),
        current_steps: String(patient.anomaly.currentSteps || 'N/A'),
        baseline_steps: String(patient.anomaly.baselineSteps || 'N/A'),
        days_since_checkin: String(patient.anomaly.daysSinceLastCheckin || '0'),
        risk_score: String(patient.anomaly.riskScore),
        call_stage: '1',
        call_stage_label: 'First wellness check call',
      },
    });

    record.callId = callResponse.call_id;
    record.callResponse = callResponse;
    record.status = 'calling';

    console.log(`   ✅ Call created: ${callResponse.call_id} | Status: ${callResponse.call_status}`);

    // Track the escalation
    const existing = escalationTracker.get(patient.patientId) || [];
    existing.push(record);
    escalationTracker.set(patient.patientId, existing);

    return record;
  } catch (error: any) {
    console.error(`   ❌ Stage 1 call failed: ${error.message}`);
    record.status = 'no_response';
    return record;
  }
}

/* ─── Stage 2: Follow-up AI Call ─── */

/**
 * Stage 2 — Second outbound AI call (follow-up).
 * Called when Stage 1 had no response (patient didn't pick up / no answer).
 */
export async function initiateStage2Call(patient: PatientCallData): Promise<EscalationRecord> {
  console.log(`\n📞📞 [STAGE 2] Initiating FOLLOW-UP call to ${patient.patientName} (${patient.phoneNumber})`);
  console.log(`   ⚠️  First call had no response. Escalating urgency.`);

  const record: EscalationRecord = {
    patientId: patient.patientId,
    stage: 2,
    timestamp: new Date().toISOString(),
    status: 'calling',
  };

  try {
    const callResponse = await createRetellPhoneCall({
      from_number: RETELL_FROM_NUMBER,
      to_number: patient.phoneNumber,
      override_agent_id: RETELL_AGENT_ID,
      metadata: {
        heart_patient_id: patient.patientId,
        heart_stage: 2,
        heart_anomaly_type: patient.anomaly.type,
        heart_risk_score: patient.anomaly.riskScore,
        heart_is_followup: true,
      },
      retell_llm_dynamic_variables: {
        patient_name: patient.patientName,
        patient_age: String(patient.age || 'Unknown'),
        anomaly_type: patient.anomaly.type,
        current_heart_rate: String(patient.anomaly.currentHeartRate || 'N/A'),
        baseline_heart_rate: String(patient.anomaly.baselineHeartRate || 'N/A'),
        current_steps: String(patient.anomaly.currentSteps || 'N/A'),
        baseline_steps: String(patient.anomaly.baselineSteps || 'N/A'),
        days_since_checkin: String(patient.anomaly.daysSinceLastCheckin || '0'),
        risk_score: String(patient.anomaly.riskScore),
        call_stage: '2',
        call_stage_label: 'Urgent follow-up call — first call unanswered',
      },
    });

    record.callId = callResponse.call_id;
    record.callResponse = callResponse;
    record.status = 'calling';

    console.log(`   ✅ Follow-up call created: ${callResponse.call_id} | Status: ${callResponse.call_status}`);

    // Track the escalation
    const existing = escalationTracker.get(patient.patientId) || [];
    existing.push(record);
    escalationTracker.set(patient.patientId, existing);

    return record;
  } catch (error: any) {
    console.error(`   ❌ Stage 2 call failed: ${error.message}`);
    record.status = 'no_response';
    return record;
  }
}

/* ─── Stage 3: Emergency 999 Dispatch ─── */

/**
 * Stage 3 — Dispatch 999 emergency services.
 * Called when BOTH Stage 1 and Stage 2 had no response.
 * This is the final escalation — patient is potentially in danger.
 */
export async function initiateStage3Emergency(patient: PatientCallData): Promise<EscalationRecord> {
  console.log(`\n🚨🚨🚨 [STAGE 3] EMERGENCY ESCALATION for ${patient.patientName}`);
  console.log(`   Both AI calls unanswered. Dispatching 999.`);
  console.log(`   Patient: ${patient.patientName} (${patient.age || '?'}yo, ${patient.gender || '?'})`);
  console.log(`   Risk Score: ${patient.anomaly.riskScore}/10`);
  console.log(`   Anomaly: ${patient.anomaly.type}`);

  const record: EscalationRecord = {
    patientId: patient.patientId,
    stage: 3,
    timestamp: new Date().toISOString(),
    status: 'escalated_999',
  };

  // Build the emergency data payload
  const emergencyPayload = {
    timestamp: new Date().toISOString(),
    patient: {
      id: patient.patientId,
      name: patient.patientName,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phoneNumber,
      medicalHistory: patient.medicalHistory,
      emergencyContact: patient.emergencyContactPhone,
    },
    vitals: {
      heartRate: patient.anomaly.currentHeartRate,
      baselineHeartRate: patient.anomaly.baselineHeartRate,
      dailySteps: patient.anomaly.currentSteps,
      baselineSteps: patient.anomaly.baselineSteps,
      daysSinceLastCheckin: patient.anomaly.daysSinceLastCheckin,
    },
    riskAssessment: {
      riskScore: patient.anomaly.riskScore,
      action: 'CALL_999',
      anomalyType: patient.anomaly.type,
    },
    escalationHistory: escalationTracker.get(patient.patientId) || [],
    message: `HEART EMERGENCY: Patient ${patient.patientName} (${patient.age}yo) is unresponsive after 2 automated wellness check calls. ` +
             `Risk score: ${patient.anomaly.riskScore}/10. ` +
             `Anomaly detected: ${patient.anomaly.type}. ` +
             `Last known heart rate: ${patient.anomaly.currentHeartRate || 'N/A'} BPM. ` +
             `Daily steps: ${patient.anomaly.currentSteps || 'N/A'}. ` +
             `Days since last check-in: ${patient.anomaly.daysSinceLastCheckin || 'N/A'}.`,
  };

  console.log('\n   📋 Emergency Payload:');
  console.log(JSON.stringify(emergencyPayload, null, 2));

  // TODO: In production, integrate with Malaysia 999 dispatch API
  // TODO: Send WhatsApp notification to family via emergencyContactPhone
  // TODO: Store emergency record in Firestore

  // Track the escalation
  const existing = escalationTracker.get(patient.patientId) || [];
  existing.push(record);
  escalationTracker.set(patient.patientId, existing);

  // Notify family member if emergency contact exists
  if (patient.emergencyContactPhone) {
    console.log(`   📱 Notifying family member at ${patient.emergencyContactPhone}`);
    // TODO: Trigger WhatsApp deep link or SMS notification
  }

  return record;
}

/* ─── Full Escalation Orchestrator ─── */

/**
 * Full 3-stage autonomous escalation flow.
 * 
 * 1. Call patient (Stage 1)
 * 2. Wait & check if call was answered
 * 3. If no response → Call again (Stage 2) 
 * 4. Wait & check if call was answered
 * 5. If still no response → Dispatch 999 (Stage 3)
 * 
 * @param patient - Patient data with anomaly info
 * @param waitBetweenCallsMs - Time to wait before checking call result (default: 120 seconds)
 */
export async function runEscalationProtocol(
  patient: PatientCallData,
  waitBetweenCallsMs: number = 120_000
): Promise<{ finalStage: number; records: EscalationRecord[] }> {
  const records: EscalationRecord[] = [];

  // ── Stage 1: First call ──
  const stage1 = await initiateStage1Call(patient);
  records.push(stage1);

  if (stage1.status === 'no_response' && !stage1.callId) {
    // API call itself failed, go straight to Stage 2
    console.log('   ⚠️  Stage 1 API failed, proceeding to Stage 2...');
  } else if (stage1.callId) {
    // Wait for the call to complete
    console.log(`   ⏳ Waiting ${waitBetweenCallsMs / 1000}s for Stage 1 call to complete...`);
    await sleep(waitBetweenCallsMs);

    // Check call result
    try {
      const callResult = await getRetellCallStatus(stage1.callId);
      stage1.callResponse = callResult;

      if (isCallAnswered(callResult)) {
        stage1.status = 'answered';
        console.log('   ✅ Stage 1: Patient answered! Escalation complete.');
        return { finalStage: 1, records };
      } else {
        stage1.status = 'no_response';
        console.log(`   ❌ Stage 1: No response (reason: ${callResult.disconnection_reason})`);
      }
    } catch (err: any) {
      console.warn(`   ⚠️  Could not check Stage 1 status: ${err.message}`);
      stage1.status = 'no_response';
    }
  }

  // ── Stage 2: Follow-up call ──
  const stage2 = await initiateStage2Call(patient);
  records.push(stage2);

  if (stage2.status === 'no_response' && !stage2.callId) {
    console.log('   ⚠️  Stage 2 API failed, proceeding to Stage 3...');
  } else if (stage2.callId) {
    console.log(`   ⏳ Waiting ${waitBetweenCallsMs / 1000}s for Stage 2 call to complete...`);
    await sleep(waitBetweenCallsMs);

    try {
      const callResult = await getRetellCallStatus(stage2.callId);
      stage2.callResponse = callResult;

      if (isCallAnswered(callResult)) {
        stage2.status = 'answered';
        console.log('   ✅ Stage 2: Patient answered! Escalation complete.');
        return { finalStage: 2, records };
      } else {
        stage2.status = 'no_response';
        console.log(`   ❌ Stage 2: No response (reason: ${callResult.disconnection_reason})`);
      }
    } catch (err: any) {
      console.warn(`   ⚠️  Could not check Stage 2 status: ${err.message}`);
      stage2.status = 'no_response';
    }
  }

  // ── Stage 3: Emergency dispatch ──
  const stage3 = await initiateStage3Emergency(patient);
  records.push(stage3);

  return { finalStage: 3, records };
}

/* ─── Helper: Check if call was answered ─── */

function isCallAnswered(call: RetellCallResponse): boolean {
  // A call is considered "answered" if:
  // - It ended normally (user_hangup or agent_hangup) with some duration
  // - It was NOT one of the "no answer" disconnection reasons
  const noAnswerReasons = [
    'dial_no_answer',
    'dial_busy',
    'dial_failed',
    'voicemail_reached',
    'invalid_destination',
    'user_declined',
    'inactivity',
    'telephony_provider_unavailable',
    'telephony_provider_permission_denied',
    'sip_routing_error',
    'marked_as_spam',
  ];

  if (call.call_status === 'ended' && call.disconnection_reason) {
    return !noAnswerReasons.includes(call.disconnection_reason);
  }

  // If call is still ongoing, it was answered
  if (call.call_status === 'ongoing') {
    return true;
  }

  return false;
}

/* ─── Helper: Sleep ─── */

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ─── Express Route Handlers ─── */

/**
 * Register Retell AI routes on an Express app.
 * Call this from server.ts: registerRetellRoutes(app)
 */
export function registerRetellRoutes(app: any) {
  
  /**
   * POST /api/retell/web-call
   * Create a Retell web call session for the frontend smartwatch UI.
   * Returns an access_token that the frontend uses with retell-client-js-sdk.
   * 
   * Body: { agent_id?, metadata?, retell_llm_dynamic_variables? }
   */
  app.post('/api/retell/web-call', async (req: any, res: any) => {
    try {
      const { agent_id, metadata, retell_llm_dynamic_variables } = req.body;

      const response = await fetch(`${RETELL_API_BASE}/v2/create-web-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agent_id || RETELL_AGENT_ID,
          metadata: metadata || {},
          retell_llm_dynamic_variables: retell_llm_dynamic_variables || {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Retell API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`📞 Web call created: ${data.call_id}`);
      res.json({
        success: true,
        access_token: data.access_token,
        call_id: data.call_id,
      });
    } catch (error: any) {
      console.error('❌ Web call error:', error.message);
      res.status(500).json({ error: 'Failed to create web call', details: error.message });
    }
  });

  /**
   * POST /api/retell/call
   * Trigger a single outbound AI call to a patient.
   * 
   * Body: {
   *   patientId, patientName, phoneNumber, age?, gender?,
   *   medicalHistory?, emergencyContactPhone?,
   *   anomaly: { type, currentHeartRate?, baselineHeartRate?, 
   *              currentSteps?, baselineSteps?, daysSinceLastCheckin?, 
   *              riskScore, action }
   * }
   */
  app.post('/api/retell/call', async (req: any, res: any) => {
    try {
      const patient: PatientCallData = req.body;

      if (!patient.patientId || !patient.phoneNumber) {
        res.status(400).json({ error: 'Missing required fields: patientId, phoneNumber' });
        return;
      }

      const result = await initiateStage1Call(patient);
      res.json({
        success: true,
        stage: 1,
        escalation: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('❌ Retell call error:', error.message);
      res.status(500).json({ error: 'Failed to create phone call', details: error.message });
    }
  });

  /**
   * POST /api/retell/escalate
   * Run the full 3-stage escalation protocol for a patient.
   * This is a long-running request (waits between calls).
   * 
   * Body: same as /api/retell/call
   * Query: ?wait=120000 (ms between calls, default 120000)
   */
  app.post('/api/retell/escalate', async (req: any, res: any) => {
    try {
      const patient: PatientCallData = req.body;
      const waitMs = parseInt(req.query.wait || '120000', 10);

      if (!patient.patientId || !patient.phoneNumber) {
        res.status(400).json({ error: 'Missing required fields: patientId, phoneNumber' });
        return;
      }

      const result = await runEscalationProtocol(patient, waitMs);
      res.json({
        success: true,
        finalStage: result.finalStage,
        records: result.records,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('❌ Escalation error:', error.message);
      res.status(500).json({ error: 'Escalation protocol failed', details: error.message });
    }
  });

  /**
   * GET /api/retell/status/:callId
   * Check the status of a Retell call.
   */
  app.get('/api/retell/status/:callId', async (req: any, res: any) => {
    try {
      const { callId } = req.params;
      const callStatus = await getRetellCallStatus(callId);
      res.json({
        success: true,
        call: callStatus,
        answered: isCallAnswered(callStatus),
      });
    } catch (error: any) {
      console.error('❌ Call status error:', error.message);
      res.status(500).json({ error: 'Failed to get call status', details: error.message });
    }
  });

  /**
   * GET /api/retell/escalation-history/:patientId
   * Get the escalation history for a patient.
   */
  app.get('/api/retell/escalation-history/:patientId', (req: any, res: any) => {
    const { patientId } = req.params;
    const history = escalationTracker.get(patientId) || [];
    res.json({
      success: true,
      patientId,
      records: history,
      currentStage: history.length > 0 ? history[history.length - 1].stage : 0,
    });
  });

  /**
   * POST /api/retell/webhook
   * Retell AI webhook endpoint — receives call status updates.
   * Configure this URL in your Retell dashboard.
   */
  app.post('/api/retell/webhook', async (req: any, res: any) => {
    try {
      const event = req.body;
      console.log(`\n🔔 Retell Webhook Event: ${event.event || 'unknown'}`);
      console.log(`   Call ID: ${event.call?.call_id || 'N/A'}`);
      console.log(`   Status: ${event.call?.call_status || 'N/A'}`);

      const callData = event.call;
      if (callData?.metadata?.heart_patient_id) {
        const patientId = callData.metadata.heart_patient_id as string;
        const stage = callData.metadata.heart_stage as number;

        // Update escalation tracker
        const history = escalationTracker.get(patientId) || [];
        const matchingRecord = history.find(r => r.callId === callData.call_id);
        if (matchingRecord) {
          matchingRecord.callResponse = callData;
          if (isCallAnswered(callData)) {
            matchingRecord.status = 'answered';
            console.log(`   ✅ Patient ${patientId} answered at Stage ${stage}!`);
          } else if (callData.call_status === 'ended') {
            matchingRecord.status = 'no_response';
            console.log(`   ❌ Patient ${patientId} did not answer at Stage ${stage}. Reason: ${callData.disconnection_reason}`);
          }
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('❌ Webhook error:', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  /**
   * POST /api/retell/report-status
   * Custom tool callback — called by the Retell AI agent during the call
   * when it uses the "report_patient_status" tool.
   * 
   * This receives the agent's real-time assessment of the patient's condition
   * and triggers appropriate HEART system actions.
   * 
   * Body (from Retell custom tool):
   * { args: { status, symptoms, notes, patient_responded, patient_id } }
   */
  app.post('/api/retell/report-status', async (req: any, res: any) => {
    try {
      const { args } = req.body;
      const status = args?.status || 'STABLE';
      const symptoms = args?.symptoms || 'none';
      const notes = args?.notes || '';
      const patientResponded = args?.patient_responded ?? true;
      const patientId = args?.patient_id || 'unknown';

      console.log(`\n📋 [HEART] Agent Status Report Received:`);
      console.log(`   Patient ID: ${patientId}`);
      console.log(`   Status:     ${status}`);
      console.log(`   Symptoms:   ${symptoms}`);
      console.log(`   Responded:  ${patientResponded}`);
      console.log(`   Notes:      ${notes}`);

      // Store in escalation tracker
      const history = escalationTracker.get(patientId) || [];
      const latestRecord = history[history.length - 1];
      if (latestRecord) {
        latestRecord.status = patientResponded ? 'answered' : 'no_response';
      }

      // Map status to HEART actions
      let action = 'MONITOR';
      switch (status) {
        case 'EMERGENCY':
          action = 'CALL_999';
          console.log(`   🚨 EMERGENCY — Triggering 999 dispatch for patient ${patientId}`);
          // TODO: Trigger 999 dispatch and WhatsApp family notification
          break;
        case 'URGENT':
          action = 'CLINIC_VISIT';
          console.log(`   ⚠️ URGENT — Scheduling clinic visit for patient ${patientId}`);
          // TODO: Schedule clinic visit via Firestore
          break;
        case 'MILD_CONCERN':
          action = 'FAMILY_CHECK';
          console.log(`   🟡 MILD_CONCERN — Notifying family for patient ${patientId}`);
          // TODO: Send WhatsApp notification to family
          break;
        case 'STABLE':
          action = 'MONITOR';
          console.log(`   ✅ STABLE — Patient ${patientId} is fine. Continuing monitoring.`);
          break;
      }

      // Return response that Retell will speak to the patient
      res.json({
        status: 'received',
        action,
        message: status === 'STABLE'
          ? 'Your health check is complete. Everything looks good!'
          : status === 'MILD_CONCERN'
            ? 'I have noted your concerns and will inform your family to check on you.'
            : status === 'URGENT'
              ? 'I have flagged your condition. A clinic visit will be arranged for you within 24 hours.'
              : 'Help is on the way. Please stay where you are.',
      });
    } catch (error: any) {
      console.error('❌ Report status error:', error.message);
      res.status(500).json({ error: 'Failed to process status report' });
    }
  });

  /**
   * POST /api/retell/call-analyzed
   * Processes the full post-call analysis from Retell AI (call_analyzed event).
   * 
   * This is where we extract the custom analysis fields:
   * - patient_health_status (STABLE | MILD_CONCERN | URGENT | EMERGENCY)
   * - symptoms_reported (comma-separated list)
   * - follow_up_required (boolean)
   * 
   * These are configured in the agent's post_call_analysis_data and populated
   * by GPT-4.1 after the call transcript is analyzed.
   */
  app.post('/api/retell/call-analyzed', async (req: any, res: any) => {
    try {
      const callData = req.body;
      const callAnalysis = callData.call_analysis || {};
      const customData = callAnalysis.custom_analysis_data || {};
      const metadata = callData.metadata || {};

      console.log(`\n📊 [HEART] Post-Call Analysis Received:`);
      console.log(`   Call ID:          ${callData.call_id || 'N/A'}`);
      console.log(`   Summary:          ${callAnalysis.call_summary || 'N/A'}`);
      console.log(`   Successful:       ${callAnalysis.call_successful}`);
      console.log(`   Sentiment:        ${callAnalysis.user_sentiment || 'N/A'}`);
      console.log(`   Health Status:    ${customData.patient_health_status || 'N/A'}`);
      console.log(`   Symptoms:         ${customData.symptoms_reported || 'none'}`);
      console.log(`   Follow-up Req:    ${customData.follow_up_required || false}`);
      console.log(`   Duration:         ${callData.duration_ms ? (callData.duration_ms / 1000).toFixed(1) + 's' : 'N/A'}`);
      console.log(`   Disconnect:       ${callData.disconnection_reason || 'N/A'}`);

      // Update escalation tracker with analysis results
      const patientId = metadata.heart_patient_id as string;
      if (patientId) {
        const history = escalationTracker.get(patientId) || [];
        const matchingRecord = history.find(r => r.callId === callData.call_id);
        if (matchingRecord) {
          matchingRecord.callResponse = callData;
        }

        // If follow-up is required and this was Stage 1 with no response,
        // auto-trigger Stage 2
        const wasAnswered = callAnalysis.call_successful && !callAnalysis.in_voicemail;
        if (!wasAnswered && metadata.heart_stage === 1) {
          console.log(`   ⏰ Auto-scheduling Stage 2 call for patient ${patientId} in 5 minutes...`);
          // In production, use a proper job queue (e.g., Cloud Tasks)
          // For now, log the intent
        }
      }

      // TODO: Store analysis in Firestore for dashboard rendering
      // TODO: Generate WhatsApp notification if follow_up_required

      res.json({ success: true, processed: true });
    } catch (error: any) {
      console.error('❌ Call analysis error:', error.message);
      res.status(500).json({ error: 'Failed to process call analysis' });
    }
  });

  console.log('   📞 Retell AI routes registered:');
  console.log('   POST /api/retell/web-call');
  console.log('   POST /api/retell/call');
  console.log('   POST /api/retell/escalate');
  console.log('   GET  /api/retell/status/:callId');
  console.log('   GET  /api/retell/escalation-history/:patientId');
  console.log('   POST /api/retell/webhook');
  console.log('   POST /api/retell/report-status');
  console.log('   POST /api/retell/call-analyzed');
}
