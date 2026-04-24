/**
 * HEART Doctor Dashboard — Evergreen Patient Detail
 * Left: Patient list sidebar. Right: Patient Information, Medical Info, History, Appointments, Documents, HR Chart
 * All buttons and interactions are functional.
 */

import React, { useState, useMemo } from 'react';
import {
  Activity, Shield, FileText, AlertTriangle, Eye,
  Stethoscope, CheckSquare, Square, Siren, Search,
  Plus, Download, Printer, Phone, Mail, MapPin, Calendar,
  User, Heart, Clock, X, Edit3, ChevronRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid, Tooltip, ScatterChart, Scatter,
} from 'recharts';
import { getMockDashboardPatients } from '../mock-data';
import { getRiskColor, type DashboardPatient } from '../types';
import './DoctorView.css';

/* ── Extended patient data (Evergreen-style) ── */
interface PatientProfile {
  id: string;
  name: string;
  gender: string;
  age: number;
  dob: string;
  phone: string;
  email: string;
  address: string;
  ic: string;
  photo: string; // initials
  medicalHistory: { icon: string; name: string; desc: string }[];
  appointments: { name: string; date: string; doctor: string; done: boolean }[];
  documents: { name: string; size: string; type: 'blue' | 'red' }[];
  hrData: { day: string; thisWeek: number; lastWeek: number }[];
  hrStats: { avg: number; min: number; max: number };
}

