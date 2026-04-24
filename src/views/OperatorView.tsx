/**
 * HEART Operator View — Salesforce Daily Operation Dashboard
 *
 * Inspired by Salesforce CRM kanban layout:
 * - Pipeline/Activity/Reports tabs
 * - Status pills + stats bar (Week's Cases, Pending, Active, Resolved)
 * - Kanban-style colored patient widgets with full overview
 * - Each widget: name, metrics bars, risk action, WhatsApp, assignee
 * - Pastel background colors per risk (pink, yellow, lilac, mint)
 */

import { useState, useMemo } from 'react';
import {
  Shield, MoreHorizontal, Heart, Footprints, Activity,
  Brain, Target, Phone, MessageSquare, CheckCircle2,
  TrendingDown, TrendingUp, Minus, Clock, BarChart3, MessageCircle,
  Bell, Settings2, Layers, ChevronDown, Search,
} from 'lucide-react';
import { getMockDashboardPatients } from '../mock-data';
import { getRiskColor, getActionLabel, getActionEmoji, type CareAction, type DashboardPatient } from '../types';

/* ── Widget color palette (Salesforce-like pastels) ── */
const widgetPalettes: Record<string, { bg: string; border: string; headerBg: string; dot: string }> = {
  green:  { bg: '#f0fdf4', border: '#d1fae5', headerBg: '#dcfce7', dot: '#10b981' },
  yellow: { bg: '#fefce8', border: '#fef08a', headerBg: '#fef9c3', dot: '#f59e0b' },
  orange: { bg: '#fff7ed', border: '#fed7aa', headerBg: '#ffedd5', dot: '#f97316' },
  red:    { bg: '#fdf2f8', border: '#fbcfe8', headerBg: '#fce7f3', dot: '#ec4899' },
};

/* ── Mock assigned staff ── */
const mockAssignees: Record<string, { name: string; initials: string; color: string }> = {
  pat_001: { name: 'Dr. Tan', initials: 'DT', color: '#3b82f6' },
  pat_002: { name: 'Nurse Siti', initials: 'NS', color: '#8b5cf6' },
  pat_003: { name: 'Dr. Lim', initials: 'DL', color: '#059669' },
  pat_004: { name: 'Dr. Ahmad', initials: 'DA', color: '#dc2626' },
  pat_005: { name: 'Nurse Mei', initials: 'NM', color: '#f59e0b' },
  pat_006: { name: 'Dr. Lim', initials: 'DL', color: '#059669' },
  pat_007: { name: 'Nurse Siti', initials: 'NS', color: '#8b5cf6' },
  pat_008: { name: 'Nurse Mei', initials: 'NM', color: '#f59e0b' },
};

type FilterType = 'ALL' | CareAction;
type ViewTab = 'Pipeline' | 'Activity' | 'Reports';

