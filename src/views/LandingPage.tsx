/**
 * HEART Landing Page — Cinematic, judge-wowing experience
 * Dark theme, animated heartbeat, glassmorphism portals, scroll animations
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, User, Radio, Stethoscope, Truck, Hospital,
  Zap, Shield, Activity, Brain, ChevronRight,
  Watch, TrendingDown, Bell, ArrowRight, Sparkles, Globe
} from 'lucide-react';
import { demoSignIn } from '../components/LoginGate';
import './LandingPage.css';

/* ── Role portal data ── */
const roles = [
  {
    key: 'patient', path: '/user', label: 'Patient / Family', icon: User,
    accent: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)',
    desc: 'Monitor health vitals, AI check-ins, and family alerts.',
    features: ['Health Dashboard', 'AI Triage', 'WhatsApp Alerts'],
  },
  {
    key: 'operator', path: '/operator', label: 'Operator (999)', icon: Radio,
    accent: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    desc: '999 dispatch, emergency triage, and AI hospital allocation.',
    features: ['999 Call Log', 'AI Dispatch', 'Hospital Routing'],
  },
  {
    key: 'doctor', path: '/doctor', label: 'Doctor', icon: Stethoscope,
    accent: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    desc: 'Patient management, clinical reports, and care agreements.',
    features: ['Patient Records', 'Full Reports', 'Agreements'],
  },
  {
    key: 'field', path: '/field', label: 'Field Unit', icon: Truck,
    accent: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    desc: 'Mobile EMHR unit management with live vitals and triage.',
    features: ['Live Vitals', 'On-Board Patients', 'AI Triage'],
  },
  {
    key: 'admin', path: '/hospital', label: 'Hospital Admin', icon: Hospital,
    accent: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    desc: 'Bed allocation, ward management, and ED patient routing.',
    features: ['Ward Beds', 'ED Dispatch', 'Resource Mgmt'],
  },
];

