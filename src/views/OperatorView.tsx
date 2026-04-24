/**
 * HEART Operator View — 999 Dispatch Command Center
 * Left: Active Emergencies list with severity badges
 * Right: 999 Call Log & AI Analysis, Hospital Allocation, Dispatch
 */

import { useState } from 'react';
import {
  PhoneCall, Building2, Users, MapPin,
  CheckCircle, Truck, ChevronDown, X, Building
} from 'lucide-react';
import { getSnapshotDecision, type AIDecision } from '../services/api';

/* ── Mock emergency cases ── */
interface EmergencyCase {
  id: string;
  name: string;
  age: number;
  gender: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  source: string;
  location: string;
  timeAgo: string;
  status: 'pending' | 'dispatched' | 'completed';
  transcript: { role: 'operator' | 'caller'; text: string }[];
  keywords: string[];
  hr: number;
  steps: number;
}

const initialCases: EmergencyCase[] = [
  {
    id: 'CASE-873', name: 'Simulated Incoming Call', age: 36, gender: 'M', severity: 'CRITICAL',
    source: '999 Call', location: 'Petaling Jaya, Selangor', timeAgo: 'Just now', status: 'pending',
    transcript: [
      { role: 'operator', text: '999 Emergency, what is your emergency?' },
      { role: 'caller', text: 'Help! They just collapsed and are not breathing!' },
    ],
    keywords: ['Unresponsive', 'No Pulse Reported'], hr: 0, steps: 0,
  },
  {
    id: 'CASE-872', name: 'John Doe', age: 68, gender: 'M', severity: 'HIGH',
    source: 'AI App', location: 'Subang Jaya, Selangor (GPS verified)', timeAgo: '1m ago', status: 'pending',
    transcript: [
      { role: 'operator', text: 'HEART AI alert received. Can you describe your symptoms?' },
      { role: 'caller', text: 'Chest pain... difficulty breathing for the last 30 minutes.' },
    ],
    keywords: ['Chest Pain', 'Dyspnea', 'Hypertension History'], hr: 142, steps: 200,
  },
  {
    id: 'CASE-871', name: 'Siti Aminah', age: 34, gender: 'F', severity: 'CRITICAL',
    source: '999 Call', location: 'Highway PLUS, KM 284 (Triangulation)', timeAgo: 'Just now', status: 'pending',
    transcript: [
      { role: 'operator', text: '999 Emergency, what is your emergency?' },
      { role: 'caller', text: 'There\'s been a car accident on the highway! A woman is trapped!' },
    ],
    keywords: ['MVA', 'Entrapment', 'Blunt Trauma'], hr: 98, steps: 0,
  },
  {
    id: 'CASE-870', name: 'Unknown Caller', age: 0, gender: 'M', severity: 'HIGH',
    source: '999 Call', location: 'Georgetown, Penang', timeAgo: '3m ago', status: 'pending',
    transcript: [
      { role: 'operator', text: '999 Emergency, can you tell me what happened?' },
      { role: 'caller', text: 'Someone here fainted... I don\'t know them...' },
    ],
    keywords: ['Syncope', 'Unknown Patient', 'Public Location'], hr: 0, steps: 0,
  },
  {
    id: 'CASE-869', name: 'Lim Wei Jian', age: 52, gender: 'M', severity: 'MEDIUM',
    source: 'AI App', location: 'Johor Bahru, Johor', timeAgo: '5m ago', status: 'pending',
    transcript: [
      { role: 'operator', text: 'HEART AI flagged elevated heart rate. Are you experiencing symptoms?' },
      { role: 'caller', text: 'Feeling dizzy... heart racing for an hour now.' },
    ],
    keywords: ['Tachycardia', 'Dizziness', 'Palpitations'], hr: 130, steps: 1200,
  },
];

/* ── Mock hospitals for allocation ── */
const hospitals = [
  { name: 'Subang Medical Center', edLoad: 74, beds: 28, queue: 0, eta: '8 min' },
  { name: 'Hospital Kuala Lumpur', edLoad: 89, beds: 42, queue: 3, eta: '14 min' },
  { name: 'Sunway Medical Centre', edLoad: 62, beds: 18, queue: 1, eta: '11 min' },
];

const sevColor = (s: string) => s === 'CRITICAL' ? { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' } : s === 'HIGH' ? { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' } : { bg: '#fef3c7', color: '#ca8a04', border: '#fde68a' };

