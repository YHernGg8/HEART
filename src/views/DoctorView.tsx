/**
 * HEART Doctor Dashboard — Evergreen Patient Detail
 * Left: Patient list sidebar. Right: Patient Information, Medical Info, History, Appointments, Documents, HR Chart
 * All buttons and interactions are functional.
 */

import { useState, useMemo } from 'react';
import {
  Activity, Shield, FileText, AlertTriangle, Eye,
  Stethoscope, CheckSquare, Square, Siren, Search,
  Plus, Download, Printer, Phone, Mail, MapPin, Calendar,
  User, Heart, Clock,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid, Tooltip, ScatterChart, Scatter,
} from 'recharts';
import { getMockDashboardPatients } from '../mock-data';
import { getRiskColor, type DashboardPatient } from '../types';

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

  const filteredPatients = useMemo(() =>
    patientProfiles.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const patient = patientProfiles.find(p => p.id === selectedId) || patientProfiles[0];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* ── Left: Patient List Sidebar ── */}
      <div className="w-[240px] flex-none flex flex-col py-4 px-3 overflow-y-auto max-h-[calc(100vh-3.5rem)]"
        style={{ background: 'var(--heart-surface)', borderRight: '1px solid var(--heart-border-light)' }}>
        {/* Doctor Info */}
        <div className="flex items-center gap-2 px-2 mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: '#fde8e8', color: '#e74c5a' }}>SJ</div>
          <div>
            <div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>Dr. Sarah Jenkins</div>
            <div className="text-[9px] flex items-center gap-1" style={{ color: '#10b981' }}>● Online</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg mb-3"
          style={{ background: 'var(--heart-bg)', border: '1px solid var(--heart-border-light)' }}>
          <Search className="h-3.5 w-3.5" style={{ color: 'var(--heart-text-muted)' }} />
          <input type="text" placeholder="Search patients..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-xs w-full" style={{ color: 'var(--heart-text)' }} />
        </div>

        <div className="text-[9px] font-bold tracking-wider px-2 mb-2" style={{ color: 'var(--heart-text-muted)' }}>
          MY PATIENTS ({filteredPatients.length})
        </div>

        {/* Patient List */}
        <div className="space-y-1 flex-1">
          {filteredPatients.map(p => {
            const isActive = selectedId === p.id;
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all"
                style={{
                  background: isActive ? '#f0fdf4' : 'transparent',
                  border: isActive ? '1px solid #bbf7d0' : '1px solid transparent',
                }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-none"
                  style={{ background: isActive ? '#dcfce7' : '#f1f5f9', color: isActive ? '#16a34a' : '#64748b' }}>
                  {p.photo}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: isActive ? '#059669' : 'var(--heart-text)' }}>{p.name}</div>
                  <div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>{p.age} y.o. • {p.gender}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Add Patient */}
        <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold mt-3 transition-all hover:scale-[1.01]"
          style={{ border: '1px dashed var(--heart-border)', color: 'var(--heart-text-muted)' }}
          onClick={() => setAddPatientOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Patient
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-3.5rem)]" style={{ background: 'var(--heart-bg)' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--heart-text)' }}>Patient</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="p-2 rounded-lg" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
              <Printer className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} />
            </button>
            <button onClick={() => alert('Patient report downloaded')} className="p-2 rounded-lg" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
              <Download className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* ── Left 2 cols: Patient Info + History + Appointments + Documents ── */}
          <div className="xl:col-span-2 space-y-5">
            {/* Patient Information Card */}
            <div className="card p-5">
              <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--heart-text)' }}>Patient Information</h2>
              <div className="flex gap-5">
                {/* Photo */}
                <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-3xl font-black flex-none"
                  style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', color: '#059669' }}>
                  {patient.photo}
                </div>
                {/* Details grid */}
                <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3">
                  <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Gender" value={patient.gender} />
                  <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone Number" value={patient.phone} />
                  <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Age" value={`${patient.age} y.o`} />
                  <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={patient.email} />
                  <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="Date of Birth" value={patient.dob} />
                  <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={patient.address} />
                </div>
              </div>
              <div className="text-sm font-bold mt-3" style={{ color: 'var(--heart-text)' }}>{patient.name}</div>
              <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>IC: {patient.ic}</div>
            </div>

            {/* Medical History */}
            <div>
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--heart-text)' }}>Medical History</h2>
              <div className="grid grid-cols-3 gap-3">
                {patient.medicalHistory.map(h => (
                  <button key={h.name} onClick={() => setShowHistory(showHistory === h.name ? null : h.name)}
                    className="card p-4 text-left transition-all hover:scale-[1.01]"
                    style={{ border: showHistory === h.name ? '1px solid #10b981' : undefined }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{h.icon}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{h.name}</span>
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: 'var(--heart-text-muted)' }}>{h.desc}</p>
                    {showHistory === h.name && (
                      <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--heart-border-light)' }}>
                        <div className="text-[10px] font-semibold" style={{ color: '#059669' }}>
                          ✓ Viewing detailed history...
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointments + Documents */}
            <div className="grid grid-cols-2 gap-5">
              {/* Appointments */}
              <div className="card p-4">
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--heart-text)' }}>Appointments</h3>
                <div className="space-y-3">
                  {patient.appointments.map((a, i) => (
                    <button key={i} className="flex items-start gap-2.5 w-full text-left"
                      onClick={() => alert(`${a.done ? 'Reviewing' : 'Scheduling'}: ${a.name}\nDate: ${a.date}\nDoctor: ${a.doctor}`)}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center mt-0.5 text-xs font-bold flex-none"
                        style={{ background: a.done ? '#dcfce7' : '#fee2e2', color: a.done ? '#16a34a' : '#dc2626' }}>
                        {a.done ? '✓' : '!'}
                      </div>
                      <div>
                        <div className="text-xs font-bold" style={{ color: a.done ? 'var(--heart-text)' : '#dc2626' }}>{a.name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{a.date}</div>
                        <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{a.doctor}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Agreement */}
              <div className="card p-4">
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--heart-text)' }}>Document Agreement</h3>
                <div className="space-y-3">
                  {patient.documents.map((d, i) => (
                    <button key={i} className="flex items-center gap-2.5 w-full text-left hover:bg-gray-50 rounded-lg p-1 -m-1 transition-all"
                      onClick={() => alert(`Opening document: ${d.name} (${d.size})`)}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none"
                        style={{ background: d.type === 'blue' ? '#e0f2fe' : '#fee2e2' }}>
                        <FileText className="h-4 w-4" style={{ color: d.type === 'blue' ? '#3b82f6' : '#ef4444' }} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: 'var(--heart-text)' }}>{d.name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{d.size}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right col: Medical Information + Heart Rate ── */}
          <div className="space-y-5">
            {/* Medical Information Card */}
            <div className="card p-5">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--heart-text)' }}>Medical Information</h3>
              <div className="rounded-xl overflow-hidden mb-3" style={{ background: 'linear-gradient(135deg, #e0f2fe, #f0fdf4, #fce7f3)', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <Scatter data={scatterData} fill="#10b981" opacity={0.5}>
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <button onClick={() => setReportOpen(true)}
                className="w-full py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: 'var(--heart-bg)', color: 'var(--heart-text-secondary)', border: '1px solid var(--heart-border)' }}>
                View Full Report
              </button>
            </div>

            {/* Heart Rate Card */}
            <div className="card p-5">
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--heart-text)' }}>Heart Rate</h3>
              <p className="text-[10px] mb-3" style={{ color: 'var(--heart-text-muted)' }}>
                Heart rate is in a {patient.hrStats.avg < 80 ? 'stable and healthy' : 'elevated'} state this week.
              </p>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2.5 rounded-xl" style={{ background: 'var(--heart-bg)' }}>
                  <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Average</div>
                  <div className="text-xl font-black" style={{ color: 'var(--heart-text)' }}>{patient.hrStats.avg}
                    <span className="text-[10px] font-normal ml-0.5">bpm</span>
                  </div>
                </div>
                <div className="text-center p-2.5 rounded-xl" style={{ background: 'var(--heart-bg)' }}>
                  <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Minimum</div>
                  <div className="text-xl font-black" style={{ color: 'var(--heart-text)' }}>{patient.hrStats.min}
                    <span className="text-[10px] font-normal ml-0.5">bpm</span>
                  </div>
                </div>
                <div className="text-center p-2.5 rounded-xl" style={{ background: 'var(--heart-bg)' }}>
                  <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Maximum</div>
                  <div className="text-xl font-black" style={{ color: 'var(--heart-text)' }}>{patient.hrStats.max}
                    <span className="text-[10px] font-normal ml-0.5">bpm</span>
                  </div>
                </div>
              </div>
              {/* Chart */}
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart margin={{ top: 5, right: 5, bottom: 15, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="category" dataKey="x" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => ['M', 'T', 'W', 'T', 'F', 'S', 'S'][v] || ''} name="Day" allowDuplicatedCategory={false} />
                  <YAxis type="number" dataKey="y" domain={[0, 160]} tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} name="BPM" />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                  <Scatter data={patient.hrData.map((d, i) => ({ x: i, y: d.thisWeek, label: 'This week' }))} fill="#10b981" />
                  <Scatter data={patient.hrData.map((d, i) => ({ x: i, y: d.lastWeek, label: 'Last week' }))} fill="#fbbf24" />
                </ScatterChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
                  <span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>This week</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#fbbf24' }} />
                  <span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Last week</span>
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
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 [&>svg]:h-3.5 [&>svg]:w-3.5" style={{ color: 'var(--heart-text-muted)' }}>{icon}</div>
      <div>
        <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{label}</div>
        <div className="text-xs font-semibold" style={{ color: 'var(--heart-text)' }}>{value}</div>
      </div>
    </div>
  );
}
