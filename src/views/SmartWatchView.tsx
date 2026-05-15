/**
 * HEART SmartWatch View — Wearable Device Simulation with Retell AI WebRTC
 *
 * A realistic smartwatch UI that displays:
 * - Real-time heart rate with animated pulse ring
 * - Step count, SpO2, blood pressure
 * - HEART AI voice agent (Retell AI) embedded via WebRTC
 * - SOS emergency button
 * - Time & date display
 *
 * The Retell AI voice agent lets the patient talk to HEART AI
 * directly from their "smartwatch" for wellness check-ins.
 * Uses retell-client-js-sdk for browser-based WebRTC voice calls.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, Footprints, Droplets, Wind, Phone,
  PhoneOff, Mic, MicOff, AlertTriangle, Battery,
  Wifi, Activity, X, Volume2,
} from 'lucide-react';
import { RetellWebClient } from 'retell-client-js-sdk';
import { getMockDashboardPatients } from '../mock-data';

/* ── Retell Web Client singleton ── */
const retellClient = new RetellWebClient();

export default function SmartWatchView({ scenario = 'resting' }: { scenario?: 'resting' | 'running' | 'attack' }) {
  const patients = getMockDashboardPatients();
  const patient = patients[0]; // Ahmad bin Abdullah

  /* ── Time ── */
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ── Simulated heart rate & Scenarios ── */
  const [heartRate, setHeartRate] = useState(patient.keyMetrics.avgHeartRate);
  const [pulseAnim, setPulseAnim] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      let base = 70;
      let variance = 8;
      
      if (scenario === 'running') {
        base = 145;
        variance = 15;
      } else if (scenario === 'attack') {
        base = 195;
        variance = 20;
      } else {
        base = patient.keyMetrics.avgHeartRate;
      }
      
      setHeartRate(base + Math.round((Math.random() - 0.5) * variance));
      setPulseAnim(true);
      setTimeout(() => setPulseAnim(false), 300);
    }, 1500);
    return () => clearInterval(interval);
  }, [scenario, patient.keyMetrics.avgHeartRate]);



  /* ── Vitals ── */
  const spo2 = 97;
  const steps = patient.keyMetrics.avgSteps;
  const systolic = 128;
  const diastolic = 82;
  const battery = 73;

  /* ── Retell AI Voice Call State ── */
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [showCallUI, setShowCallUI] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Setup Retell event listeners ── */
  useEffect(() => {
    retellClient.on('call_started', () => {
      console.log('📞 Retell WebRTC call started');
      setCallStatus('active');
      setTranscript(prev => [...prev, '✅ Connected to HEART AI']);
      durationRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    });

    retellClient.on('call_ended', () => {
      console.log('📞 Retell WebRTC call ended');
      setCallStatus('ended');
      setAgentSpeaking(false);
      if (durationRef.current) clearInterval(durationRef.current);
    });

    retellClient.on('agent_start_talking', () => {
      setAgentSpeaking(true);
      setTranscript(prev => [...prev, '🤖 HEART AI is speaking...']);
    });

    retellClient.on('agent_stop_talking', () => {
      setAgentSpeaking(false);
    });

    retellClient.on('update', (update: any) => {
      // Real-time transcript updates
      if (update?.transcript) {
        const lastEntry = update.transcript[update.transcript.length - 1];
        if (lastEntry) {
          const icon = lastEntry.role === 'agent' ? '🤖' : '👤';
          setTranscript(prev => {
            const newTranscript = [...prev];
            // Replace the last "speaking..." indicator with actual text
            if (newTranscript.length > 0 && newTranscript[newTranscript.length - 1].includes('speaking...')) {
              newTranscript[newTranscript.length - 1] = `${icon} ${lastEntry.content}`;
            } else {
              newTranscript.push(`${icon} ${lastEntry.content}`);
            }
            return newTranscript;
          });
        }
      }
    });

    retellClient.on('error', (error: any) => {
      console.error('❌ Retell WebRTC error:', error);
      setCallStatus('error');
      setAgentSpeaking(false);
      setTranscript(prev => [...prev, `❌ Connection error: ${error?.message || 'Unknown error'}`]);
      if (durationRef.current) clearInterval(durationRef.current);
    });

    return () => {
      retellClient.removeAllListeners();
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, []);

  /* ── Start voice call via WebRTC ── */
  const startCall = useCallback(async () => {
    setShowCallUI(true);
    setCallStatus('connecting');
    setCallDuration(0);
    setTranscript(['📞 Connecting to HEART AI...']);
    setIsMuted(false);

    try {
      // 1. Get WebRTC access token from our backend
      const res = await fetch('/api/retell/web-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retell_llm_dynamic_variables: {
            patient_name: patient.patientName,
            patient_age: String(patient.age),
            anomaly_type: 'wellness_checkin',
            current_heart_rate: String(heartRate),
            baseline_heart_rate: String(patient.keyMetrics.avgHeartRate),
            current_steps: String(steps),
            baseline_steps: String(steps),
            days_since_checkin: '0',
            risk_score: String(patient.lastDecision.riskScore),
            call_stage: '1',
            call_stage_label: 'Patient-initiated wellness check-in via smartwatch',
          },
        }),
      });

      const data = await res.json();
      if (!data.success || !data.access_token) {
        throw new Error(data.error || 'Failed to get access token from server');
      }

      console.log(`📞 WebRTC access token received. Call ID: ${data.call_id}`);

      // 2. Start the Retell WebRTC call with the access token
      await retellClient.startCall({ accessToken: data.access_token });
    } catch (err: any) {
      console.error('❌ Failed to start WebRTC call:', err);
      setCallStatus('error');
      setTranscript(prev => [...prev, `❌ ${err.message}`]);
    }
  }, [heartRate, steps, patient]);

  /* ── End voice call ── */
  const endCall = useCallback(() => {
    retellClient.stopCall();
    setCallStatus('ended');
    setAgentSpeaking(false);
    if (durationRef.current) clearInterval(durationRef.current);
  }, []);

  /* ── Toggle mute ── */
  const toggleMute = useCallback(() => {
    if (callStatus === 'active') {
      retellClient.toggleMicrophone();
      setIsMuted(prev => !prev);
    }
  }, [callStatus]);

  /* ── Close call UI ── */
  const closeCallUI = useCallback(() => {
    if (callStatus === 'active') endCall();
    setShowCallUI(false);
    setCallStatus('idle');
    setCallDuration(0);
    setTranscript([]);
    setAgentSpeaking(false);
  }, [callStatus, endCall]);

  /* ── Format time ── */
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  /* ── SOS handler ── */
  const [sosTriggered, setSosTriggered] = useState(false);
  const handleSOS = () => {
    setSosTriggered(true);
    setTimeout(() => setSosTriggered(false), 3000);
  };

  /* ── Heart rate zone color ── */
  const getHRColor = (hr: number) => {
    if (hr < 60) return '#3b82f6';
    if (hr < 100) return '#10b981';
    return '#ef4444';
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-transparent">

      {/* ── Watch Body ── */}
      <div style={{
        width: 340,
        height: 340,
        borderRadius: '50%',
        background: 'linear-gradient(145deg, #2a2a3e, #1a1a2a)',
        boxShadow: '0 0 0 12px #1e1e30, 0 0 0 14px #3a3a50, 0 0 60px rgba(231,76,90,0.15), inset 0 0 30px rgba(0,0,0,0.5)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>

        {/* ── Watch Face Content ── */}
        {!showCallUI ? (
          <div style={{ width: 260, height: 260, position: 'relative' }}>

            {/* ── Status Bar ── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0 10px', marginBottom: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Wifi size={10} color="#4ade80" />
                <span style={{ fontSize: 9, color: '#4ade80' }}>Connected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Battery size={10} color={battery > 20 ? '#4ade80' : '#ef4444'} />
                <span style={{ fontSize: 9, color: '#9ca3af' }}>{battery}%</span>
              </div>
            </div>

            {/* ── Time Display ── */}
            <div style={{ textAlign: 'center', marginBottom: 2 }}>
              <div style={{
                fontSize: 42, fontWeight: 900, color: '#fff',
                fontFamily: "'SF Pro Display', system-ui, sans-serif",
                letterSpacing: -2,
                lineHeight: 1,
              }}>
                {time.getHours().toString().padStart(2, '0')}
                <span style={{ color: '#e74c5a', opacity: time.getSeconds() % 2 === 0 ? 1 : 0.3 }}>:</span>
                {time.getMinutes().toString().padStart(2, '0')}
              </div>
              <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 500, marginTop: 1 }}>
                {time.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
            </div>

            {/* ── Scenario Selectors removed from here ── */}

        {/* ── Retell Call UI (Overlay) ── */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '6px 0' }}>
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                {/* Pulse ring */}
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '50%',
                  border: `2px solid ${getHRColor(heartRate)}`,
                  opacity: pulseAnim ? 0.8 : 0.2,
                  transform: pulseAnim ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.3s ease-out',
                }} />
                {/* Inner circle */}
                <div style={{
                  position: 'absolute', inset: 6,
                  borderRadius: '50%',
                  background: `${getHRColor(heartRate)}15`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Heart
                    size={16}
                    color={getHRColor(heartRate)}
                    fill={getHRColor(heartRate)}
                    style={{
                      transform: pulseAnim ? 'scale(1.3)' : 'scale(1)',
                      transition: 'transform 0.15s ease-out',
                    }}
                  />
                  <span style={{
                    fontSize: 22, fontWeight: 900, color: '#fff',
                    lineHeight: 1, marginTop: 2,
                  }}>{heartRate}</span>
                  <span style={{ fontSize: 8, color: '#9ca3af', fontWeight: 600 }}>BPM</span>
                </div>
              </div>
            </div>

            {/* ── Vitals Row ── */}
            <div style={{
              display: 'flex', justifyContent: 'space-around',
              padding: '0 8px', marginBottom: 8,
            }}>
              <VitalPill icon={<Footprints size={10} />} value={steps.toLocaleString()} label="steps" color="#8b5cf6" />
              <VitalPill icon={<Wind size={10} />} value={`${spo2}%`} label="SpO2" color="#10b981" />
              <VitalPill icon={<Droplets size={10} />} value={`${systolic}/${diastolic}`} label="BP" color="#3b82f6" />
            </div>

            {/* ── Action Buttons ── */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '0 20px' }}>
              {/* Talk to HEART AI button */}
              <button
                id="heart-call-button"
                onClick={startCall}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(16,185,129,0.4)',
                  transition: 'transform 0.15s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                title="Talk to HEART AI"
              >
                <Phone size={16} color="#fff" />
                <span style={{ fontSize: 7, color: '#fff', fontWeight: 700, marginTop: 1 }}>HEART</span>
              </button>

              {/* SOS button */}
              <button
                id="sos-button"
                onClick={handleSOS}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: sosTriggered
                    ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(239,68,68,0.4)',
                  transition: 'all 0.15s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                title="SOS Emergency"
              >
                <AlertTriangle size={16} color="#fff" />
                <span style={{ fontSize: 7, color: '#fff', fontWeight: 700, marginTop: 1 }}>
                  {sosTriggered ? 'SENT!' : 'SOS'}
                </span>
              </button>
            </div>

          </div>
        ) : (
          /* ── In-Call UI ── */
          <div style={{
            width: 260, height: 260,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
            {/* Call status indicator */}
            <div style={{
              width: 70, height: 70, borderRadius: '50%',
              background: callStatus === 'active'
                ? agentSpeaking
                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                  : 'linear-gradient(135deg, #10b981, #059669)'
                : callStatus === 'connecting'
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : callStatus === 'error'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #6b7280, #4b5563)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
              animation: callStatus === 'connecting' ? 'pulse-ring 1.5s ease-out infinite' :
                         callStatus === 'active' ? 'pulse-ring 2s ease-out infinite' : 'none',
              transition: 'background 0.3s ease',
            }}>
              {callStatus === 'active' ? (
                agentSpeaking ? (
                  <Volume2 size={28} color="#fff" style={{ animation: 'pulse-scale 1s ease-in-out infinite' }} />
                ) : (
                  <Activity size={28} color="#fff" />
                )
              ) : callStatus === 'connecting' ? (
                <Phone size={28} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <PhoneOff size={28} color="#fff" />
              )}
            </div>

            {/* Call label */}
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
              HEART AI
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>
              {callStatus === 'connecting' && 'Connecting via WebRTC...'}
              {callStatus === 'active' && (agentSpeaking ? `Speaking • ${formatTime(callDuration)}` : formatTime(callDuration))}
              {callStatus === 'ended' && `Call ended • ${formatTime(callDuration)}`}
              {callStatus === 'error' && 'Connection failed'}
              {callStatus === 'idle' && 'Ready'}
            </div>

            {/* Live transcript snippet */}
            {transcript.length > 0 && (
              <div style={{
                width: '100%', maxHeight: 50, overflow: 'hidden',
                padding: '4px 8px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                marginBottom: 8,
              }}>
                <div style={{ fontSize: 9, color: '#d1d5db', lineHeight: 1.4 }}>
                  {transcript[transcript.length - 1]}
                </div>
                {transcript.length > 1 && (
                  <div style={{ fontSize: 8, color: '#6b7280', lineHeight: 1.3, marginTop: 2 }}>
                    {transcript[transcript.length - 2]}
                  </div>
                )}
              </div>
            )}

            {/* Call action buttons */}
            <div style={{ display: 'flex', gap: 16 }}>
              {/* Mute button */}
              <button
                id="mute-button"
                onClick={toggleMute}
                disabled={callStatus !== 'active'}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: callStatus === 'active' ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: callStatus === 'active' ? 1 : 0.4,
                  transition: 'all 0.15s',
                }}
              >
                {isMuted ? <MicOff size={18} color="#fff" /> : <Mic size={18} color="#fff" />}
              </button>

              {/* End / Close button */}
              <button
                id="end-call-button"
                onClick={callStatus === 'active' ? endCall : closeCallUI}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: callStatus === 'active'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {callStatus === 'active' ? (
                  <PhoneOff size={18} color="#fff" />
                ) : (
                  <X size={18} color="#fff" />
                )}
              </button>

              {/* Retry button (only on error/ended) */}
              {(callStatus === 'ended' || callStatus === 'error') && (
                <button
                  id="retry-call-button"
                  onClick={startCall}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <Phone size={18} color="#fff" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Watch bezel markers ── */}
        {[0, 90, 180, 270].map(deg => (
          <div key={deg} style={{
            position: 'absolute',
            width: 3, height: 10,
            background: '#4a4a60',
            borderRadius: 2,
            transform: `rotate(${deg}deg) translateY(-164px)`,
            transformOrigin: 'center center',
            top: '50%', left: '50%',
            marginLeft: -1.5, marginTop: -5,
          }} />
        ))}
      </div>

      {/* ── Watch Band Hint ── */}
      <div style={{
        position: 'absolute',
        bottom: 60, left: '50%', transform: 'translateX(-50%)',
        fontSize: 11, color: '#6b7280',
        textAlign: 'center',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>🫀 HEART Smart Watch</div>
        <div style={{ fontSize: 9 }}>Tap the green button to talk to HEART AI</div>
        <div style={{ fontSize: 8, color: '#4b5563', marginTop: 2 }}>WebRTC Voice • Retell AI</div>
      </div>

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          70% { box-shadow: 0 0 0 15px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}
      </style>
    </div>
  );
}

/* ── Vital Pill Component ── */
function VitalPill({ icon, value, label, color }: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3,
        padding: '3px 6px', borderRadius: 8,
        background: `${color}15`,
      }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{value}</span>
      </div>
      <span style={{ fontSize: 7, color: '#6b7280', fontWeight: 600 }}>{label}</span>
    </div>
  );
}
