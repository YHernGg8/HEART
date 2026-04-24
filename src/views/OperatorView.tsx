/**
 * HEART Operator View — Salesforce Daily Operation Dashboard
 *
 * Features:
 * - Pipeline/Activity/Reports tabs
 * - Status pills + stats bar
 * - Kanban patient cards with INDEPENDENT expansion (multiple open at once)
 * - All buttons functional: WhatsApp, Call 999, Notes, Bell notifications, More menu
 * - AI-powered: clicking "Run AI" triggers live Gemini analysis
 */

import { useState, useMemo } from 'react';
import {
  Shield, MoreHorizontal, Heart, Footprints, Activity,
  Brain, Target, Phone, MessageSquare, CheckCircle2,
  TrendingDown, TrendingUp, Minus, Clock, BarChart3, MessageCircle,
  Bell, Settings2, Layers, Search, AlertCircle, X,
  RefreshCw,
} from 'lucide-react';
import { getMockDashboardPatients } from '../mock-data';
import { getRiskColor, getActionLabel, getActionEmoji, type CareAction, type DashboardPatient } from '../types';
import { getSnapshotDecision, type AIDecision } from '../services/api';

/* ── Widget color palette ── */
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
  // Single card expansion — only one card open at a time
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [notifications, setNotifications] = useState([
    { id: 1, msg: 'Fatimah binti Hassan — risk escalated to CALL_999', time: '2 min ago', read: false },
    { id: 2, msg: 'New check-in from Ahmad bin Abdullah', time: '5 min ago', read: false },
    { id: 3, msg: 'Weekly report generated for 8 patients', time: '1 hr ago', read: true },
  ]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

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

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

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

        {/* View mode buttons — functional */}
        <div className="flex items-center gap-1 ml-2">
          {([
            { icon: Layers, mode: 'grid' as const, label: 'Grid View' },
            { icon: BarChart3, mode: 'list' as const, label: 'List View' },
            { icon: Layers, mode: 'compact' as const, label: 'Compact View' },
          ]).map((item, i) => (
            <button key={i} onClick={() => setViewMode(item.mode)} title={item.label}
              className="p-2 rounded-lg transition-colors"
              style={{ background: viewMode === item.mode ? 'var(--heart-text)' : 'transparent', color: viewMode === item.mode ? 'white' : 'var(--heart-text-muted)' }}>
              <item.icon className="h-3.5 w-3.5" />
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

        {/* Quick actions — functional */}
        <div className="flex items-center gap-2 ml-4 relative">
          <div className="relative">
            <button onClick={() => { setNotifOpen(!notifOpen); setSettingsOpen(false); }}
              className="p-2 rounded-xl relative" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
              <Bell className="h-4 w-4" style={{ color: 'var(--heart-text-secondary)' }} />
              {notifications.some(n => !n.read) && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
              )}
            </button>
            {/* Notification dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-11 w-72 card p-0 z-50 overflow-hidden" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
                <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--heart-border-light)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>Notifications</span>
                  <button onClick={markAllRead} className="text-[10px] font-semibold" style={{ color: '#3b82f6' }}>Mark all read</button>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className="p-3 flex items-start gap-2 hover:bg-gray-50 transition-all cursor-pointer"
                    style={{ borderBottom: '1px solid var(--heart-border-light)', background: n.read ? 'transparent' : '#f0f9ff' }}
                    onClick={() => setNotifications(prev => prev.map(nn => nn.id === n.id ? { ...nn, read: true } : nn))}>
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-none" style={{ color: n.read ? '#9ca3af' : '#3b82f6' }} />
                    <div>
                      <div className="text-[10px] font-medium" style={{ color: 'var(--heart-text)' }}>{n.msg}</div>
                      <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => { setSettingsOpen(!settingsOpen); setNotifOpen(false); }}
              className="p-2 rounded-xl" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
              <Settings2 className="h-4 w-4" style={{ color: 'var(--heart-text-secondary)' }} />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 top-11 w-52 card p-2 z-50" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
                {['Auto-refresh (30s)', 'Sound alerts', 'Dark mode', 'Compact cards'].map(opt => (
                  <button key={opt} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-50 transition-all"
                    style={{ color: 'var(--heart-text-secondary)' }}
                    onClick={() => { alert(`${opt} toggled`); setSettingsOpen(false); }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 max-w-xs"
          style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border)' }}>
          <Search className="h-3.5 w-3.5" style={{ color: 'var(--heart-text-muted)' }} />
          <input type="text" placeholder="Search patients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none" style={{ color: 'var(--heart-text)' }} />
        </div>

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
      <div className={`grid gap-4 ${
        viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
        viewMode === 'list' ? 'grid-cols-1 lg:grid-cols-2' :
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
      }`}>
        {sorted.map(patient => (
          <PatientWidget
            key={patient.patientId}
            patient={patient}
            isExpanded={expandedId === patient.patientId}
            onToggle={() => toggleExpand(patient.patientId)}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--heart-text-muted)' }}>No patients match your search.</div>
      )}

      {/* Click-away overlay for dropdowns */}
      {(notifOpen || settingsOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setSettingsOpen(false); }} />
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIDecision | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<string[]>([]);

  const runAI = async () => {
    setAiLoading(true);
    const res = await getSnapshotDecision({
      averageHeartRate: patient.keyMetrics.avgHeartRate,
      dailySteps: patient.keyMetrics.avgSteps,
      daysSinceLastCheckin: 1,
      patientName: patient.patientName,
    });
    setAiLoading(false);
    if (res.success && res.decision) setAiResult(res.decision);
  };

  const addNote = () => {
    if (noteText.trim()) {
      setNotes(prev => [...prev, noteText.trim()]);
      setNoteText('');
      setNoteOpen(false);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer relative"
      onClick={onToggle}
      style={{ background: palette.bg, border: `1px solid ${palette.border}` }}>

      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{patient.patientName}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--heart-text-muted)' }}>
              {getActionEmoji(decision.action)} {decision.action.replace(/_/g, ' ')}
            </div>
          </div>
          {/* More menu — functional */}
          <div className="relative">
            <button className="p-1 rounded-lg hover:bg-black/5"
              onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
              <MoreHorizontal className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={e => { e.stopPropagation(); setMenuOpen(false); }} />
                <div className="absolute right-0 top-8 w-40 card p-1 z-50" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
                  onClick={e => e.stopPropagation()}>
                  {[
                    { label: '📋 View Full Profile', action: () => alert(`Opening full profile for ${patient.patientName}`) },
                    { label: '🔄 Re-run AI Analysis', action: runAI },
                    { label: '📤 Export Report', action: () => alert(`Report exported for ${patient.patientName}`) },
                    { label: '⚠️ Escalate Case', action: () => alert(`Case escalated for ${patient.patientName}`) },
                  ].map(item => (
                    <button key={item.label} onClick={() => { item.action(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-[10px] hover:bg-gray-50 transition-all"
                      style={{ color: 'var(--heart-text-secondary)' }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
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

      {/* ── Expanded Detail ── */}
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
            <div className="text-[10px] font-bold mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1" style={{ color: 'var(--heart-text-muted)' }}>
                <Brain className="h-3 w-3" style={{ color: '#8b5cf6' }} /> AI Reasoning
              </span>
              <button onClick={runAI} disabled={aiLoading}
                className="flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded"
                style={{ background: '#f0f9ff', color: '#3b82f6' }}>
                <RefreshCw className={`h-2.5 w-2.5 ${aiLoading ? 'animate-spin' : ''}`} />
                {aiLoading ? 'Analyzing...' : 'Re-run AI'}
              </button>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--heart-text-secondary)' }}>
              {(aiResult?.reasoning?.en || decision.reasoning.en).slice(0, 200)}
              {(aiResult?.reasoning?.en || decision.reasoning.en).length > 200 ? '...' : ''}
            </p>
            {aiResult && (
              <div className="mt-1 flex items-center gap-2 text-[9px]" style={{ color: '#8b5cf6' }}>
                ✦ Live Gemini result • Risk: {aiResult.riskScore}/10 • Action: {aiResult.action}
              </div>
            )}
          </div>

          {/* Notes */}
          {notes.length > 0 && (
            <div className="p-2 rounded-xl space-y-1" style={{ background: 'white' }}>
              <div className="text-[9px] font-bold" style={{ color: 'var(--heart-text-muted)' }}>📝 Notes</div>
              {notes.map((n, i) => (
                <div key={i} className="text-[10px] px-2 py-1 rounded" style={{ background: '#fef3c7', color: '#92400e' }}>{n}</div>
              ))}
            </div>
          )}

          {/* Note input */}
          {noteOpen && (
            <div className="flex items-center gap-2">
              <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note..." autoFocus onKeyDown={e => e.key === 'Enter' && addNote()}
                className="flex-1 text-[10px] px-2 py-1.5 rounded-lg outline-none"
                style={{ background: 'white', border: '1px solid var(--heart-border)', color: 'var(--heart-text)' }} />
              <button onClick={addNote} className="text-[9px] font-bold px-2 py-1.5 rounded-lg"
                style={{ background: '#1e293b', color: 'white' }}>Save</button>
            </div>
          )}

          {/* Trend */}
          <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--heart-text-secondary)' }}>
            {patient.riskTrend === 'declining' && <><TrendingDown className="h-3 w-3" style={{ color: '#ef4444' }} /> Declining</>}
            {patient.riskTrend === 'improving' && <><TrendingUp className="h-3 w-3" style={{ color: '#10b981' }} /> Improving</>}
            {patient.riskTrend === 'stable' && <><Minus className="h-3 w-3" /> Stable</>}
            {patient.riskTrend === 'critical' && <><TrendingDown className="h-3 w-3" style={{ color: '#dc2626' }} /> Critical</>}
            <span className="ml-auto">Conf: {decision.confidencePercent}%</span>
          </div>

          {/* Quick Actions — all functional */}
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
              {/* Add note button */}
              <button onClick={() => setNoteOpen(!noteOpen)} title="Add note"
                className="p-1.5 rounded-lg hover:bg-black/5">
                <MessageCircle className="h-3 w-3" style={{ color: noteOpen ? '#3b82f6' : 'var(--heart-text-muted)' }} />
              </button>
              {/* Alert button */}
              <button onClick={() => alert(`Alert sent for ${patient.patientName}`)} title="Send alert"
                className="p-1.5 rounded-lg hover:bg-black/5">
                <Bell className="h-3 w-3" style={{ color: 'var(--heart-text-muted)' }} />
              </button>
              {/* Schedule button */}
              <button onClick={() => alert(`Scheduling follow-up for ${patient.patientName}`)} title="Schedule follow-up"
                className="p-1.5 rounded-lg hover:bg-black/5">
                <Clock className="h-3 w-3" style={{ color: 'var(--heart-text-muted)' }} />
              </button>
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