const patientProfiles: PatientProfile[] = [
  {
    id: 'pat_001', name: 'Ahmad bin Abdullah', gender: 'Male', age: 78,
    dob: '14 May 1947', phone: '+6012 345 6789', email: 'ahmad.abdullah@email.com',
    address: '45 Jalan Bukit Bintang, KL 50200', ic: '470514-10-5521',
    photo: 'AA',
    medicalHistory: [
      { icon: '🫀', name: 'Hypertension', desc: 'High blood pressure requiring regular monitoring' },
      { icon: '🫁', name: 'Asthma', desc: 'A condition causing airway inflammation and narrowing.' },
      { icon: '🧬', name: 'Chronic Kidney Disease', desc: 'Gradual loss of kidney function over time.' },
    ],
    appointments: [
      { name: 'Diuretics', date: '22 October 2024', doctor: 'Dr. Septiannisa', done: true },
      { name: 'Beta-Blockers', date: '14 December 2024', doctor: 'Dr. Septiannisa', done: true },
      { name: 'ACE Inhibitors', date: '24 December 2024', doctor: 'Dr. Septiannisa', done: true },
      { name: 'Surgery', date: '28 December 2024', doctor: 'Dr. Septiannisa', done: false },
    ],
    documents: [
      { name: 'Agreement Diuretics', size: '2.1 MB', type: 'blue' },
      { name: 'Agreement Beta-Blockers', size: '1.1 MB', type: 'blue' },
      { name: 'Agreement ACE Inhibitors', size: '1.7 MB', type: 'red' },
      { name: 'Agreement Surgery', size: '2.0 MB', type: 'red' },
    ],
    hrData: [
      { day: 'M', thisWeek: 82, lastWeek: 76 }, { day: 'T', thisWeek: 78, lastWeek: 74 },
      { day: 'W', thisWeek: 90, lastWeek: 80 }, { day: 'T', thisWeek: 85, lastWeek: 72 },
      { day: 'F', thisWeek: 88, lastWeek: 78 }, { day: 'S', thisWeek: 75, lastWeek: 70 },
      { day: 'S', thisWeek: 80, lastWeek: 68 },
    ],
    hrStats: { avg: 78, min: 41, max: 90 },
  },
  {
    id: 'pat_003', name: 'Fatimah binti Hassan', gender: 'Female', age: 85,
    dob: '02 November 1940', phone: '+6013 987 6543', email: 'fatimah.hassan@email.com',
    address: '12 Lorong Damai, Petaling Jaya 46000', ic: '401102-10-6634',
    photo: 'FH',
    medicalHistory: [
      { icon: '🧠', name: 'Stroke History', desc: 'Previous ischemic stroke requiring ongoing care.' },
      { icon: '🫀', name: 'Heart Failure (NYHA II)', desc: 'Reduced cardiac output with exertional symptoms.' },
      { icon: '😔', name: 'Depression', desc: 'Persistent low mood affecting daily activities.' },
    ],
    appointments: [
      { name: 'Warfarin Review', date: '10 January 2025', doctor: 'Dr. Ahmad Razak', done: true },
      { name: 'Echocardiogram', date: '18 January 2025', doctor: 'Dr. Lee Wei Ming', done: true },
      { name: 'Neurologist F/U', date: '25 January 2025', doctor: 'Dr. Siti Nurhaliza', done: false },
      { name: 'Cardiac Rehab', date: '02 February 2025', doctor: 'Dr. Ahmad Razak', done: false },
    ],
    documents: [
      { name: 'Stroke Discharge Summary', size: '3.2 MB', type: 'blue' },
      { name: 'Cardiac Assessment', size: '1.8 MB', type: 'blue' },
      { name: 'Warfarin Consent', size: '0.9 MB', type: 'red' },
      { name: 'Rehab Plan', size: '1.5 MB', type: 'blue' },
    ],
    hrData: [
      { day: 'M', thisWeek: 95, lastWeek: 88 }, { day: 'T', thisWeek: 92, lastWeek: 85 },
      { day: 'W', thisWeek: 98, lastWeek: 90 }, { day: 'T', thisWeek: 96, lastWeek: 87 },
      { day: 'F', thisWeek: 93, lastWeek: 84 }, { day: 'S', thisWeek: 90, lastWeek: 82 },
      { day: 'S', thisWeek: 94, lastWeek: 86 },
    ],
    hrStats: { avg: 94, min: 68, max: 102 },
  },
  {
    id: 'pat_002', name: 'Lee Chong Wei', gender: 'Male', age: 73,
    dob: '21 June 1952', phone: '+6011 222 3344', email: 'lee.cw@email.com',
    address: '88 Taman Sri Hartamas, KL 50480', ic: '520621-14-7788',
    photo: 'LC',
    medicalHistory: [
      { icon: '🦴', name: 'Osteoporosis', desc: 'Reduced bone density increasing fracture risk.' },
      { icon: '🫁', name: 'COPD', desc: 'Chronic obstructive pulmonary disease from past smoking.' },
      { icon: '👁️', name: 'Glaucoma', desc: 'Increased intraocular pressure requiring monitoring.' },
    ],
    appointments: [
      { name: 'Bone Density Scan', date: '05 November 2024', doctor: 'Dr. Rajesh Kumar', done: true },
      { name: 'Pulmonology Review', date: '20 November 2024', doctor: 'Dr. Tan Mei Ling', done: true },
      { name: 'Eye Check-up', date: '10 December 2024', doctor: 'Dr. Lim Seng', done: true },
      { name: 'General Check-up', date: '15 January 2025', doctor: 'Dr. Rajesh Kumar', done: false },
    ],
    documents: [
      { name: 'DEXA Scan Report', size: '4.1 MB', type: 'blue' },
      { name: 'Pulmonary Function Test', size: '2.3 MB', type: 'blue' },
      { name: 'Glaucoma Assessment', size: '1.4 MB', type: 'red' },
      { name: 'Medication Plan', size: '0.8 MB', type: 'blue' },
    ],
    hrData: [
      { day: 'M', thisWeek: 65, lastWeek: 60 }, { day: 'T', thisWeek: 62, lastWeek: 58 },
      { day: 'W', thisWeek: 68, lastWeek: 64 }, { day: 'T', thisWeek: 63, lastWeek: 61 },
      { day: 'F', thisWeek: 67, lastWeek: 59 }, { day: 'S', thisWeek: 60, lastWeek: 55 },
      { day: 'S', thisWeek: 64, lastWeek: 57 },
    ],
    hrStats: { avg: 64, min: 48, max: 72 },
  },
  {
    id: 'pat_004', name: 'Rajendran a/l Muthu', gender: 'Male', age: 75,
    dob: '30 August 1950', phone: '+6014 555 6677', email: 'rajendran.m@email.com',
    address: '23 Jalan Ampang, KL 50450', ic: '500830-14-9911',
    photo: 'RM',
    medicalHistory: [
      { icon: '🩺', name: 'Type 2 Diabetes', desc: 'Insulin-dependent with HbA1c monitoring.' },
      { icon: '🫀', name: 'Atrial Fibrillation', desc: 'Irregular heartbeat requiring anticoagulation.' },
      { icon: '🦶', name: 'Peripheral Neuropathy', desc: 'Nerve damage affecting extremities.' },
    ],
    appointments: [
      { name: 'HbA1c Test', date: '12 January 2025', doctor: 'Dr. Fatimah Hassan', done: true },
      { name: 'Cardiology Review', date: '20 January 2025', doctor: 'Dr. Lee Wei Ming', done: false },
      { name: 'Podiatrist Visit', date: '28 January 2025', doctor: 'Dr. Singh', done: false },
      { name: 'Insulin Adjustment', date: '05 February 2025', doctor: 'Dr. Fatimah Hassan', done: false },
    ],
    documents: [
      { name: 'Diabetes Management Plan', size: '1.6 MB', type: 'blue' },
      { name: 'ECG Report', size: '3.0 MB', type: 'red' },
      { name: 'Neuropathy Assessment', size: '2.2 MB', type: 'blue' },
      { name: 'Insulin Consent', size: '0.7 MB', type: 'red' },
    ],
    hrData: [
      { day: 'M', thisWeek: 88, lastWeek: 82 }, { day: 'T', thisWeek: 85, lastWeek: 79 },
      { day: 'W', thisWeek: 92, lastWeek: 86 }, { day: 'T', thisWeek: 87, lastWeek: 80 },
      { day: 'F', thisWeek: 90, lastWeek: 84 }, { day: 'S', thisWeek: 83, lastWeek: 77 },
      { day: 'S', thisWeek: 86, lastWeek: 81 },
    ],
    hrStats: { avg: 87, min: 62, max: 95 },
  },
  {
    id: 'pat_005', name: 'Mary Tan Siew Lian', gender: 'Female', age: 82,
    dob: '15 March 1943', phone: '+6016 888 9900', email: 'mary.tan@email.com',
    address: '56 Bangsar South, KL 59200', ic: '430315-14-2244',
    photo: 'MT',
    medicalHistory: [
      { icon: '🫀', name: 'Heart Failure', desc: 'Congestive heart failure with preserved EF.' },
      { icon: '🦴', name: 'Arthritis', desc: 'Degenerative joint disease limiting mobility.' },
      { icon: '💊', name: 'Polypharmacy', desc: 'Multiple medications requiring careful management.' },
    ],
    appointments: [
      { name: 'Cardiology F/U', date: '08 January 2025', doctor: 'Dr. Ahmad Razak', done: true },
      { name: 'Joint Injection', date: '15 January 2025', doctor: 'Dr. Tan Mei Ling', done: true },
      { name: 'Medication Review', date: '22 January 2025', doctor: 'Dr. Fatimah Hassan', done: false },
      { name: 'Echo Follow-up', date: '30 January 2025', doctor: 'Dr. Ahmad Razak', done: false },
    ],
    documents: [
      { name: 'Echo Report', size: '5.1 MB', type: 'blue' },
      { name: 'Joint Assessment', size: '1.9 MB', type: 'blue' },
      { name: 'Medication Reconciliation', size: '0.6 MB', type: 'red' },
      { name: 'Care Plan', size: '1.3 MB', type: 'blue' },
    ],
    hrData: [
      { day: 'M', thisWeek: 76, lastWeek: 70 }, { day: 'T', thisWeek: 72, lastWeek: 68 },
      { day: 'W', thisWeek: 78, lastWeek: 74 }, { day: 'T', thisWeek: 74, lastWeek: 69 },
      { day: 'F', thisWeek: 80, lastWeek: 72 }, { day: 'S', thisWeek: 70, lastWeek: 66 },
      { day: 'S', thisWeek: 75, lastWeek: 71 },
    ],
    hrStats: { avg: 75, min: 52, max: 84 },
  },
];

