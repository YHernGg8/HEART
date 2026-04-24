/**
 * HEART Doctor Dashboard
 * Inspired by Pic 2 (incoming EMHR, patient cards) and Pic 3 (Evergreen patient detail)
 */

import { useState } from 'react';
import {
  Heart, Activity, Shield, Clock, FileText, AlertTriangle,
  Stethoscope, Eye, ChevronRight, CheckSquare, Square,
  Pill, Siren, Building2, User, Phone, MapPin, Calendar,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { getMockDashboardPatients } from '../mock-data';
import { getRiskColor, type DashboardPatient } from '../types';

/* ── Mock doctor info ── */
const doctorInfo = { name: 'Dr. Sarah Jenkins', dept: 'Emergency & Cardiology', avatar: 'SJ' };

/* ── Mock incoming EMHRs ── */
const incomingEMHR = {
  from: 'Ambulance 03',
  patient: 'John Doe',
  ic: '981203-14-5511',
  status: 'Transmitted from Ambulance 03, Unit KL (Wells, ECoG). Immediate attention required.',
  eta: '2:21',
  hr: 110, spo2: 92, bp: '165/95',
};

/* ── Mock heart rate chart data ── */
const hrChartData = [
  { day: 'Mon', thisWeek: 82, lastWeek: 76 },
  { day: 'Tue', thisWeek: 78, lastWeek: 74 },
  { day: 'Wed', thisWeek: 90, lastWeek: 80 },
  { day: 'Thu', thisWeek: 85, lastWeek: 72 },
  { day: 'Fri', thisWeek: 88, lastWeek: 78 },
  { day: 'Sat', thisWeek: 75, lastWeek: 70 },
  { day: 'Sun', thisWeek: 80, lastWeek: 68 },
];

/* ── Mock medical history ── */
const medicalHistory = [
  { icon: '🫀', name: 'Hypertension', desc: 'High blood pressure that may require regular monitoring' },
  { icon: '🫁', name: 'Asthma', desc: 'A condition causing airway inflammation and narrowing.' },
  { icon: '🧬', name: 'Chronic Kidney Disease', desc: 'Gradual loss of kidney function over time.' },
];

/* ── Mock appointments ── */
const appointments = [
  { name: 'Diuretics', date: '22 October 2024', doctor: 'Dr. Septiannisa', done: true },
  { name: 'Beta-Blockers', date: '14 December 2024', doctor: 'Dr. Septiannisa', done: true },
  { name: 'ACE Inhibitors', date: '24 December 2024', doctor: 'Dr. Septiannisa', done: true },
  { name: 'Surgery', date: '28 December 2024', doctor: 'Dr. Septiannisa', done: false },
];

/* ── Mock action checklist ── */
const defaultChecklist = [
  { id: 1, text: 'Prepare ICU / Mahare in Bay 1', done: false },
  { id: 2, text: 'Alert Cath Lab team on standby', done: false },
  { id: 3, text: 'Order Chest X-Ray', done: false },
  { id: 4, text: 'Prepare blood type & crossmatch', done: false },
];

type ViewTab = 'List Emergencies' | 'Patient Profiles';

export default function DoctorView() {
  const patients = getMockDashboardPatients();
  const emergencies = patients.filter(p => ['CALL_999', 'CLINIC_VISIT'].includes(p.lastDecision.action))
    .sort((a, b) => b.lastDecision.riskScore - a.lastDecision.riskScore);
  const [activeTab, setActiveTab] = useState<ViewTab>('List Emergencies');
  const [selectedPatient, setSelectedPatient] = useState<DashboardPatient | null>(emergencies[0] || null);
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [emhrMarked, setEmhrMarked] = useState(false);

  const toggleCheck = (id: number) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-5 lg:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-[10px] tracking-widest font-medium mb-1" style={{ color: 'var(--heart-text-muted)' }}>— —</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--heart-text)' }}>Doctor Dashboard</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--heart-text-secondary)' }}>
          {doctorInfo.dept} — Comprehensive monitoring and management system for real-time clinical workflows.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#1e293b' }}>
          <FileText className="h-3.5 w-3.5" /> Create EMHR
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {(['List Emergencies', 'Patient Profiles'] as ViewTab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTab === tab ? '#1e293b' : 'var(--heart-surface)',
              color: activeTab === tab ? 'white' : 'var(--heart-text-secondary)',
              border: `1px solid ${activeTab === tab ? '#1e293b' : 'var(--heart-border)'}`,
            }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'List Emergencies' && (
        <>
          {/* Patient Cards Row */}
          <div className="flex gap-3 mb-5 overflow-x-auto pb-2">
            {emergencies.map((p, i) => {
              const risk = getRiskColor(p.lastDecision.riskScore);
              const isCritical = risk === 'red';
              return (
                <button key={p.patientId} onClick={() => setSelectedPatient(p)}
                  className="flex-none w-44 p-4 rounded-2xl transition-all hover:scale-[1.02]"
                  style={{
                    background: isCritical ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'var(--heart-surface)',
                    color: isCritical ? 'white' : 'var(--heart-text)',
                    border: `1px solid ${isCritical ? 'transparent' : 'var(--heart-border-light)'}`,
                    boxShadow: selectedPatient?.patientId === p.patientId ? '0 4px 16px rgba(0,0,0,0.15)' : 'var(--heart-shadow)',
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Siren className="h-4 w-4" style={{ opacity: isCritical ? 1 : 0.4 }} />
                    {i === 1 && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: '#fef3c7', color: '#ca8a04' }}>ETA: 2:21</span>}
                  </div>
                  <div className="text-sm font-bold">{p.patientName}</div>
                  {isCritical && <div className="text-[9px] mt-1 opacity-70">🚨 ARRIVAL: 09.21H</div>}
                </button>
              );
            })}
          </div>

          {/* Incoming EMHR Banner */}
          <div className="rounded-2xl p-4 mb-5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #be123c, #9f1239)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Siren className="h-5 w-5 text-white" />
              </div>
              <div className="text-white">
                <div className="text-sm font-bold">Incoming Paramedic EMHR</div>
                <div className="text-[10px] opacity-80">{incomingEMHR.status}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEmhrMarked(true)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                style={{ background: emhrMarked ? '#10b981' : 'rgba(255,255,255,0.15)', color: 'white' }}>
                {emhrMarked ? '✓ Completed' : 'Mark Completed'}
              </button>
              <div className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#fbbf24', color: '#1e293b' }}>
                ETA: {incomingEMHR.eta}
              </div>
            </div>
          </div>

          {/* Detail Content */}
          {selectedPatient && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Left: Patient Info + Notes */}
              <div className="xl:col-span-2 space-y-4">
                {/* Patient Header */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>
                      📋 EMHR'ED BY KL UNIT 04 (WELLS, ECOG)
                    </div>
                    <button className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text-secondary)' }}>
                      <Eye className="h-3 w-3" /> View Full History
                    </button>
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--heart-text)' }}>{selectedPatient.patientName}</h2>
                  <p className="text-xs" style={{ color: 'var(--heart-text-muted)' }}>
                    {selectedPatient.gender === 'M' ? 'Male' : 'Female'}, {selectedPatient.age} Years
                  </p>
                </div>

                {/* Paramedic Notes */}
                <div className="card p-4">
                  <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--heart-text)' }}>
                    <Stethoscope className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /> PARAMEDIC NOTES (LIVE TRIAGE)
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--heart-text-secondary)' }}>
                    {selectedPatient.lastDecision.reasoning.en}
                  </p>
                </div>

                {/* AI Insights */}
                <div className="card p-4">
                  <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--heart-text)' }}>
                    <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#8b5cf6' }} /> AI INSIGHTS PREVIEW
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>
                      {selectedPatient.lastDecision.riskScore >= 8 ? 'Possible Myocardial Infarction' :
                       selectedPatient.lastDecision.riskScore >= 6 ? 'Elevated Risk: Clinical Review' : 'Moderate Risk Assessment'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: selectedPatient.lastDecision.riskScore >= 8 ? '#fee2e2' : '#fef3c7',
                               color: selectedPatient.lastDecision.riskScore >= 8 ? '#dc2626' : '#ca8a04' }}>
                      {selectedPatient.lastDecision.riskScore >= 8 ? 'High Urgency' : 'Medium Urgency'}
                    </span>
                  </div>
                </div>

                {/* Medical History */}
                <div className="card p-4">
                  <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--heart-text)' }}>Medical History</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {medicalHistory.map(h => (
                      <div key={h.name} className="p-3 rounded-xl" style={{ background: 'var(--heart-bg)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{h.icon}</span>
                          <span className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{h.name}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--heart-text-muted)' }}>{h.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Appointments + Documents */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="card p-4">
                    <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--heart-text)' }}>Appointments</h3>
                    <div className="space-y-3">
                      {appointments.map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${a.done ? '' : ''}`}
                            style={{ background: a.done ? '#dcfce7' : '#fee2e2', color: a.done ? '#16a34a' : '#dc2626' }}>
                            {a.done ? '✓' : '!'}
                          </div>
                          <div>
                            <div className="text-xs font-bold" style={{ color: a.done ? 'var(--heart-text)' : '#dc2626' }}>{a.name}</div>
                            <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{a.date}</div>
                            <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{a.doctor}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card p-4">
                    <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--heart-text)' }}>Document Agreement</h3>
                    <div className="space-y-3">
                      {['Agreement Diuretics', 'Agreement Beta-Blockers', 'Agreement ACE Inhibitors', 'Agreement Surgery'].map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: i < 2 ? '#e0f2fe' : '#fee2e2' }}>
                            <FileText className="h-4 w-4" style={{ color: i < 2 ? '#3b82f6' : '#ef4444' }} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold" style={{ color: 'var(--heart-text)' }}>{d}</div>
                            <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{(2.1 - i * 0.3).toFixed(1)} MB</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: En-Route Vitals + Checklist + HR Chart */}
              <div className="space-y-4">
                {/* En-Route Vitals */}
                <div className="rounded-2xl p-4 space-y-3" style={{ background: '#1e293b', color: 'white' }}>
                  <h3 className="text-xs font-bold flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" style={{ color: '#10b981' }} /> EN-ROUTE VITALS
                  </h3>
                  {[
                    { label: 'Heart Rate', value: `${selectedPatient.keyMetrics.avgHeartRate} bpm`, color: '#ef4444' },
                    { label: 'SpO2', value: '92%', color: '#3b82f6' },
                    { label: 'BP', value: '165/95', color: '#a78bfa' },
                  ].map(v => (
                    <div key={v.label} className="flex items-center justify-between">
                      <span className="text-[10px] opacity-60">{v.label}</span>
                      <span className="text-lg font-black" style={{ color: v.color }}>{v.value}</span>
                    </div>
                  ))}
                </div>

                {/* Action Checklist */}
                <div className="card p-4">
                  <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: 'var(--heart-text)' }}>
                    <Shield className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /> ACTION CHECKLIST
                  </h3>
                  <div className="space-y-2">
                    {checklist.map(c => (
                      <button key={c.id} onClick={() => toggleCheck(c.id)} className="flex items-center gap-2 w-full text-left">
                        {c.done ? <CheckSquare className="h-4 w-4" style={{ color: '#10b981' }} /> : <Square className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} />}
                        <span className={`text-xs ${c.done ? 'line-through' : ''}`} style={{ color: c.done ? 'var(--heart-text-muted)' : 'var(--heart-text)' }}>{c.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heart Rate Chart */}
                <div className="card p-4">
                  <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--heart-text)' }}>Heart Rate</h3>
                  <p className="text-[10px] mb-3" style={{ color: 'var(--heart-text-muted)' }}>Heart rate is in a stable and healthy state this week.</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded-lg" style={{ background: 'var(--heart-bg)' }}>
                      <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Average</div>
                      <div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>78 <span className="text-[10px] font-normal">bpm</span></div>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: 'var(--heart-bg)' }}>
                      <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Minimum</div>
                      <div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>41 <span className="text-[10px] font-normal">bpm</span></div>
                    </div>
                    <div className="text-center p-2 rounded-lg" style={{ background: 'var(--heart-bg)' }}>
                      <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Maximum</div>
                      <div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>90 <span className="text-[10px] font-normal">bpm</span></div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={hrChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[30, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                      <Line type="monotone" dataKey="thisWeek" name="This week" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                      <Line type="monotone" dataKey="lastWeek" name="Last week" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: '#fbbf24' }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} /><span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>This week</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fbbf24' }} /><span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Last week</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'Patient Profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {patients.map(p => (
            <div key={p.patientId} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: '#fde8e8', color: '#e74c5a' }}>{p.patientName.charAt(0)}</div>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>{p.patientName}</div>
                  <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{p.age} yrs • {p.gender === 'M' ? 'Male' : 'Female'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg" style={{ background: '#fef2f2' }}>
                  <div className="text-xs font-bold" style={{ color: '#ef4444' }}>{p.keyMetrics.avgHeartRate}</div>
                  <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>HR</div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: '#eff6ff' }}>
                  <div className="text-xs font-bold" style={{ color: '#3b82f6' }}>{p.keyMetrics.avgSteps}</div>
                  <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Steps</div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: '#f0fdf4' }}>
                  <div className="text-xs font-bold" style={{ color: '#10b981' }}>{p.lastDecision.riskScore}/10</div>
                  <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Risk</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
