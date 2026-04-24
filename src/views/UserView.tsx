/**
 * HEART User View — Tino Health Monitoring Dashboard
 *
 * Inspired by Tino's modular health monitoring layout:
 * - 6 color-coded metric cards (SpO2, HR, Temp, BP, Calories, Steps)
 * - Resident Activity section (current motion + time pie chart)
 * - Notifications panel (medication, SOS, timestamps)
 * - Mobile-first centered layout with rounded card aesthetic
 */

import { useState } from 'react';
import {
  Heart, Footprints, Thermometer, Droplets, Flame, Wind,
  Bell, Clock, MapPin, AlertTriangle, Pill, Radio,
  Settings, ChevronDown, Eye, Trash2,
  Home, MessageSquare, Loader2, Brain,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getMockDashboardPatients } from '../mock-data';
import { getRiskColor } from '../types';
import { getSnapshotDecision, type AIDecision } from '../services/api';

/* ── Mock extended vitals (demo only) ── */
function generateExtendedVitals(avgHR: number, avgSteps: number) {
  return {
    spo2: Math.min(99, Math.max(90, 97 + Math.round((Math.random() - 0.5) * 4))),
    heartRate: avgHR,
    temperature: +(36.0 + Math.random() * 0.8).toFixed(1),
    systolic: Math.round(120 + (avgHR - 70) * 0.8 + (Math.random() - 0.5) * 10),
    diastolic: Math.round(80 + (avgHR - 70) * 0.3 + (Math.random() - 0.5) * 6),
    calories: Math.round(avgSteps * 0.04 + 120),
    steps: avgSteps,
  };
}

/* ── Resident Activity (mock) ── */
const activityData = [
  { name: 'Living Room', value: 35, color: '#4ade80' },
  { name: 'Bedroom', value: 28, color: '#60a5fa' },
  { name: 'Bathroom', value: 12, color: '#f97316' },
  { name: 'Kitchen', value: 15, color: '#a78bfa' },
  { name: 'Outside', value: 10, color: '#fbbf24' },
];

/* ── Notifications (mock) ── */
const mockNotifications = [
  { id: 1, type: 'offline' as const, title: "Device offline", body: "Wearable device is currently offline.", time: '14:00', section: 'Today' },
  { id: 2, type: 'medication' as const, title: "Excess Medication", body: "Patient has been accessing medicine box 12 times today. Last usage at 14:30.", time: '12:30', section: 'Today' },
  { id: 3, type: 'sos' as const, title: "SOS alert", body: "I've fallen and I hurt my knee. Help", time: '10:30', section: 'Today' },
  { id: 4, type: 'offline' as const, title: "Device offline", body: "Wearable is currently offline.", time: '14:00', section: 'This week' },
  { id: 5, type: 'sos' as const, title: "SOS alert", body: "I've fallen and I hurt my knee. Help", time: '10:30', section: 'This week' },
];