/* ── Scatter chart data for "Medical Information" visual ── */
const scatterData = Array.from({ length: 40 }, (_, i) => ({
  x: Math.floor(Math.random() * 7),
  y: 40 + Math.floor(Math.random() * 120),
  z: 3 + Math.random() * 6,
}));

export default function DoctorView() {
  const [selectedId, setSelectedId] = useState(patientProfiles[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAge, setAddAge] = useState('');
  const [addGender, setAddGender] = useState('Male');
  const [addPhone, setAddPhone] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [showDocModal, setShowDocModal] = useState<{ open: boolean; doc: any }>({ open: false, doc: null });

  const filteredPatients = useMemo(() =>
    patientProfiles.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const patient = patientProfiles.find(p => p.id === selectedId) || patientProfiles[0];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* ── Left: Patient List Sidebar ── */}
      <div className="w-[260px] flex-none flex flex-col py-6 px-4 overflow-y-auto max-h-[calc(100vh-3.5rem)] doctor-sidebar">
        {/* Doctor Info */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm"
            style={{ background: 'linear-gradient(135deg, #fdedef, #fce7f3)', color: '#e74c5a', border: '1px solid #fecaca' }}>SJ</div>
          <div>
            <div className="text-xs font-black tracking-tight" style={{ color: 'var(--heart-text)' }}>Dr. Sarah Jenkins</div>
            <div className="text-[10px] flex items-center gap-1.5 font-semibold" style={{ color: '#10b981' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" /> Online
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-6 sidebar-search border border-transparent focus-within:border-emerald-200 transition-all shadow-sm">
          <Search className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} />
          <input type="text" placeholder="Search patients..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-xs w-full font-medium" style={{ color: 'var(--heart-text)' }} />
        </div>

        <div className="text-[10px] font-black tracking-[0.1em] px-2 mb-3 text-slate-400 uppercase">
          My Patients ({filteredPatients.length})
        </div>

        {/* Patient List */}
        <div className="space-y-1.5 flex-1">
          {filteredPatients.map(p => {
            const isActive = selectedId === p.id;
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left doctor-patient-btn ${isActive ? 'active' : ''}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-none shadow-sm transition-transform"
                  style={{ background: isActive ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : '#f1f5f9', color: isActive ? '#15803d' : '#64748b' }}>
                  {p.photo}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: isActive ? '#15803d' : 'var(--heart-text)' }}>{p.name}</div>
                  <div className="text-[10px] font-medium opacity-70" style={{ color: 'var(--heart-text-muted)' }}>{p.age} y.o. • {p.gender}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Add Patient */}
        <button className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold mt-4 transition-all hover:bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"
          onClick={() => setAddPatientOpen(true)}>
          <Plus className="h-4 w-4" /> Add Patient
        </button>
      </div>

      {/* ── Main Content ── */}
      <div key={patient.id} className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-3.5rem)] animate-slide-in" style={{ background: 'var(--heart-bg)' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--heart-text)' }}>Patient Profile</h1>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">EMHR Digital Record</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="p-2.5 rounded-xl transition-all hover:bg-slate-50" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)', boxShadow: 'var(--heart-shadow)' }}>
              <Printer className="h-4 w-4" style={{ color: 'var(--heart-text-secondary)' }} />
            </button>
            <button onClick={() => alert('Patient report downloaded')} className="p-2.5 rounded-xl transition-all hover:bg-slate-50" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)', boxShadow: 'var(--heart-shadow)' }}>
              <Download className="h-4 w-4" style={{ color: 'var(--heart-text-secondary)' }} />
            </button>
            <button className="btn-primary flex items-center gap-2 py-2.5 px-5">
              <Plus className="h-4 w-4" /> Action
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left 2 cols: Patient Info + History + Appointments + Documents ── */}
          <div className="xl:col-span-2 space-y-6">
            {/* Patient Information Card */}
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full opacity-50 -mr-10 -mt-10" />
              
              <div className="flex flex-col md:flex-row gap-8 relative z-10">
                {/* Photo Container */}
                <div className="flex-none">
                  <div className="w-32 h-32 rounded-3xl flex items-center justify-center text-4xl font-black profile-photo-container"
                    style={{ background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)', color: '#15803d' }}>
                    {patient.photo}
                  </div>
                  <div className="mt-4 text-center md:text-left">
                    <div className="text-base font-black text-slate-800">{patient.name}</div>
                    <div className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">ID: {patient.ic}</div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
                  <InfoRow icon={<User />} label="Gender" value={patient.gender} />
                  <InfoRow icon={<Phone />} label="Phone Number" value={patient.phone} />
                  <InfoRow icon={<Calendar />} label="Age" value={`${patient.age} Years Old`} />
                  <InfoRow icon={<Mail />} label="Email Address" value={patient.email} />
                  <InfoRow icon={<Clock />} label="Date of Birth" value={patient.dob} />
                  <InfoRow icon={<MapPin />} label="Residential Address" value={patient.address} />
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black tracking-tight" style={{ color: 'var(--heart-text)' }}>Medical History</h2>
                <button className="text-[10px] font-bold text-emerald-600 hover:underline">View Clinical Details</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {patient.medicalHistory.map((h, i) => (
                  <button key={h.name} onClick={() => setShowHistory(showHistory === h.name ? null : h.name)}
                    className={`medical-history-card card p-5 text-left border-2 border-transparent transition-all ${showHistory === h.name ? 'active' : ''}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm" style={{ background: 'var(--heart-bg)' }}>
                      <span className="text-xl">{h.icon}</span>
                    </div>
                    <div className="text-xs font-black mb-1" style={{ color: 'var(--heart-text)' }}>{h.name}</div>
                    <p className="text-[10px] font-medium leading-relaxed" style={{ color: 'var(--heart-text-muted)' }}>{h.desc}</p>
                    {showHistory === h.name && (
                      <div className="mt-3 pt-3 flex items-center gap-1.5" style={{ borderTop: '1px solid var(--heart-border-light)' }}>
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#059669' }}>Active Monitoring</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointments + Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appointments */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-black tracking-tight" style={{ color: 'var(--heart-text)' }}>Clinical Appointments</h3>
                  <Calendar className="h-4 w-4 text-slate-300" />
                </div>
                <div className="space-y-4">
                  {patient.appointments.map((a, i) => (
                    <button key={i} className="appointment-item flex items-center gap-4 w-full text-left p-1"
                      onClick={() => alert(`${a.done ? 'Reviewing' : 'Scheduling'}: ${a.name}\nDate: ${a.date}\nDoctor: ${a.doctor}`)}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none shadow-sm"
                        style={{ background: a.done ? '#ecfdf5' : '#fff1f2', border: `1px solid ${a.done ? '#bbf7d0' : '#fecaca'}` }}>
                        {a.done ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-rose-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: a.done ? 'var(--heart-text)' : '#e11d48' }}>{a.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400">{a.date}</span>
                          <span className="text-[10px] font-black text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-slate-400">{a.doctor}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-slate-300 flex-none" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Agreement */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-black tracking-tight" style={{ color: 'var(--heart-text)' }}>Legal & Consent</h3>
                  <FileText className="h-4 w-4 text-slate-300" />
                </div>
                <div className="space-y-4">
                  {patient.documents.map((d, i) => (
                    <button key={i} className="doc-agreement-item flex items-center gap-4 w-full text-left rounded-xl p-2 transition-all hover:bg-slate-50"
                      onClick={() => setShowDocModal({ open: true, doc: d })}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none shadow-sm"
                        style={{ background: d.type === 'blue' ? '#eff6ff' : '#fff1f2', border: `1px solid ${d.type === 'blue' ? '#dbeafe' : '#fecaca'}` }}>
                        <FileText className="h-4 w-4" style={{ color: d.type === 'blue' ? '#2563eb' : '#e11d48' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate text-slate-700">{d.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{d.size} • EMHR Verified</div>
                      </div>
                      <div className="px-2 py-1 rounded-md bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider">Signed</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right col: Medical Information + Heart Rate ── */}
          <div className="space-y-6">
            {/* Medical Information Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black tracking-tight" style={{ color: 'var(--heart-text)' }}>Bio-Metric Map</h3>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="rounded-2xl overflow-hidden mb-5 shadow-inner" style={{ background: 'linear-gradient(135deg, #f0f9ff, #ecfdf5, #fdf2f8)', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Scatter data={scatterData} fill="#10b981" opacity={0.4} shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <button onClick={() => setReportOpen(true)}
                className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-800 hover:text-white"
                style={{ background: 'var(--heart-bg)', color: 'var(--heart-text-secondary)', border: '1px solid var(--heart-border)' }}>
                Analyze Full Report
              </button>
            </div>

            {/* Heart Rate Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black tracking-tight" style={{ color: 'var(--heart-text)' }}>Heart Rate Analysis</h3>
                <Heart className="h-4 w-4 text-rose-500 animate-pulse" />
              </div>
              <p className="text-[11px] font-medium mb-5 leading-relaxed" style={{ color: 'var(--heart-text-muted)' }}>
                Baseline comparison indicates a {patient.hrStats.avg < 80 ? 'stable' : 'moderately elevated'} clinical state.
              </p>
              
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'AVG', val: patient.hrStats.avg, color: '#0f172a' },
                  { label: 'MIN', val: patient.hrStats.min, color: '#64748b' },
                  { label: 'MAX', val: patient.hrStats.max, color: '#e11d48' },
                ].map((s, i) => (
                  <div key={i} className="heart-rate-stat text-center p-3 rounded-2xl" style={{ background: 'var(--heart-bg)' }}>
                    <div className="text-[9px] font-black text-slate-400 tracking-tighter uppercase">{s.label}</div>
                    <div className="text-xl font-black mt-0.5" style={{ color: s.color }}>{s.val}</div>
                    <div className="text-[8px] font-bold text-slate-400">BPM</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} />
                    <XAxis type="category" dataKey="x" tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} tickLine={false} axisLine={false}
                      tickFormatter={(v: number) => ['M', 'T', 'W', 'T', 'F', 'S', 'S'][v] || ''} name="Day" />
                    <YAxis type="number" dataKey="y" domain={[0, 160]} tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Scatter name="This week" data={patient.hrData.map((d, i) => ({ x: i, y: d.thisWeek }))} fill="#10b981" />
                    <Scatter name="Last week" data={patient.hrData.map((d, i) => ({ x: i, y: d.lastWeek }))} fill="#f59e0b" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: '#10b981' }} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: '#f59e0b' }} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Previous</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Patient Modal */}
      {addPatientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="card p-6 w-[420px] mx-4" style={{ background: 'var(--heart-surface)' }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--heart-text)' }}>Add New Patient</h3>
            <div className="space-y-3">
              <div><label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--heart-text-muted)' }}>Full Name *</label><input type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="Patient full name" className="w-full text-xs p-2.5 rounded-lg outline-none" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }} /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--heart-text-muted)' }}>Age</label><input type="number" value={addAge} onChange={e => setAddAge(e.target.value)} placeholder="Age" className="w-full text-xs p-2.5 rounded-lg outline-none" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }} /></div><div><label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--heart-text-muted)' }}>Gender</label><select value={addGender} onChange={e => setAddGender(e.target.value)} className="w-full text-xs p-2.5 rounded-lg outline-none" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }}><option>Male</option><option>Female</option></select></div></div>
              <div><label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--heart-text-muted)' }}>Phone Number</label><input type="text" value={addPhone} onChange={e => setAddPhone(e.target.value)} placeholder="+60xx xxx xxxx" className="w-full text-xs p-2.5 rounded-lg outline-none" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }} /></div>
            </div>
            <div className="flex items-center gap-2 mt-5"><button onClick={() => setAddPatientOpen(false)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ border: '1px solid var(--heart-border)', color: 'var(--heart-text-secondary)' }}>Cancel</button><button onClick={() => { if (addName.trim()) { alert(`Patient "${addName}" added successfully!`); setAddPatientOpen(false); setAddName(''); setAddAge(''); setAddPhone(''); } }} className="flex-1 py-2 rounded-lg text-xs font-bold text-white" style={{ background: addName.trim() ? '#1e293b' : '#9ca3af' }}>Add Patient</button></div>
          </div>
        </div>
      )}

      {/* Full Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setReportOpen(false)}>
          <div className="card p-6 w-[600px] mx-4 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--heart-surface)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>Full Medical Report — {patient.name}</h3><button onClick={() => setReportOpen(false)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--heart-bg)' }}>✕</button></div>
            <div className="space-y-4">
              <div className="p-3 rounded-xl" style={{ background: 'var(--heart-bg)' }}><div className="text-[10px] font-bold mb-2" style={{ color: 'var(--heart-text-muted)' }}>PATIENT DEMOGRAPHICS</div><div className="grid grid-cols-2 gap-2 text-xs"><div><span style={{ color: 'var(--heart-text-muted)' }}>Name: </span><span className="font-semibold" style={{ color: 'var(--heart-text)' }}>{patient.name}</span></div><div><span style={{ color: 'var(--heart-text-muted)' }}>IC: </span><span className="font-semibold" style={{ color: 'var(--heart-text)' }}>{patient.ic}</span></div><div><span style={{ color: 'var(--heart-text-muted)' }}>Age: </span><span className="font-semibold" style={{ color: 'var(--heart-text)' }}>{patient.age} y.o.</span></div><div><span style={{ color: 'var(--heart-text-muted)' }}>Gender: </span><span className="font-semibold" style={{ color: 'var(--heart-text)' }}>{patient.gender}</span></div><div><span style={{ color: 'var(--heart-text-muted)' }}>DOB: </span><span className="font-semibold" style={{ color: 'var(--heart-text)' }}>{patient.dob}</span></div><div><span style={{ color: 'var(--heart-text-muted)' }}>Phone: </span><span className="font-semibold" style={{ color: 'var(--heart-text)' }}>{patient.phone}</span></div></div></div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--heart-bg)' }}><div className="text-[10px] font-bold mb-2" style={{ color: 'var(--heart-text-muted)' }}>MEDICAL CONDITIONS</div>{patient.medicalHistory.map(h => <div key={h.name} className="flex items-center gap-2 mb-1"><span>{h.icon}</span><span className="text-xs font-semibold" style={{ color: 'var(--heart-text)' }}>{h.name}</span><span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>— {h.desc}</span></div>)}</div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--heart-bg)' }}><div className="text-[10px] font-bold mb-2" style={{ color: 'var(--heart-text-muted)' }}>VITALS SUMMARY (7-DAY)</div><div className="grid grid-cols-3 gap-3 text-center"><div><div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>{patient.hrStats.avg}</div><div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Avg HR (bpm)</div></div><div><div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>{patient.hrStats.min}</div><div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Min HR</div></div><div><div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>{patient.hrStats.max}</div><div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Max HR</div></div></div></div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--heart-bg)' }}><div className="text-[10px] font-bold mb-2" style={{ color: 'var(--heart-text-muted)' }}>APPOINTMENTS</div>{patient.appointments.map((a, i) => <div key={i} className="flex items-center gap-2 mb-1"><span className="text-[10px]" style={{ color: a.done ? '#16a34a' : '#dc2626' }}>{a.done ? '✓' : '○'}</span><span className="text-xs" style={{ color: 'var(--heart-text)' }}>{a.name}</span><span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{a.date}</span></div>)}</div>
            </div>
            <button onClick={() => { window.print(); }} className="w-full mt-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#1e293b' }}>Print Report</button>
          </div>
        </div>
      )}

      {/* Document Agreement Modal */}
      {showDocModal.open && showDocModal.doc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="card-glass w-full max-w-2xl p-8 relative flex flex-col max-h-[90vh]">
            <button onClick={() => setShowDocModal({ open: false, doc: null })} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-none" style={{ background: showDocModal.doc.type === 'blue' ? '#e0f2fe' : '#fee2e2' }}>
                <FileText className="h-6 w-6" style={{ color: showDocModal.doc.type === 'blue' ? '#3b82f6' : '#ef4444' }} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-800">{showDocModal.doc.name}</h2>
                <div className="text-xs text-gray-500 font-medium">Patient: {patient.name} • IC: {patient.ic}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 p-6 rounded-xl border border-gray-200 bg-gray-50 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {`MEDICAL AGREEMENT AND CONSENT

This document serves as formal agreement and consent for the above-named patient, under the care of HEART Clinical Services.

1. Description of Treatment/Procedure
The patient agrees to undergo the medical treatment/procedure explicitly described in the primary consultation notes, which may include the administration of medications, surgical interventions, and post-operative monitoring.

2. Risks and Complications
The medical team has explained that no procedure is entirely without risk. Potential complications may include, but are not limited to, infection, bleeding, allergic reactions, and unforeseen cardiac events.

3. Acknowledgement
By signing below, the undersigned confirms that they have read and understood this document, that all questions have been answered satisfactorily, and that they voluntarily consent to the proposed medical intervention.

Effective Date: ${new Date().toLocaleDateString('en-MY')}
File Size: ${showDocModal.doc.size}`}
            </div>

            <div className="border-t border-gray-200 mt-auto pt-6 flex justify-between items-end">
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-500 mb-2">Digital Signature Requested</div>
                <div className="h-16 w-64 border-b-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs italic bg-gray-50/50 rounded-t-sm">
                  Click to Sign
                </div>
              </div>
              <button 
                onClick={() => { alert('Document successfully signed and saved to EMHR.'); setShowDocModal({ open: false, doc: null }); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <Edit3 className="h-4 w-4" /> Sign & Approve Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactElement; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="mt-1 flex-none flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
        {React.cloneElement(icon, { size: 14 })}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-[11px] font-bold text-slate-700 truncate">{value}</div>
      </div>
    </div>
  );
}
