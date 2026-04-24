/**
 * HEART Hospital View — Sidebar + Detail (Analytical)
 * Inspired by clinical EMR dashboard (Image 3)
 * Left sidebar patient list + main pane with charts and analytics
 */

import { useState, useMemo } from 'react';
import {
  Heart, Activity, BarChart3, Search, Footprints, Clock,
  Brain, Shield, TrendingDown, TrendingUp, Minus,
  FileText, Target, Globe, BedDouble,
} from 'lucide-react';
import { getMockDashboardPatients, getMockCohortSummary } from '../mock-data';
import { getRiskColor, getActionLabel, getActionEmoji, type DashboardPatient } from '../types';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';

export default function HospitalView() {
  const patients = getMockDashboardPatients();
  const cohort = getMockCohortSummary();
  const sorted = useMemo(
    () => [...patients].sort((a, b) => b.lastDecision.riskScore - a.lastDecision.riskScore),
    [patients]
  );

  const [selectedId, setSelectedId] = useState(sorted[0]?.patientId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'en' | 'ms'>('en');

  const filtered = searchQuery
    ? sorted.filter(p => p.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
    : sorted;

  const selected = patients.find(p => p.patientId === selectedId);

  const riskColorMap: Record<string, string> = { green: '#10b981', yellow: '#f59e0b', orange: '#f97316', red: '#ef4444' };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Left Sidebar — Patient List + Cohort */}
      <div className="sidebar w-[280px] flex-none flex flex-col">
        {/* Cohort Stats */}
        <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--heart-border-light)' }}>
          <h2 className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--heart-text)' }}>
            <BedDouble className="h-4 w-4" style={{ color: '#8b5cf6' }} />
            Cohort Overview
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total', value: cohort.cohortSize, color: '#6b7280' },
              { label: 'Critical', value: cohort.riskDistribution.critical, color: '#dc2626' },
              { label: 'High', value: cohort.riskDistribution.high, color: '#f97316' },
              { label: 'Avg Risk', value: cohort.averageRiskScore, color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} className="p-2 rounded-lg text-center" style={{ background: 'var(--heart-bg)' }}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--heart-border-light)' }}>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--heart-bg)' }}>
            <Search className="h-3.5 w-3.5" style={{ color: 'var(--heart-text-muted)' }} />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: 'var(--heart-text)' }}
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map(patient => {
            const risk = getRiskColor(patient.lastDecision.riskScore);
            const isSelected = selectedId === patient.patientId;
            return (
              <button
                key={patient.patientId}
                onClick={() => setSelectedId(patient.patientId)}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer"
                style={{
                  background: isSelected ? 'var(--heart-bg-alt)' : 'transparent',
                  borderLeft: isSelected ? `3px solid ${riskColorMap[risk]}` : '3px solid transparent',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className={`status-dot status-dot-${risk}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: 'var(--heart-text)' }}>{patient.patientName}</div>
                    <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>
                      {getActionEmoji(patient.lastDecision.action)} {patient.lastDecision.action.replace('_', ' ')} • Score: {patient.lastDecision.riskScore}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[calc(100vh-3.5rem)]" style={{ background: 'var(--heart-bg)' }}>
        {selected ? (
          <PatientAnalytics patient={selected} lang={lang} onLangToggle={() => setLang(l => l === 'en' ? 'ms' : 'en')} />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--heart-text-muted)' }}>
            Select a patient from the sidebar
          </div>
        )}
      </div>
    </div>
  );
}

function PatientAnalytics({ patient, lang, onLangToggle }: {
  patient: DashboardPatient;
  lang: 'en' | 'ms';
  onLangToggle: () => void;
}) {
  const decision = patient.lastDecision;
  const risk = getRiskColor(decision.riskScore);
  const actionLabel = getActionLabel(decision.action);
  const riskColorMap: Record<string, string> = { green: '#10b981', yellow: '#f59e0b', orange: '#f97316', red: '#ef4444' };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Patient Info Card */}
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--heart-text)' }}>{patient.patientName}</h2>
            <p className="text-xs" style={{ color: 'var(--heart-text-muted)' }}>
              {patient.age} years • {patient.gender === 'M' ? 'Male' : 'Female'} • {patient.location.address}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={onLangToggle}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
              style={{ background: 'var(--heart-bg)', color: 'var(--heart-text-secondary)', border: '1px solid var(--heart-border)' }}
            >
              <Globe className="h-3 w-3" />
              {lang === 'en' ? 'EN' : 'BM'}
            </button>
            <div className={`risk-${risk}-strong px-3 py-1.5 rounded-xl text-xs font-bold`}>
              {getActionEmoji(decision.action)} {actionLabel[lang]}
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { icon: Heart, label: 'Heart Rate', value: `${patient.keyMetrics.avgHeartRate}`, unit: 'bpm', color: '#e74c5a', bg: '#fde8e8' },
            { icon: Footprints, label: 'Steps', value: patient.keyMetrics.avgSteps.toLocaleString(), unit: 'daily', color: '#3b82f6', bg: '#e8f0fd' },
            { icon: Activity, label: 'Check-in', value: `${patient.keyMetrics.checkInResponse}%`, unit: 'rate', color: '#10b981', bg: '#e8f5ec' },
            { icon: Shield, label: 'Confidence', value: `${decision.confidencePercent}%`, unit: 'AI', color: '#8b5cf6', bg: '#f0e8fd' },
          ].map(m => (
            <div key={m.label} className="p-3 rounded-xl flex items-center gap-3" style={{ background: m.bg }}>
              <m.icon className="h-5 w-5 flex-none" style={{ color: m.color }} />
              <div>
                <div className="text-lg font-bold" style={{ color: 'var(--heart-text)' }}>{m.value}</div>
                <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend + Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Heart Rate Chart */}
        <div className="chart-container">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--heart-text-muted)' }}>
            <Heart className="h-3.5 w-3.5" style={{ color: '#e74c5a' }} /> Heart Rate Trend (7-day)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" data={patient.telemetryBaseline} dataKey="heartRate" name="Baseline" stroke="#a5b4fc" strokeWidth={2} dot={false} />
              <Line type="monotone" data={patient.telemetryCurrent} dataKey="heartRate" name="Current" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Steps Chart */}
        <div className="chart-container">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--heart-text-muted)' }}>
            <Footprints className="h-3.5 w-3.5" style={{ color: '#3b82f6' }} /> Step Count Trend (7-day)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" data={patient.telemetryBaseline} dataKey="steps" name="Baseline" stroke="#a5b4fc" fill="#e0e7ff" fillOpacity={0.4} strokeWidth={2} />
              <Area type="monotone" data={patient.telemetryCurrent} dataKey="steps" name="Current" stroke="#3b82f6" fill="#dbeafe" fillOpacity={0.4} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Analysis + AI Reasoning */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Risk Factor Breakdown */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--heart-text-muted)' }}>
            <Target className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /> Risk Factor Analysis
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Cardiovascular', value: decision.riskFactors.cardiovascularRisk },
              { label: 'Mobility', value: decision.riskFactors.mobilityRisk },
              { label: 'Engagement', value: decision.riskFactors.engagementRisk },
              { label: 'Social', value: decision.riskFactors.socialRisk },
              { label: 'Combined', value: decision.riskFactors.combinedRiskScore },
            ].map(f => (
              <div key={f.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--heart-text-secondary)' }}>{f.label}</span>
                  <span className="text-xs font-bold" style={{
                    color: f.value > 7 ? '#ef4444' : f.value > 4 ? '#f59e0b' : '#10b981'
                  }}>{f.value}/10</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{
                    width: `${(f.value / 10) * 100}%`,
                    background: f.value > 7 ? '#ef4444' : f.value > 4 ? '#f59e0b' : '#10b981',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Trend */}
          <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: 'var(--heart-text-secondary)' }}>
            {patient.riskTrend === 'declining' && <><TrendingDown className="h-3.5 w-3.5" style={{ color: '#ef4444' }} /> Declining</>}
            {patient.riskTrend === 'improving' && <><TrendingUp className="h-3.5 w-3.5" style={{ color: '#10b981' }} /> Improving</>}
            {patient.riskTrend === 'stable' && <><Minus className="h-3.5 w-3.5" /> Stable</>}
            {patient.riskTrend === 'critical' && <><TrendingDown className="h-3.5 w-3.5" style={{ color: '#dc2626' }} /> Critical</>}
            <span>({patient.riskPercentChange > 0 ? '+' : ''}{patient.riskPercentChange}%)</span>
          </div>
        </div>

        {/* AI Clinical Reasoning */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--heart-text-muted)' }}>
            <Brain className="h-3.5 w-3.5" style={{ color: '#8b5cf6' }} />
            Clinical Reasoning ({lang === 'en' ? 'English' : 'Bahasa Malaysia'})
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--heart-text)' }}>
            {decision.reasoning[lang]}
          </p>

          <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--heart-text-muted)' }}>
            {lang === 'en' ? 'Action Plan' : 'Pelan Tindakan'}
          </h4>
          <p className="text-xs" style={{ color: 'var(--heart-text-secondary)' }}>{decision.actionPlan[lang]}</p>

          <h4 className="text-xs font-semibold mt-3 mb-1" style={{ color: 'var(--heart-text-muted)' }}>
            {lang === 'en' ? 'Prognosis' : 'Prognosis'}
          </h4>
          <p className="text-xs" style={{ color: 'var(--heart-text-secondary)' }}>{decision.estimatedOutcome[lang]}</p>
        </div>
      </div>

      {/* Referenced Guidelines */}
      {decision.referencedGuidelines.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--heart-text-muted)' }}>
            <FileText className="h-3.5 w-3.5" style={{ color: '#0284c7' }} /> Referenced Medical Guidelines
          </h3>
          <div className="flex flex-wrap gap-2">
            {decision.referencedGuidelines.map(g => (
              <span key={g} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                {g}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
