/**
 * HEART Field Unit View — EMHR (Emergency Medical Health Record)
 * Mobile Unit Management with live vitals, triage readout, and transmit-to-ED
 */

import { useState } from 'react';
import {
  Heart, Wind, Gauge, Plus, Save, Send, Radio, Wifi,
  AlertTriangle, Shield, Clock, MapPin, FileText, Activity,
  Stethoscope, Pill, Truck, Building2, ChevronRight,
} from 'lucide-react';
import { getSnapshotDecision, type AIDecision } from '../services/api';

/* ── Mock active patients on-board ── */
const mockPatients = [
  { id: 'PT-1', name: 'John Doe', ic: '981203-14-5511', complaint: 'Patient experiencing severe chest pain and shortness of breath. History of hypertension.', hr: 142, spo2: 94, bpSys: 150, bpDia: 90, status: 'critical' as const },
  { id: 'PT-2', name: 'Siti Aminah', ic: '870415-08-6622', complaint: 'Motor vehicle accident victim, blunt force trauma to chest. Alert and oriented.', hr: 98, spo2: 96, bpSys: 130, bpDia: 85, status: 'urgent' as const },
  { id: 'PT-3', name: 'Lim Wei Jian', ic: '750922-10-3344', complaint: 'Suspected stroke. Slurred speech, left-sided weakness. Onset ~30 mins ago.', hr: 88, spo2: 97, bpSys: 180, bpDia: 100, status: 'critical' as const },
];

type PatientOnBoard = typeof mockPatients[0];