export default function UserView() {
  const patients = getMockDashboardPatients();
  const patient = patients[0]; // Ahmad bin Abdullah
  const decision = patient.lastDecision;
  const riskColor = getRiskColor(decision.riskScore);

  const vitals = generateExtendedVitals(patient.keyMetrics.avgHeartRate, patient.keyMetrics.avgSteps);
  const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'notifications'>('home');
  const [checkedIn, setCheckedIn] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIDecision | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleCheckIn = async () => {
    setCheckedIn(true);
    setAiLoading(true);
    setAiError(null);
    const result = await getSnapshotDecision({
      averageHeartRate: patient.keyMetrics.avgHeartRate,
      dailySteps: patient.keyMetrics.avgSteps,
      daysSinceLastCheckin: 0,
      patientName: patient.patientName,
      age: patient.age,
      gender: patient.gender === 'M' ? 'Male' : 'Female',
      medicalHistory: 'Hypertension, Type 2 Diabetes',
    });
    setAiLoading(false);
    if (result.success && result.decision) {
      setAiResponse(result.decision);
    } else {
      setAiError(result.error || 'Failed to get AI assessment. Start backend: npm run server:dev');
    }
  };

  /* ── Status config ── */
  const statusColors: Record<string, { dot: string; text: string }> = {
    green:  { dot: '#10b981', text: 'Loved one is indoors' },
    yellow: { dot: '#f59e0b', text: 'Needs a check-in' },
    orange: { dot: '#f97316', text: 'Attention required' },
    red:    { dot: '#ef4444', text: 'Emergency detected' },
  };
  const status = statusColors[riskColor];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center" style={{ background: 'var(--heart-bg)' }}>
      {/* ── Phone-width container ── */}
      <div className="w-full max-w-[420px] px-4 pt-5 pb-24 space-y-5">

        {activeTab === 'home' && (
          <>
            {/* ── Patient Header ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: '#fde8e8', color: '#e74c5a' }}>
                  {patient.patientName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base font-bold" style={{ color: 'var(--heart-text)' }}>{patient.patientName}</h1>
                    <ChevronDown className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--heart-text-secondary)' }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: status.dot }} />
                    {status.text}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl" style={{ background: 'var(--heart-surface)', boxShadow: 'var(--heart-shadow)' }}>
                  <Bell className="h-4 w-4" style={{ color: 'var(--heart-text-secondary)' }} />
                </button>
                <button className="p-2 rounded-xl" style={{ background: 'var(--heart-surface)', boxShadow: 'var(--heart-shadow)' }}>
                  <Settings className="h-4 w-4" style={{ color: 'var(--heart-text-secondary)' }} />
                </button>
              </div>
            </div>

            {/* ── Section Title ── */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>Health Dashboard</h2>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg" style={{ background: 'var(--heart-bg-alt)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 5h4V1H1v4zm8-4v4h4V1H9zM1 13h4V9H1v4zm8 0h4V9H9v4z" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>

            {/* ── 6 Metric Cards Grid ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* SpO2 */}
              <MetricCard icon={<Wind />} label="SpO2" value={`${vitals.spo2}`} unit="%" bg="#e8f5ec" iconColor="#10b981" />
              {/* Heart Rate */}
              <MetricCard icon={<Heart />} label="Heart rate" value={`${vitals.heartRate}`} unit="bpm" bg="#fde8e8" iconColor="#e74c5a" />
              {/* Temperature */}
              <MetricCard icon={<Thermometer />} label="Temperature" value={`${vitals.temperature}`} unit="°C" bg="#fff0e6" iconColor="#f97316" />
              {/* Blood Pressure */}
              <MetricCard icon={<Droplets />} label="Blood pressure" value={`${vitals.systolic}·${vitals.diastolic}`} unit="mmHg" bg="#e8f0fd" iconColor="#3b82f6" />
              {/* Calories */}
              <MetricCard icon={<Flame />} label="Calories" value={`${vitals.calories}`} unit="kcal" bg="#fef2f2" iconColor="#ef4444" />
              {/* Steps */}
              <MetricCard icon={<Footprints />} label="Steps" value={vitals.steps.toLocaleString()} unit="" bg="#f0e8fd" iconColor="#8b5cf6" />
            </div>

            {/* ── Check-In Button ── */}
            <button
              onClick={handleCheckIn}
              disabled={checkedIn || aiLoading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                background: checkedIn ? '#ecfdf5' : aiLoading ? '#fef3c7' : 'linear-gradient(135deg, #e74c5a, #d4404f)',
                color: checkedIn ? '#059669' : aiLoading ? '#92400e' : 'white',
                border: checkedIn ? '2px solid #a7f3d0' : 'none',
                boxShadow: checkedIn ? 'none' : '0 4px 16px rgba(231, 76, 90, 0.25)',
                cursor: checkedIn ? 'default' : 'pointer',
              }}
            >
              {aiLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Gemini AI analyzing...</span>
              ) : checkedIn ? '✅ Checked In — AI Assessed!' : '🕐 Check In Now (AI Analysis)'}
            </button>

            {/* ── Live AI Response ── */}
            {aiResponse && (
              <div className="card p-4 space-y-3" style={{ border: '1px solid #a7f3d0' }}>
                <div className="flex items-center gap-1.5">
                  <Brain className="h-4 w-4" style={{ color: '#8b5cf6' }} />
                  <span className="text-xs font-bold" style={{ color: '#8b5cf6' }}>🤖 Live AI Assessment (Gemini 2.0 Flash)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black" style={{ color: aiResponse.riskScore >= 8 ? '#dc2626' : aiResponse.riskScore >= 5 ? '#f59e0b' : '#10b981' }}>
                    {aiResponse.riskScore}/10
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ background: aiResponse.action === 'MONITOR' ? '#dcfce7' : aiResponse.action === 'CALL_999' ? '#fee2e2' : '#fef3c7',
                             color: aiResponse.action === 'MONITOR' ? '#16a34a' : aiResponse.action === 'CALL_999' ? '#dc2626' : '#ca8a04' }}>
                    {aiResponse.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] ml-auto" style={{ color: 'var(--heart-text-muted)' }}>Conf: {aiResponse.confidencePercent}%</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--heart-text)' }}>{aiResponse.reasoning.en}</p>
                <details className="text-xs">
                  <summary className="cursor-pointer font-semibold" style={{ color: '#ec4899' }}>🇲🇾 Bahasa Malaysia</summary>
                  <p className="mt-1 leading-relaxed" style={{ color: 'var(--heart-text-secondary)' }}>{aiResponse.reasoning.ms}</p>
                </details>
                {aiResponse.actionPlan && (
                  <div className="p-2.5 rounded-lg" style={{ background: 'var(--heart-bg)' }}>
                    <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--heart-text-muted)' }}>Action Plan</div>
                    <p className="text-[11px]" style={{ color: 'var(--heart-text-secondary)' }}>{aiResponse.actionPlan.en}</p>
                  </div>
                )}
                {aiResponse.referencedGuidelines && aiResponse.referencedGuidelines.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {aiResponse.referencedGuidelines.map(g => (
                      <span key={g} className="text-[9px] px-2 py-0.5 rounded" style={{ background: '#e0f2fe', color: '#0284c7' }}>{g}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Error */}
            {aiError && (
              <div className="card p-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <p className="text-xs" style={{ color: '#dc2626' }}>⚠️ {aiError}</p>
              </div>
            )}

            {/* ── Fallback AI Summary (mock) ── */}
            {!aiResponse && !aiLoading && (
              <div className="card p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'var(--heart-text-muted)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--heart-text-muted)' }}>What the system says</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--heart-text)' }}>{decision.reasoning.en}</p>
              </div>
            )}

            {/* ── WhatsApp ── */}
            {patient.whatsappDeepLinks && Object.keys(patient.whatsappDeepLinks).length > 0 && (
              <a href={Object.values(patient.whatsappDeepLinks)[0]} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-semibold"
                style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                <MessageSquare className="h-4 w-4" /> Contact Family via WhatsApp
              </a>
            )}
          </>
        )}

        {activeTab === 'activity' && (
          <>
            {/* ── Resident Activity ── */}
            <h2 className="text-base font-bold text-center pt-2" style={{ color: 'var(--heart-text)' }}>Resident Activity</h2>

            {/* Week calendar strip */}
            <div className="card p-3">
              <div className="flex justify-between text-[10px] font-medium mb-1" style={{ color: 'var(--heart-text-muted)' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => <span key={d} className="w-9 text-center">{d}</span>)}
                </div>
              <div className="flex justify-between">
                {[6, 7, 8, 9, 10, 11, 12].map((n, i) => (
                  <div key={n} className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{
                      background: i === 4 ? '#e74c5a' : 'transparent',
                      color: i === 4 ? 'white' : 'var(--heart-text)',
                    }}>
                    {n}
                  </div>
                ))}
              </div>
            </div>

            {/* Current Motion */}
            <div className="card p-4">
              <div className="text-[10px] text-center mb-1" style={{ color: 'var(--heart-text-muted)' }}>Today</div>
              <div className="text-sm font-bold text-center mb-3" style={{ color: 'var(--heart-text)' }}>Friday, March 10</div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--heart-bg)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#e0f2fe' }}>
                  <Radio className="h-5 w-5" style={{ color: '#3b82f6' }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>Current motion</div>
                  <div className="text-[11px]" style={{ color: 'var(--heart-text-secondary)' }}>The living room</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Today 11:02</div>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--heart-text-secondary)' }}>
                    <Clock className="h-3 w-3" /> 35 min
                  </div>
                </div>
              </div>
            </div>

            {/* Total Time Pie */}
            <div className="card p-4">
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--heart-text)' }}>Total time</h3>

              {/* Attention banner */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl mb-3" style={{ background: '#e0f2fe' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#bfdbfe' }}>
                  <AlertTriangle className="h-4 w-4" style={{ color: '#2563eb' }} />
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: '#1e40af' }}>Attention!</div>
                  <div className="text-[10px]" style={{ color: '#3b82f6' }}>{patient.patientName.split(' ')[0]} spends a lot of time in the bathroom</div>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={activityData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                        {activityData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>5 hrs</div>
                    <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>30 min</div>
                    <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Total time</div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {activityData.map(a => (
                  <div key={a.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
                    <span className="text-[10px]" style={{ color: 'var(--heart-text-secondary)' }}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <>
            <h2 className="text-base font-bold text-center pt-2" style={{ color: 'var(--heart-text)' }}>Notifications</h2>

            {['Today', 'This week'].map(section => {
              const items = mockNotifications.filter(n => n.section === section);
              if (items.length === 0) return null;
              return (
                <div key={section}>
                  <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--heart-text)' }}>{section}</h3>
                  <div className="space-y-2">
                    {items.map(n => (
                      <div key={n.id} className="card p-3.5 flex items-start gap-3">
                        <div className="flex-none w-9 h-9 rounded-full flex items-center justify-center"
                          style={{
                            background: n.type === 'sos' ? '#fee2e2' : n.type === 'medication' ? '#e0f2fe' : '#f3f4f6',
                          }}>
                          {n.type === 'sos' && <span className="text-[10px] font-black" style={{ color: '#dc2626' }}>SOS</span>}
                          {n.type === 'medication' && <Pill className="h-4 w-4" style={{ color: '#3b82f6' }} />}
                          {n.type === 'offline' && <Radio className="h-4 w-4" style={{ color: '#6b7280' }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{n.title}</div>
                          <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--heart-text-secondary)' }}>{n.body}</div>
                        </div>
                        <div className="flex-none text-right">
                          <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{n.time}</div>
                          {n.type !== 'sos' && (
                            <div className="flex items-center gap-1 mt-1">
                              <button className="p-1 rounded hover:bg-gray-100"><Eye className="h-3 w-3" style={{ color: 'var(--heart-text-muted)' }} /></button>
                              <button className="p-1 rounded hover:bg-gray-100"><Trash2 className="h-3 w-3" style={{ color: 'var(--heart-text-muted)' }} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Bottom Navigation Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center z-40">
        <div className="w-full max-w-[420px] px-4 pb-4">
          <div className="flex items-center justify-around py-3 rounded-2xl"
            style={{ background: 'var(--heart-surface)', boxShadow: '0 -2px 20px rgba(0,0,0,0.06)', border: '1px solid var(--heart-border-light)' }}>
            {[
              { key: 'home' as const, icon: Home, label: 'Home' },
              { key: 'activity' as const, icon: MapPin, label: 'Activity' },
              { key: 'notifications' as const, icon: Bell, label: 'Alerts' },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex flex-col items-center gap-0.5 px-4">
                  <Icon className="h-5 w-5" style={{ color: active ? '#e74c5a' : 'var(--heart-text-muted)' }} />
                  <span className="text-[10px] font-medium" style={{ color: active ? '#e74c5a' : 'var(--heart-text-muted)' }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable Metric Card ── */
function MetricCard({ icon, label, value, unit, bg, iconColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  bg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2 transition-transform hover:scale-[1.02]"
      style={{ background: bg }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: iconColor + '20' }}>
          <div style={{ color: iconColor }} className="[&>svg]:h-4 [&>svg]:w-4">{icon}</div>
        </div>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--heart-text-secondary)' }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black" style={{ color: 'var(--heart-text)' }}>{value}</span>
        {unit && <span className="text-xs" style={{ color: 'var(--heart-text-muted)' }}>{unit}</span>}
      </div>
    </div>
  );
}