export default function OperatorView() {
  const patients = getMockDashboardPatients();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [activeTab, setActiveTab] = useState<ViewTab>('Pipeline');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(() => {
    let filtered = [...patients].sort((a, b) => b.lastDecision.riskScore - a.lastDecision.riskScore);
    if (filter !== 'ALL') filtered = filtered.filter(p => p.lastDecision.action === filter);
    if (searchQuery) filtered = filtered.filter(p => p.patientName.toLowerCase().includes(searchQuery.toLowerCase()));
    return filtered;
  }, [patients, filter, searchQuery]);

  const stats = {
    weeksCases: patients.length,
    pendingReview: patients.filter(p => ['FAMILY_CHECK', 'CLINIC_VISIT', 'CALL_999'].includes(p.lastDecision.action)).length,
    activePatients: patients.filter(p => p.lastDecision.action !== 'MONITOR').length,
    resolved: patients.filter(p => p.lastDecision.action === 'MONITOR').length,
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-5 lg:p-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs mb-0.5" style={{ color: 'var(--heart-text-muted)' }}>Patient Schedule</div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--heart-text)' }}>Daily Operation</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
          {(['Pipeline', 'Activity', 'Reports'] as ViewTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab ? 'var(--heart-text)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--heart-text-secondary)',
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Status Pills + Stats ── */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Status pills */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: '#dcfce7', color: '#16a34a' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} /> Active
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: '#fee2e2', color: '#dc2626' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} /> Critical
          </span>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-1 ml-2">
          {[Layers, BarChart3, Layers].map((Icon, i) => (
            <button key={i} className="p-2 rounded-lg transition-colors"
              style={{ background: i === 0 ? 'var(--heart-text)' : 'transparent', color: i === 0 ? 'white' : 'var(--heart-text-muted)' }}>
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 ml-auto">
          {[
            { label: "Week's Cases", value: stats.weeksCases },
            { label: "Pending Review", value: stats.pendingReview },
            { label: "Active Patients", value: stats.activePatients },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{s.label}</div>
              <div className="text-2xl font-black" style={{ color: 'var(--heart-text)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 ml-4">
          <button className="p-2 rounded-xl" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
            <Bell className="h-4 w-4" style={{ color: 'var(--heart-text-secondary)' }} />
          </button>
          <button className="p-2 rounded-xl" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
            <Settings2 className="h-4 w-4" style={{ color: 'var(--heart-text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 max-w-xs"
          style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border)' }}>
          <Search className="h-3.5 w-3.5" style={{ color: 'var(--heart-text-muted)' }} />
          <input type="text" placeholder="Search patients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none" style={{ color: 'var(--heart-text)' }} />
        </div>

        {/* Filter pills */}
        {[
          { key: 'ALL' as FilterType, label: 'All', count: patients.length },
          { key: 'CALL_999' as FilterType, label: '🚨 Emergency', count: patients.filter(p => p.lastDecision.action === 'CALL_999').length },
          { key: 'CLINIC_VISIT' as FilterType, label: '🏥 Clinic', count: patients.filter(p => p.lastDecision.action === 'CLINIC_VISIT').length },
          { key: 'FAMILY_CHECK' as FilterType, label: '⚠️ Family', count: patients.filter(p => p.lastDecision.action === 'FAMILY_CHECK').length },
          { key: 'MONITOR' as FilterType, label: '✅ Monitor', count: patients.filter(p => p.lastDecision.action === 'MONITOR').length },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filter === f.key ? 'var(--heart-text)' : 'var(--heart-surface)',
              color: filter === f.key ? 'white' : 'var(--heart-text-secondary)',
              border: `1px solid ${filter === f.key ? 'var(--heart-text)' : 'var(--heart-border)'}`,
            }}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* ── Kanban Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {sorted.map(patient => (
          <PatientWidget
            key={patient.patientId}
            patient={patient}
            isExpanded={expandedId === patient.patientId}
            onToggle={() => setExpandedId(expandedId === patient.patientId ? null : patient.patientId)}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--heart-text-muted)' }}>No patients match your search.</div>
      )}
    </div>
  );
}

/* ── Patient Widget Card ── */
function PatientWidget({ patient, isExpanded, onToggle }: {
  patient: DashboardPatient;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const decision = patient.lastDecision;
  const risk = getRiskColor(decision.riskScore);
  const palette = widgetPalettes[risk];
  const assignee = mockAssignees[patient.patientId] || { name: 'Unassigned', initials: 'UA', color: '#9ca3af' };

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
      onClick={onToggle}
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
      }}>

      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{patient.patientName}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--heart-text-muted)' }}>
              {getActionEmoji(decision.action)} {decision.action.replace(/_/g, ' ')}
            </div>
          </div>
          <button className="p-1 rounded-lg hover:bg-black/5" onClick={e => { e.stopPropagation(); }}>
            <MoreHorizontal className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} />
          </button>
        </div>

        {/* Mini metric bars */}
        <div className="space-y-1.5 my-3">
          {[
            { label: 'CV', value: decision.riskFactors.cardiovascularRisk, color: '#ef4444' },
            { label: 'MOB', value: decision.riskFactors.mobilityRisk, color: '#3b82f6' },
            { label: 'ENG', value: decision.riskFactors.engagementRisk, color: '#f59e0b' },
          ].map(bar => (
            <div key={bar.label} className="flex items-center gap-2">
              <span className="text-[9px] w-7 font-medium" style={{ color: 'var(--heart-text-muted)' }}>{bar.label}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: '#00000010' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${(bar.value / 10) * 100}%`,
                  background: bar.value > 6 ? '#ef4444' : bar.value > 3 ? '#f59e0b' : '#10b981',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer — Assignee + Date */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: assignee.color }}>
            {assignee.initials}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--heart-text-secondary)' }}>{assignee.name}</span>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
        </span>
      </div>

      {/* ── Expanded Detail Overlay ── */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: `1px solid ${palette.border}` }} onClick={e => e.stopPropagation()}>
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <MiniMetric icon={<Heart className="h-3 w-3" />} label="HR" value={`${patient.keyMetrics.avgHeartRate}`} unit="bpm" />
            <MiniMetric icon={<Footprints className="h-3 w-3" />} label="Steps" value={`${patient.keyMetrics.avgSteps.toLocaleString()}`} unit="" />
            <MiniMetric icon={<Activity className="h-3 w-3" />} label="Check" value={`${patient.keyMetrics.checkInResponse}%`} unit="" />
          </div>

          {/* Risk Breakdown */}
          <div className="p-2.5 rounded-xl" style={{ background: 'white' }}>
            <div className="text-[10px] font-bold mb-1.5 flex items-center gap-1" style={{ color: 'var(--heart-text-muted)' }}>
              <Target className="h-3 w-3" /> Risk Breakdown
            </div>
            {[
              { label: 'Cardiovascular', value: decision.riskFactors.cardiovascularRisk },
              { label: 'Mobility', value: decision.riskFactors.mobilityRisk },
              { label: 'Engagement', value: decision.riskFactors.engagementRisk },
              { label: 'Social', value: decision.riskFactors.socialRisk },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] w-20" style={{ color: 'var(--heart-text-muted)' }}>{f.label}</span>
                <div className="flex-1 h-1 rounded-full" style={{ background: '#e5e7eb' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${(f.value / 10) * 100}%`,
                    background: f.value > 7 ? '#ef4444' : f.value > 4 ? '#f59e0b' : '#10b981',
                  }} />
                </div>
                <span className="text-[9px] w-5 text-right font-medium" style={{ color: 'var(--heart-text-secondary)' }}>{f.value}</span>
              </div>
            ))}
          </div>

          {/* AI Reasoning */}
          <div className="p-2.5 rounded-xl" style={{ background: 'white' }}>
            <div className="text-[10px] font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--heart-text-muted)' }}>
              <Brain className="h-3 w-3" style={{ color: '#8b5cf6' }} /> AI Reasoning
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--heart-text-secondary)' }}>
              {decision.reasoning.en.length > 200 ? decision.reasoning.en.slice(0, 200) + '...' : decision.reasoning.en}
            </p>
          </div>

          {/* Trend */}
          <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--heart-text-secondary)' }}>
            {patient.riskTrend === 'declining' && <><TrendingDown className="h-3 w-3" style={{ color: '#ef4444' }} /> Declining</>}
            {patient.riskTrend === 'improving' && <><TrendingUp className="h-3 w-3" style={{ color: '#10b981' }} /> Improving</>}
            {patient.riskTrend === 'stable' && <><Minus className="h-3 w-3" /> Stable</>}
            {patient.riskTrend === 'critical' && <><TrendingDown className="h-3 w-3" style={{ color: '#dc2626' }} /> Critical</>}
            <span className="ml-auto">Conf: {decision.confidencePercent}%</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-1">
            {Object.entries(patient.whatsappDeepLinks).slice(0, 1).map(([idx, link]) => (
              <a key={idx} href={link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg"
                style={{ background: '#dcfce7', color: '#16a34a' }} onClick={e => e.stopPropagation()}>
                <MessageSquare className="h-3 w-3" /> WhatsApp
              </a>
            ))}
            {decision.action === 'CALL_999' && (
              <a href="tel:999" className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
                style={{ background: '#fee2e2', color: '#dc2626' }} onClick={e => e.stopPropagation()}>
                <Phone className="h-3 w-3" /> 999
              </a>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg hover:bg-black/5"><MessageCircle className="h-3 w-3" style={{ color: 'var(--heart-text-muted)' }} /></button>
              <button className="p-1.5 rounded-lg hover:bg-black/5"><Bell className="h-3 w-3" style={{ color: 'var(--heart-text-muted)' }} /></button>
              <button className="p-1.5 rounded-lg hover:bg-black/5"><Clock className="h-3 w-3" style={{ color: 'var(--heart-text-muted)' }} /></button>
            </div>
          </div>

          {/* Referenced Guidelines */}
          {decision.referencedGuidelines.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {decision.referencedGuidelines.slice(0, 2).map(g => (
                <span key={g} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Mini Metric Tile ── */
function MiniMetric({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="p-2 rounded-xl text-center" style={{ background: 'white' }}>
      <div className="flex items-center justify-center gap-1 mb-0.5 [&>svg]:text-[var(--heart-text-muted)]">{icon}</div>
      <div className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>{value}</div>
      <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>{label}{unit ? ` ${unit}` : ''}</div>
    </div>
  );
}