export default function OperatorView() {
  const [cases, setCases] = useState(initialCases);
  const [selectedId, setSelectedId] = useState(initialCases[0].id);
  const [aiResult, setAiResult] = useState<AIDecision | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(0);
  const [showOverride, setShowOverride] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);

  const selected = cases.find(c => c.id === selectedId) || cases[0];
  const activeCases = cases.filter(c => c.status !== 'completed');

  const simulateCall = () => {
    const names = ['Ahmad bin Yusof', 'Priya a/p Rajan', 'Chen Li Hua', 'Abdul Karim', 'Nurul Aisyah'];
    const locations = ['Shah Alam, Selangor', 'Ipoh, Perak', 'Kuching, Sarawak', 'Klang Valley', 'Penang Island'];
    const sev: EmergencyCase['severity'][] = ['CRITICAL', 'HIGH', 'MEDIUM'];
    const newCase: EmergencyCase = {
      id: `CASE-${874 + cases.length}`,
      name: names[Math.floor(Math.random() * names.length)],
      age: 20 + Math.floor(Math.random() * 60),
      gender: Math.random() > 0.5 ? 'M' : 'F',
      severity: sev[Math.floor(Math.random() * sev.length)],
      source: Math.random() > 0.5 ? '999 Call' : 'AI App',
      location: locations[Math.floor(Math.random() * locations.length)],
      timeAgo: 'Just now',
      status: 'pending',
      transcript: [
        { role: 'operator', text: '999 Emergency, what is your emergency?' },
        { role: 'caller', text: 'Please help! Someone needs medical attention urgently!' },
      ],
      keywords: ['Emergency', 'Urgent'],
      hr: Math.floor(60 + Math.random() * 100),
      steps: Math.floor(Math.random() * 3000),
    };
    setCases(prev => [newCase, ...prev]);
    setSelectedId(newCase.id);
    setAiResult(null);
  };

  const runAI = async () => {
    setAiLoading(true);
    const result = await getSnapshotDecision({
      averageHeartRate: selected.hr || 120,
      dailySteps: selected.steps || 50,
      daysSinceLastCheckin: 0,
      patientName: selected.name,
      medicalHistory: selected.keywords.join(', '),
    });
    setAiLoading(false);
    if (result.success && result.decision) setAiResult(result.decision);
  };

  const dispatch = () => {
    setCases(prev => prev.map(c => c.id === selectedId ? { ...c, status: 'dispatched' as const } : c));
    setAiResult(null);
  };

  const markCompleted = () => {
    setCases(prev => prev.map(c => c.id === selectedId ? { ...c, status: 'completed' as const } : c));
    const next = cases.find(c => c.id !== selectedId && c.status === 'pending');
    if (next) { setSelectedId(next.id); setAiResult(null); }
  };

  const sc = sevColor(selected.severity);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] tracking-widest font-medium" style={{ color: 'var(--heart-text-muted)' }}>Operator Command</div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--heart-text)' }}>999 Dispatch & Admin</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--heart-text-secondary)' }}>Comprehensive monitoring and management system for real-time clinical workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={simulateCall} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #e74c5a, #d4404f)' }}>
            <PhoneCall className="h-3.5 w-3.5" /> Simulate Call
          </button>
          <button onClick={() => setShowDispatchModal(true)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors" style={{ background: 'var(--heart-surface)', color: 'var(--heart-text-secondary)', border: '1px solid var(--heart-border)' }}>
            <Truck className="h-3.5 w-3.5" /> Live Dispatch
          </button>
          <button onClick={() => setShowFacilityModal(true)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors" style={{ background: 'var(--heart-surface)', color: 'var(--heart-text-secondary)', border: '1px solid var(--heart-border)' }}>
            <Building2 className="h-3.5 w-3.5" /> Facility Registration
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors" style={{ background: 'var(--heart-surface)', color: 'var(--heart-text-secondary)', border: '1px solid var(--heart-border)' }}>
            <Users className="h-3.5 w-3.5" /> Facility & Staff Directory
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        {/* ═══ LEFT: Active Emergencies ═══ */}
        <div className="w-[340px] flex-none space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>Active Emergencies</h2>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: '#fee2e2', color: '#dc2626' }}>{activeCases.length} Active</span>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
            <Search className="h-3.5 w-3.5" style={{ color: 'var(--heart-text-muted)' }} />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search emergencies..." className="bg-transparent outline-none text-xs w-full" style={{ color: 'var(--heart-text)' }} />
          </div>

          {/* Emergency Cards */}
          <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            {cases.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase())).map(c => {
              const cs = sevColor(c.severity);
              const isSelected = selectedId === c.id;
              return (
                <button key={c.id} onClick={() => { setSelectedId(c.id); setAiResult(null); }}
                  className="w-full text-left card p-3.5 transition-all hover:scale-[1.005]"
                  style={{
                    background: isSelected ? cs.bg : 'var(--heart-surface)',
                    borderLeft: `3px solid ${isSelected ? cs.color : 'transparent'}`,
                    opacity: c.status === 'completed' ? 0.5 : 1,
                  }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>{c.severity}</span>
                    <span className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>{c.timeAgo}</span>
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>
                    {c.name} {c.age > 0 ? `(${c.age}, ${c.gender})` : ''}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{c.source} • {c.location}</span>
                  </div>
                  {c.status === 'dispatched' && <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold" style={{ color: '#16a34a' }}><Truck className="h-3 w-3" /> Dispatched</div>}
                  {c.status === 'completed' && <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold" style={{ color: '#6b7280' }}><CheckCircle className="h-3 w-3" /> Completed</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ RIGHT: Call Log + AI Analysis ═══ */}
        <div className="flex-1 space-y-4">
          {/* Call Log Header */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>999 Call Log & AI Analysis</h2>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--heart-text-muted)' }}>ID: {selected.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{selected.severity}</span>
                {selected.status === 'pending' && <button onClick={markCompleted} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#dcfce7', color: '#16a34a' }}>Mark Completed</button>}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: sc.bg, color: sc.color }}>{selected.name.charAt(0)}</div>
              <div>
                <div className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>{selected.name} {selected.age > 0 ? `(${selected.age}, ${selected.gender})` : ''}</div>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--heart-text-muted)' }}><MapPin className="h-3 w-3" /> {selected.location}</div>
              </div>
            </div>

            {/* Transcription */}
            <div className="text-[10px] font-bold mb-2" style={{ color: 'var(--heart-text-muted)' }}>Automated Transcription</div>
            <div className="space-y-2 p-3 rounded-xl" style={{ background: 'var(--heart-bg)' }}>
              {selected.transcript.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[10px] font-bold flex-none w-16 pt-0.5" style={{ color: t.role === 'operator' ? '#3b82f6' : '#ef4444' }}>{t.role === 'operator' ? 'Operator' : 'Caller'}</span>
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--heart-text)' }}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Dashboard */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--heart-text-muted)' }}>Severity</div>
              <div className="text-lg font-black px-3 py-1 rounded-lg inline-block" style={{ background: sc.bg, color: sc.color }}>{selected.severity}</div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--heart-text-muted)' }}>AI Confidence</div>
              <div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>{aiResult ? `${aiResult.confidencePercent}%` : '—'}</div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--heart-text-muted)' }}>Status</div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${selected.status === 'pending' ? 'bg-amber-400 animate-pulse' : selected.status === 'dispatched' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>
                  {selected.status === 'pending' ? 'Pending Dispatch' : selected.status === 'dispatched' ? 'Dispatched' : 'Completed'}
                </span>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="card p-4">
            <div className="text-[10px] font-bold mb-2" style={{ color: 'var(--heart-text-muted)' }}>Detected Keywords / Symptoms</div>
            <div className="flex flex-wrap gap-1.5">
              {selected.keywords.map(k => (
                <span key={k} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{k}</span>
              ))}
            </div>
            {selected.severity === 'CRITICAL' && (
              <div className="mt-3 p-2.5 rounded-lg text-xs font-semibold" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <span className="font-black">Highlight:</span> Cardiac Arrest Simulation — Dispatch Advanced Life Support (ALS) Immediately.
              </div>
            )}
          </div>

          {/* Run AI or Show Result */}
          {!aiResult && !aiLoading && selected.status === 'pending' && (
            <button onClick={runAI} className="w-full py-3 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.005]" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
              🤖 Run AI Hospital Allocation
            </button>
          )}
          {aiLoading && (
            <div className="card p-6 flex items-center justify-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
              <span className="text-xs font-semibold" style={{ color: 'var(--heart-text-muted)' }}>HEART AI analyzing case & allocating hospital...</span>
            </div>
          )}

          {/* AI Hospital Allocation Result */}
          {aiResult && (
            <div className="card p-5 space-y-4" style={{ border: '1px solid #bbf7d0' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#dcfce7' }}><CheckCircle className="h-4 w-4" style={{ color: '#16a34a' }} /></div>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#16a34a' }}>AI Hospital Allocation</div>
                  <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Optimal Path Found</div>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--heart-text-secondary)' }}>
                Analysed location, severity, and real-time directory metrics (ED Load, Capacity, Active Queues). HEART AI recommends:
              </p>

              {/* AI Metrics */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg text-center" style={{ background: 'var(--heart-bg)' }}>
                  <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Dispatch support</div>
                  <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--heart-text)' }}>Case Prioritisation</div>
                  <div className="text-[10px] font-bold mt-0.5" style={{ color: sc.color }}>{selected.severity === 'CRITICAL' ? 'Critical' : selected.severity === 'HIGH' ? 'Urgent' : 'Standard'}</div>
                </div>
                <div className="p-2.5 rounded-lg text-center" style={{ background: 'var(--heart-bg)' }}>
                  <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Suggested dispatch action</div>
                  <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--heart-text)' }}>Prioritise emergency dispatch</div>
                </div>
                <div className="p-2.5 rounded-lg text-center" style={{ background: 'var(--heart-bg)' }}>
                  <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Risk score</div>
                  <div className="text-2xl font-black" style={{ color: 'var(--heart-text)' }}>{aiResult.riskScore}</div>
                </div>
                <div className="p-2.5 rounded-lg text-center" style={{ background: 'var(--heart-bg)' }}>
                  <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Confidence</div>
                  <div className="text-2xl font-black" style={{ color: 'var(--heart-text)' }}>{aiResult.confidencePercent}%</div>
                </div>
              </div>

              {/* Decision trace */}
              <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>
                <div className="flex items-center gap-1"><Radio className="h-3 w-3" /> Decision trace</div>
                <div className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Vertex connected</div>
              </div>

              {/* Hospital Selection */}
              <div className="space-y-2">
                {hospitals.map((h, i) => (
                  <button key={h.name} onClick={() => setSelectedHospital(i)}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all"
                    style={{
                      background: selectedHospital === i ? '#f0fdf4' : 'var(--heart-surface)',
                      border: `1px solid ${selectedHospital === i ? '#86efac' : 'var(--heart-border-light)'}`,
                    }}>
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4" style={{ color: selectedHospital === i ? '#16a34a' : 'var(--heart-text-muted)' }} />
                      <div>
                        <div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{h.name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>ED Load: {h.edLoad}% • {h.beds} Beds • Queue: {h.queue}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--heart-text-muted)' }}>ETA {h.eta}</span>
                  </button>
                ))}
              </div>

              {/* Dispatch Buttons */}
              <div className="flex items-center gap-3">
                <button onClick={dispatch}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                  <CheckCircle className="h-4 w-4" /> Approve & Dispatch
                </button>
                <button onClick={() => setShowOverride(!showOverride)}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'var(--heart-bg)', color: 'var(--heart-text-secondary)', border: '1px solid var(--heart-border)' }}>
                  Override / Change Facility <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              {showOverride && (
                <div className="p-3 rounded-xl text-xs" style={{ background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3' }}>
                  <span className="font-bold">Override Mode:</span> Select a different hospital above, then click "Approve & Dispatch" to override AI recommendation.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="card-glass w-full max-w-lg p-6 relative">
            <button onClick={() => setShowDispatchModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Truck className="h-5 w-5 text-blue-500" /> Live Dispatch Status</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {cases.filter(c => c.status === 'dispatched').length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">No active dispatches currently on route.</div>
              ) : (
                cases.filter(c => c.status === 'dispatched').map(c => (
                  <div key={c.id} className="p-4 rounded-xl" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-bold">{c.name}</div>
                      <div className="text-[10px] font-bold text-green-600 px-2 py-1 rounded bg-green-50">On Route</div>
                    </div>
                    <div className="text-xs text-slate-500 mb-1">Destination: {hospitals[0].name}</div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showFacilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="card-glass w-full max-w-lg p-6 relative">
            <button onClick={() => setShowFacilityModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Building className="h-5 w-5 text-indigo-500" /> Register Facility</h2>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowFacilityModal(false); alert('Facility registration submitted for review.'); }}>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Facility Name</label>
                <input type="text" className="w-full text-sm p-3 rounded-xl border outline-none" required placeholder="e.g. Klinik Kesihatan Baru" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                  <select className="w-full text-sm p-3 rounded-xl border outline-none cursor-pointer">
                    <option>Hospital (Public)</option>
                    <option>Hospital (Private)</option>
                    <option>Clinic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ED Capacity</label>
                  <input type="number" className="w-full text-sm p-3 rounded-xl border outline-none" required placeholder="e.g. 20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                <input type="text" className="w-full text-sm p-3 rounded-xl border outline-none" required placeholder="Full street address..." />
              </div>
              <button type="submit" className="w-full py-3 mt-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01]" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
                Submit Registration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