export default function FieldUnitView() {
  const [selectedId, setSelectedId] = useState('PT-1');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIDecision | null>(null);
  const [transmitted, setTransmitted] = useState(false);
  const [interventions, setInterventions] = useState('Administered O2 via non-rebreather mask at 15L/min. Started IV line.');
  const [medications, setMedications] = useState('Aspirin 324mg PO. Nitroglycerin 0.4mg SL.');
  const [eta, setEta] = useState('8');
  const [facility, setFacility] = useState('Hospital Kuala Lumpur (HKL)');

  const selected = mockPatients.find(p => p.id === selectedId) || mockPatients[0];

  const runAITriage = async (patient: PatientOnBoard) => {
    setAiLoading(true);
    const result = await getSnapshotDecision({
      averageHeartRate: patient.hr,
      dailySteps: 40,
      daysSinceLastCheckin: 0,
      patientName: patient.name,
      medicalHistory: patient.complaint,
    });
    setAiLoading(false);
    if (result.success && result.decision) setAiResult(result.decision);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-5 lg:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-[10px] tracking-widest font-medium mb-1" style={{ color: 'var(--heart-text-muted)' }}>Field EMHR Unit</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--heart-text)' }}>Mobile Unit Management</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--heart-text-secondary)' }}>Comprehensive monitoring and management system for real-time clinical workflows.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-5 max-w-[1400px] mx-auto">
        {/* ── Left: Active Patients On-Board ── */}
        <div className="w-full xl:w-72 flex-none space-y-3">
          <h2 className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>Active Patients On-Board</h2>
          {mockPatients.map(p => (
            <button key={p.id} onClick={() => { setSelectedId(p.id); setAiResult(null); setTransmitted(false); }}
              className="w-full text-left card p-3.5 transition-all"
              style={{
                background: selectedId === p.id ? 'var(--heart-bg-alt)' : 'var(--heart-surface)',
                borderLeft: selectedId === p.id ? '3px solid #e74c5a' : '3px solid transparent',
              }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: '#fef3c7', color: '#ca8a04' }}>Drafting</span>
                <span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{p.id}</span>
              </div>
              <div className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>{p.name}</div>
              <p className="text-[10px] mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--heart-text-secondary)' }}>{p.complaint}</p>
            </button>
          ))}
          <button className="w-full card p-3.5 flex items-center justify-center gap-2 text-xs font-semibold transition-all hover:scale-[1.01]"
            style={{ color: 'var(--heart-text-muted)', border: '1px dashed var(--heart-border)' }}>
            <Plus className="h-4 w-4" /> New Patient
          </button>
        </div>

        {/* ── Center: EMHR Form ── */}
        <div className="flex-1 space-y-4">
          {/* Unit Banner */}
          <div className="card p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" style={{ color: '#f59e0b' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>KL-Unit 04 (Active)</span>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Managing EMHR for: {selected.name} (IC: {selected.ic})</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--heart-bg)', color: 'var(--heart-text-secondary)', border: '1px solid var(--heart-border)' }}>
                <Save className="h-3.5 w-3.5" /> Save Draft
              </button>
              <button onClick={() => setTransmitted(true)} disabled={transmitted}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all"
                style={{ background: transmitted ? '#10b981' : '#1e293b' }}>
                <Send className="h-3.5 w-3.5" /> {transmitted ? 'Transmitted ✓' : 'Transmit to ED'}
              </button>
            </div>
          </div>

          {/* Live Vitals */}
          <div className="grid grid-cols-3 gap-3">
            <VitalCard icon={<Heart />} label="Heart Rate" value={selected.hr} unit="bpm" color="#ef4444" bg="#fef2f2" />
            <VitalCard icon={<Wind />} label="SpO2" value={selected.spo2} unit="%" color="#3b82f6" bg="#eff6ff" />
            <VitalCard icon={<Gauge />} label="Blood Pressure" value={`${selected.bpSys}/${selected.bpDia}`} unit="mmHg" color="#8b5cf6" bg="#f5f3ff" />
          </div>

          {/* Triage Notes */}
          <div className="card p-4">
            <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--heart-text)' }}>
              <Stethoscope className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /> Triage Notes
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--heart-text-secondary)' }}>{selected.complaint}</p>
            <div className="text-[10px] mt-2" style={{ color: 'var(--heart-text-muted)' }}>Pre-hospital support</div>
          </div>

          {/* Full EMHR Draft */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--heart-text)' }}>
              <FileText className="h-3.5 w-3.5" style={{ color: '#3b82f6' }} /> Full EMHR Draft
            </h3>
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--heart-text-muted)' }}>Pre-Hospital Interventions</label>
              <textarea value={interventions} onChange={e => setInterventions(e.target.value)} rows={2}
                className="w-full text-xs p-2.5 rounded-lg outline-none resize-none" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--heart-text-muted)' }}>Medications Administered</label>
              <textarea value={medications} onChange={e => setMedications(e.target.value)} rows={1}
                className="w-full text-xs p-2.5 rounded-lg outline-none resize-none" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--heart-text-muted)' }}>Estimated Time of Arrival (ETA)</label>
                <div className="flex items-center gap-2">
                  <input type="text" value={eta} onChange={e => setEta(e.target.value)}
                    className="w-20 text-xs p-2 rounded-lg outline-none text-center" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }} />
                  <span className="text-xs" style={{ color: 'var(--heart-text-muted)' }}>mins</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--heart-text-muted)' }}>Receiving Facility</label>
                <input type="text" value={facility} onChange={e => setFacility(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg outline-none" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Field Triage Readout ── */}
        <div className="w-full xl:w-80 flex-none space-y-4">
          <div className="card p-4 space-y-3" style={{ background: '#1e293b', color: 'white', border: 'none' }}>
            <h3 className="text-xs font-bold flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /> Field Triage Readout
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: '#dc2626', color: 'white' }}>Critical</span>
              <span className="text-[10px] opacity-60">Transmit priority</span>
            </div>

            {!aiResult && !aiLoading && (
              <button onClick={() => runAITriage(selected)}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'linear-gradient(135deg, #e74c5a, #d4404f)', color: 'white' }}>
                🤖 Run AI Triage Analysis
              </button>
            )}

            {aiLoading && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs opacity-70">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Gemini analyzing...
              </div>
            )}

            {aiResult && (
              <>
                <div className="flex items-center gap-1 text-[10px] opacity-60"><Shield className="h-3 w-3" /> Transmit as {aiResult.action === 'CALL_999' ? 'critical' : 'urgent'}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-[10px] opacity-50">Risk score</div><div className="text-2xl font-black">{aiResult.riskScore}</div></div>
                  <div><div className="text-[10px] opacity-50">Confidence</div><div className="text-2xl font-black">{aiResult.confidencePercent}%</div></div>
                </div>
                <div>
                  <div className="text-[10px] opacity-50 mb-1">Field rationale</div>
                  <p className="text-[11px] leading-relaxed opacity-80">{aiResult.reasoning.en}</p>
                </div>
                {aiResult.referencedGuidelines && aiResult.referencedGuidelines.length > 0 && (
                  <div>
                    <div className="text-[10px] opacity-50 mb-1">Evidence used</div>
                    <div className="flex flex-wrap gap-1">
                      {aiResult.referencedGuidelines.map(g => (
                        <span key={g} className="text-[9px] px-2 py-0.5 rounded" style={{ background: '#334155', color: '#94a3b8' }}>{g}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] opacity-50"><div className="text-[9px] flex items-center gap-1"><Radio className="h-3 w-3" /> Decision trace</div><div className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Vertex connected</div></div>
              </>
            )}
          </div>

          {/* Transmit Status */}
          {transmitted && (
            <div className="card p-3 flex items-center gap-2" style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
              <Building2 className="h-4 w-4" style={{ color: '#16a34a' }} />
              <div>
                <div className="text-xs font-bold" style={{ color: '#16a34a' }}>Transmitted to {facility}</div>
                <div className="text-[10px]" style={{ color: '#15803d' }}>ETA: {eta} mins • {selected.name}</div>
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="card p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--heart-text-muted)' }}>Unit</span>
              <span className="font-semibold" style={{ color: 'var(--heart-text)' }}>KL-Unit 04</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--heart-text-muted)' }}>Patients on board</span>
              <span className="font-semibold" style={{ color: 'var(--heart-text)' }}>{mockPatients.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--heart-text-muted)' }}>Status</span>
              <span className="font-semibold" style={{ color: '#10b981' }}>🟢 Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalCard({ icon, label, value, unit, color, bg }: { icon: React.ReactNode; label: string; value: number | string; unit: string; color: string; bg: string }) {
  return (
    <div className="card p-4 text-center" style={{ background: bg }}>
      <div className="flex items-center justify-center gap-1.5 mb-2 [&>svg]:h-4 [&>svg]:w-4" style={{ color }}>{icon}<span className="text-[10px] font-semibold" style={{ color: 'var(--heart-text-muted)' }}>{label}</span></div>
      <div className="text-3xl font-black" style={{ color: 'var(--heart-text)' }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--heart-text-muted)' }}>{unit}</div>
    </div>
  );
}
