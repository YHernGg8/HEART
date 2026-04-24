/**
 * HEART Field Unit View — Clean Dispatch Dashboard
 * Light-mode split-pane with dispatch list + detail
 */

import { useState } from 'react';
import {
  Navigation, Clock, MapPin, Heart, Footprints,
  Phone, MessageSquare, CheckCircle2, AlertTriangle,
  Shield, TrendingDown, TrendingUp, Minus, ArrowRight,
} from 'lucide-react';
import { getMockDashboardPatients } from '../mock-data';
import { getRiskColor, getActionLabel, getActionEmoji, type DashboardPatient } from '../types';

const dispatchStatusStyles: Record<string, { bg: string; color: string; label: string }> = {
  pending:      { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
  en_route:     { bg: '#dbeafe', color: '#2563eb', label: 'En Route' },
  on_scene:     { bg: '#dcfce7', color: '#16a34a', label: 'On Scene' },
  transporting: { bg: '#ede9fe', color: '#7c3aed', label: 'Transporting' },
  completed:    { bg: '#f3f4f6', color: '#6b7280', label: 'Completed' },
};

export default function FieldUnitView() {
  const patients = getMockDashboardPatients();
  const dispatches = patients
    .filter(p => ['CALL_999', 'CLINIC_VISIT'].includes(p.lastDecision.action))
    .sort((a, b) => b.lastDecision.riskScore - a.lastDecision.riskScore);

  const [selectedId, setSelectedId] = useState<string | null>(dispatches[0]?.patientId || null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const selected = dispatches.find(p => p.patientId === selectedId);

  const updateStatus = (patientId: string, status: string) => {
    setStatuses(prev => ({ ...prev, [patientId]: status }));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)]">
      {/* Left: Dispatch List */}
      <div className="w-full lg:w-96 sidebar p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--heart-text)' }}>
            <Navigation className="h-4 w-4" style={{ color: '#f59e0b' }} />
            Active Dispatches ({dispatches.length})
          </h2>
        </div>

        {dispatches.map(patient => {
          const risk = getRiskColor(patient.lastDecision.riskScore);
          const status = statuses[patient.patientId] || 'pending';
          const isSelected = selectedId === patient.patientId;
          const statusStyle = dispatchStatusStyles[status];

          return (
            <button
              key={patient.patientId}
              onClick={() => setSelectedId(patient.patientId)}
              className={`w-full text-left patient-card risk-border-${risk} p-3 cursor-pointer`}
              style={{
                background: isSelected ? 'var(--heart-bg-alt)' : 'var(--heart-surface)',
                boxShadow: isSelected ? 'var(--heart-shadow-active)' : 'var(--heart-shadow)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`status-dot status-dot-${risk}`} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--heart-text)' }}>{patient.patientName}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                  {statusStyle.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{patient.location.address}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    background: risk === 'red' ? '#fee2e2' : '#ffedd5',
                    color: risk === 'red' ? '#dc2626' : '#ea580c',
                  }}
                >
                  {getActionEmoji(patient.lastDecision.action)} {patient.lastDecision.action.replace('_', ' ')}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>
                  Score: {patient.lastDecision.riskScore}/10
                </span>
              </div>
            </button>
          );
        })}

        {dispatches.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--heart-text-muted)' }}>
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No active dispatches</p>
          </div>
        )}
      </div>

      {/* Right: Detail Panel */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[calc(100vh-3.5rem)]" style={{ background: 'var(--heart-bg)' }}>
        {selected ? (
          <DispatchDetail
            patient={selected}
            status={statuses[selected.patientId] || 'pending'}
            onStatusChange={(s) => updateStatus(selected.patientId, s)}
          />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--heart-text-muted)' }}>
            <p>Select a dispatch to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DispatchDetail({ patient, status, onStatusChange }: {
  patient: DashboardPatient;
  status: string;
  onStatusChange: (s: string) => void;
}) {
  const decision = patient.lastDecision;
  const risk = getRiskColor(decision.riskScore);
  const actionLabel = getActionLabel(decision.action);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--heart-text)' }}>{patient.patientName}</h2>
            <p className="text-xs" style={{ color: 'var(--heart-text-muted)' }}>
              {patient.age} years old • {patient.location.address}
            </p>
          </div>
          <div
            className={`risk-${risk}-strong px-3 py-1.5 rounded-xl text-xs font-bold`}
          >
            {getActionEmoji(decision.action)} {actionLabel.en}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {['pending', 'en_route', 'on_scene', 'transporting', 'completed'].map(s => {
            const style = dispatchStatusStyles[s];
            const isActive = status === s;
            return (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: isActive ? style.color : style.bg,
                  color: isActive ? 'white' : style.color,
                  border: `1px solid ${style.color}40`,
                }}
              >
                {isActive && <CheckCircle2 className="h-3 w-3" />}
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vitals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="metric-card metric-peach">
          <Heart className="h-5 w-5" style={{ color: '#e74c5a' }} />
          <div className="text-2xl font-bold">{patient.keyMetrics.avgHeartRate}</div>
          <span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>bpm</span>
        </div>
        <div className="metric-card metric-sky">
          <Footprints className="h-5 w-5" style={{ color: '#3b82f6' }} />
          <div className="text-2xl font-bold">{patient.keyMetrics.avgSteps.toLocaleString()}</div>
          <span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>steps</span>
        </div>
        <div className="metric-card metric-amber">
          <Clock className="h-5 w-5" style={{ color: '#f59e0b' }} />
          <div className="text-2xl font-bold">{patient.keyMetrics.checkInResponse}%</div>
          <span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>check-in</span>
        </div>
      </div>

      {/* AI Clinical Brief */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--heart-text-muted)' }}>
          <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /> Critical Brief (EN)
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--heart-text)' }}>{decision.reasoning.en}</p>
      </div>

      <div className="card p-4">
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--heart-text-muted)' }}>
          <Shield className="h-3.5 w-3.5" style={{ color: '#8b5cf6' }} /> Taklimat Kritikal (BM)
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--heart-text)' }}>{decision.reasoning.ms}</p>
      </div>

      {/* Action Plan */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--heart-text-muted)' }}>
          <ArrowRight className="h-3.5 w-3.5" style={{ color: '#3b82f6' }} /> Action Plan
        </h3>
        <p className="text-sm" style={{ color: 'var(--heart-text-secondary)' }}>{decision.actionPlan.en}</p>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--heart-text-secondary)' }}>
        {patient.riskTrend === 'declining' && <><TrendingDown className="h-3.5 w-3.5" style={{ color: '#ef4444' }} /> Trend: Declining</>}
        {patient.riskTrend === 'improving' && <><TrendingUp className="h-3.5 w-3.5" style={{ color: '#10b981' }} /> Trend: Improving</>}
        {patient.riskTrend === 'stable' && <><Minus className="h-3.5 w-3.5" /> Trend: Stable</>}
        {patient.riskTrend === 'critical' && <><TrendingDown className="h-3.5 w-3.5" style={{ color: '#dc2626' }} /> Trend: Critical</>}
        <span>• Confidence: {decision.confidencePercent}%</span>
      </div>

      {/* WhatsApp + Emergency */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(patient.whatsappDeepLinks).map(([idx, link]) => (
          <a key={idx} href={link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}
          >
            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp #{parseInt(idx) + 1}
          </a>
        ))}
        {decision.action === 'CALL_999' && (
          <a href="tel:999" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold"
            style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
          >
            <Phone className="h-3.5 w-3.5" /> Call 999 Now
          </a>
        )}
      </div>
    </div>
  );
}