/* ── Pipeline steps ── */
const pipelineSteps = [
  { icon: Watch, label: 'Wearable Data', desc: 'Heart rate, steps, check-ins from smartwatch', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { icon: Activity, label: 'Analytics Engine', desc: 'Trend detection, anomaly scoring, velocity', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { icon: Brain, label: 'AI Decision Flow', desc: 'Gemini + RAG grounded in clinical guidelines', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { icon: Bell, label: 'Autonomous Action', desc: 'MONITOR → FAMILY → CLINIC → CALL 999', color: '#e74c5a', bg: 'rgba(231,76,90,0.12)' },
];

/* ── ECG SVG path ── */
const ECG_PATH = "M0,40 L30,40 L35,40 L40,20 L45,60 L50,10 L55,50 L60,35 L65,40 L100,40 L130,40 L135,40 L140,20 L145,60 L150,10 L155,50 L160,35 L165,40 L200,40";

export default function LandingPage() {
  const navigate = useNavigate();
  const observerRef = useRef<IntersectionObserver | null>(null);

  /* Scroll-triggered fade-in */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.fade-in-up').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const handleDemo = () => {
    demoSignIn();
    navigate('/operator');
  };

  const scrollToPortals = () => {
    document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-root">
      {/* Ambient background */}
      <div className="landing-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="landing-noise" />

      <div className="landing-content">
        {/* ═══ HERO ═══ */}
        <section className="hero-section">
          <div className="hero-badge" style={{ animationDelay: '0s' }}>
            <span className="dot" />
            Project 2030: MyAI Future — Track 3 (Vital Signs)
          </div>

          {/* Heartbeat animation */}
          <div className="hero-heartbeat">
            <div className="ring" />
            <div className="ring" />
            <div className="ring" />
            <div className="icon-wrap">
              <Heart size={36} color="white" fill="white" />
            </div>
          </div>

          <h1 className="hero-title" style={{ animation: 'fadeSlideUp 0.8s ease-out 0.2s both' }}>
            <span className="accent">H</span>omecare &{' '}
            <span className="accent">E</span>mergency<br />
            <span className="accent">A</span>I{' '}
            <span className="accent">R</span>outing{' '}
            <span className="accent">T</span>echnology
          </h1>

          <p className="hero-subtitle" style={{ animation: 'fadeSlideUp 0.8s ease-out 0.4s both' }}>
            An autonomous care decision engine that detects gradual decline in elderly patients —
            delivering definitive actions before emergencies happen.
          </p>

          <div className="hero-cta" style={{ animation: 'fadeSlideUp 0.8s ease-out 0.6s both' }}>
            <button className="cta-primary" onClick={handleDemo}>
              <Zap size={18} /> Launch Demo
            </button>
            <button className="cta-secondary" onClick={scrollToPortals}>
              Explore Portals <ChevronRight size={16} />
            </button>
          </div>

          {/* ECG line */}
          <div className="ecg-line">
            <svg viewBox="0 0 200 80" preserveAspectRatio="none">
              <path d={ECG_PATH} fill="none" stroke="#e74c5a" strokeWidth="2" />
            </svg>
          </div>

          {/* Scroll indicator */}
          <div className="scroll-indicator">
            <div className="mouse" />
            <span>Scroll</span>
          </div>
        </section>

        {/* ═══ PROBLEM / SOLUTION ═══ */}
        <section className="problem-section">
          <div className="fade-in-up">
            <div className="section-label">
              <TrendingDown size={14} /> The Problem
            </div>
            <h2 className="section-title">
              Emergency rooms are overwhelmed<br />because we react too late.
            </h2>
            <p className="section-desc">
              Current elderly monitoring only catches acute spikes. But 70% of preventable emergencies
              show gradual decline patterns days before the crisis. HEART changes this.
            </p>
          </div>

          <div className="problem-grid stagger-children">
            <div className="problem-card fade-in-up">
              <div className="card-icon" style={{ background: 'rgba(231,76,90,0.12)' }}>
                <Activity size={24} color="#e74c5a" />
              </div>
              <h3>Trend Analysis</h3>
              <p>Walking 30% less over 5 days? That's a signal. HEART detects gradual mobility decline, not just sudden spikes.</p>
            </div>
            <div className="problem-card fade-in-up">
              <div className="card-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <Brain size={24} color="#3b82f6" />
              </div>
              <h3>Multi-Factor Risk</h3>
              <p>Combines heart rate, mobility, responsiveness, and check-in history into a single weighted risk score.</p>
            </div>
            <div className="problem-card fade-in-up">
              <div className="card-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <Shield size={24} color="#10b981" />
              </div>
              <h3>Autonomous Decisions</h3>
              <p>From MONITOR → FAMILY_CHECK → CLINIC_VISIT → CALL_999. No manual intervention needed.</p>
            </div>
            <div className="problem-card fade-in-up">
              <div className="card-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>
                <Globe size={24} color="#8b5cf6" />
              </div>
              <h3>Multilingual by Default</h3>
              <p>English for clinicians, Bahasa Malaysia for families. WhatsApp integration — no app downloads required.</p>
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="flow-section">
          <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>
              <Sparkles size={14} /> How It Works
            </div>
            <h2 className="section-title" style={{ maxWidth: '700px', margin: '0 auto 1rem' }}>
              From wearable data to<br />life-saving decisions
            </h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Four intelligent stages process raw sensor data into autonomous clinical actions — grounded in medical guidelines via RAG.
            </p>
          </div>

          <div className="flow-pipeline stagger-children">
            {pipelineSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flow-step fade-in-up">
                  <div className="step-num" style={{ color: step.color }}>Step {i + 1}</div>
                  <div className="step-icon" style={{ background: step.bg }}>
                    <Icon size={26} color={step.color} />
                  </div>
                  <h4>{step.label}</h4>
                  <p>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="stats-section">
          <div className="stats-grid stagger-children">
            {[
              { value: '4', label: 'Decision Levels', color: '#e74c5a' },
              { value: '2', label: 'Languages', color: '#3b82f6' },
              { value: '5', label: 'Role Portals', color: '#10b981' },
              { value: '24/7', label: 'Monitoring', color: '#8b5cf6' },
            ].map((s, i) => (
              <div key={i} className="stat-item fade-in-up">
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ PORTALS ═══ */}
        <section className="portals-section" id="portals">
          <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>
              <Shield size={14} /> Clinical Portals
            </div>
            <h2 className="section-title" style={{ maxWidth: '600px', margin: '0 auto 1rem' }}>
              One system, five perspectives
            </h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Every stakeholder in the care chain gets a purpose-built interface powered by the same AI engine.
            </p>
          </div>

          <div className="portals-grid stagger-children">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <button key={role.key} className="portal-card fade-in-up" onClick={() => navigate(role.path)}
                  style={{ '--portal-accent': role.accent } as React.CSSProperties}>
                  <div style={{
                    content: "''", position: 'absolute', inset: 0, borderRadius: 20,
                    background: `radial-gradient(circle at top left, ${role.accent}15, transparent 60%)`,
                    pointerEvents: 'none',
                  }} />
                  <div className="portal-icon" style={{ background: role.gradient }}>
                    <Icon size={22} color="white" />
                  </div>
                  <h3>{role.label}</h3>
                  <p className="portal-desc">{role.desc}</p>
                  <div className="portal-features">
                    {role.features.map((f) => (
                      <span key={f} className="feature-tag"
                        style={{ background: `${role.accent}18`, color: role.accent }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}

            {/* Demo Mode Card */}
            <button className="portal-card demo-card fade-in-up" onClick={handleDemo}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 20,
                background: 'radial-gradient(circle at top left, rgba(231,76,90,0.08), transparent 60%)',
                pointerEvents: 'none',
              }} />
              <div className="portal-icon" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
                <Zap size={22} color="white" />
              </div>
              <h3>Demo Mode</h3>
              <p className="portal-desc">Bypass all sign-in. Instantly access every portal for a full demonstration.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e74c5a', fontSize: '0.75rem', fontWeight: 700 }}>
                <Shield size={14} /> All portals unlocked
                <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
              </div>
            </button>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="landing-footer">
          <div className="footer-brand">
            <div className="brand-icon">
              <Heart size={16} color="white" fill="white" />
            </div>
            <span>HEART</span>
          </div>
          <p>
            National Hackathon: Project 2030 — MyAI Future Track 3 (Vital Signs)<br />
            <em style={{ opacity: 0.6 }}>Detecting gradual decline. Delivering definitive decisions. Preventing avoidable emergencies.</em><br />
            <span style={{ opacity: 0.4, marginTop: '0.5rem', display: 'inline-block' }}>Built with Google Antigravity 🚀 &nbsp;|&nbsp; © 2026 HEART Team</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
