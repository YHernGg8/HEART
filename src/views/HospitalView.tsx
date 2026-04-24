/**
 * HEART Hospital Admin — Evergreen Dashboard UI + Functional Features
 * Full sidebar nav, stats cards, report donut, patients overview, patient table,
 * PLUS: incoming alerts, ward beds, on-call specialists, action log
 */

import { useState } from 'react';
import {
  Stethoscope, User, Building2, Calendar,
  ClipboardList, FileBarChart, Users, CreditCard, Layout,
  Settings, ShieldCheck, HelpCircle, Search,
  BedDouble, Plus, ArrowUpRight, Siren, Clock, CheckCircle,
  XCircle, UserCheck, Truck, AlertTriangle, ArrowRight, Shield,
  Trash2, Edit3,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

/* ── Report donut data ── */
const reportData = [
  { name: 'Urgent', value: 35, color: '#ef4444' },
  { name: 'Moderate', value: 25, color: '#f59e0b' },
  { name: 'Low', value: 15, color: '#10b981' },
  { name: 'Remaining', value: 25, color: '#e5e7eb' },
];

/* ── Patients overview line data ── */
const overviewData = [
  { range: '01-07', discharge: 35, new: 28 }, { range: '08-12', discharge: 42, new: 35 },
  { range: '13-17', discharge: 38, new: 45 }, { range: '18-21', discharge: 50, new: 40 },
  { range: '21-25', discharge: 44, new: 38 }, { range: '26-31', discharge: 48, new: 42 },
];

/* ── On-Call Specialists ── */
const specialists = [
  { name: 'Dr. A. Rizal', dept: 'Emergency', color: '#ef4444', status: 'available' as const },
  { name: 'Dr. Tan W. M.', dept: 'Cardiology', color: '#3b82f6', status: 'available' as const },
  { name: 'Dr. M. Nair', dept: 'Neurology', color: '#8b5cf6', status: 'available' as const },
  { name: 'Dr. S. Connor', dept: 'Trauma', color: '#f59e0b', status: 'available' as const },
  { name: 'Dr. Lee K. H.', dept: 'Internal Medicine', color: '#10b981', status: 'busy' as const },
  { name: 'Dr. Fatimah H.', dept: 'Pediatrics', color: '#ec4899', status: 'off-duty' as const },
];

/* ── Patient detail table ── */
const initialPtDetails = [
  { name: 'Ahmad bin Abdullah', gender: 'Male', age: 78, id: 'MY780514001', admission: '6 Jan 2024', diagnose: 'Hypertension', status: 'Urgent' as const, room: 'Orchid Room' },
  { name: 'Lee Chong Wei', gender: 'Male', age: 73, id: 'MY730621002', admission: '12 Jan 2024', diagnose: 'Arrhythmia', status: 'Moderate' as const, room: 'Tulip Room' },
  { name: 'Fatimah binti Hassan', gender: 'Female', age: 85, id: 'MY851102003', admission: '15 Jan 2024', diagnose: 'Stroke', status: 'Urgent' as const, room: 'Rose Room' },
  { name: 'Rajendran a/l Muthu', gender: 'Male', age: 75, id: 'MY750830004', admission: '18 Jan 2024', diagnose: 'COPD', status: 'Moderate' as const, room: 'Lily Room' },
  { name: 'Mary Tan Siew Lian', gender: 'Female', age: 82, id: 'MY820315005', admission: '20 Jan 2024', diagnose: 'Heart Failure', status: 'Low' as const, room: 'Daisy Room' },
];

/* ── Incoming cases ── */
interface IncomingCase { id: string; title: string; patient: string; age: number; gender: string; symptoms: string; severity: 'High' | 'Medium'; eta: string; doctor: string; dept: string; status: 'pending' | 'confirmed' | 'dismissed'; }
const initialCases: IncomingCase[] = [
  { id: 'IC-001', title: 'Possible Cardiac Emergency', patient: 'John Doe', age: 68, gender: 'M', symptoms: 'Chest pain, Dyspnea', severity: 'High', eta: '4 Mins', doctor: 'Dr. Tan Wei Ming', dept: 'Cardiology', status: 'pending' },
  { id: 'IC-002', title: 'Suspected Stroke', patient: 'Aminah binti Yusof', age: 72, gender: 'F', symptoms: 'Slurred speech, Left weakness', severity: 'High', eta: '7 Mins', doctor: 'Dr. M. Nair', dept: 'Neurology', status: 'pending' },
];

/* ── Ward Beds ── */
interface WardBed { id: string; type: string; patient: string | null; doctor: string | null; status: 'available' | 'occupied'; }
const initialBeds: WardBed[] = [
  { id: 'ICU-01', type: 'ICU', patient: null, doctor: null, status: 'available' },
  { id: 'ICU-02', type: 'ICU', patient: 'Ahmad bin Abdullah', doctor: 'Dr. A. Rizal', status: 'occupied' },
  { id: 'EX-01', type: 'Executive', patient: 'Lee Chong Wei', doctor: 'Dr. Tan W. M.', status: 'occupied' },
  { id: 'EX-02', type: 'Executive', patient: null, doctor: null, status: 'available' },
  { id: 'PR-01', type: 'Premium', patient: 'Fatimah binti Hassan', doctor: 'Dr. M. Nair', status: 'occupied' },
  { id: 'PR-02', type: 'Premium', patient: null, doctor: null, status: 'available' },
  { id: 'BA-01', type: 'Basic', patient: 'Mary Tan', doctor: 'Dr. Fatimah H.', status: 'occupied' },
  { id: 'BA-02', type: 'Basic', patient: null, doctor: null, status: 'available' },
];

/* ── ED Patients ── */
interface EDPatient { name: string; age: number; gender: string; complaint: string; triage: string; time: string; assigned: boolean; }
const initialED: EDPatient[] = [
  { name: 'Lim Wei Jian', age: 55, gender: 'M', complaint: 'Suspected stroke, onset 30 min', triage: 'Critical', time: '09:15', assigned: false },
  { name: 'Siti Aminah', age: 38, gender: 'F', complaint: 'MVA, blunt force trauma', triage: 'Urgent', time: '09:32', assigned: false },
];

interface ActionLog { id: number; action: string; time: string; type: 'assign' | 'alert' | 'discharge' | 'delete' | 'edit'; }

const sevColor = (s: string) => s === 'Urgent' || s === 'High' || s === 'Critical' ? { bg: '#fee2e2', color: '#dc2626' } : s === 'Moderate' || s === 'Medium' ? { bg: '#fef3c7', color: '#ca8a04' } : { bg: '#dcfce7', color: '#16a34a' };

type ViewPage = 'Dashboard' | 'Incoming Alerts' | 'Ward Management' | 'ED Patients';

export default function HospitalView() {
  const [activePage, setActivePage] = useState<ViewPage>('Dashboard');
  const [cases, setCases] = useState(initialCases);
  const [beds, setBeds] = useState(initialBeds);
  const [edPatients, setEdPatients] = useState(initialED);
  const [ptDetails, setPtDetails] = useState(initialPtDetails);
  const [actionLog, setActionLog] = useState<ActionLog[]>([]);
  const [detailFilter, setDetailFilter] = useState<'Today' | 'Last Week' | 'Last Month' | 'Last Year'>('Today');
  const [showRoster, setShowRoster] = useState(false);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [assignName, setAssignName] = useState('');
  const [assignDoc, setAssignDoc] = useState('');

  const addLog = (action: string, type: ActionLog['type']) => {
    setActionLog(prev => [{ id: Date.now(), action, time: new Date().toLocaleTimeString(), type }, ...prev].slice(0, 15));
  };

  const confirmCase = (id: string) => { setCases(p => p.map(c => c.id === id ? { ...c, status: 'confirmed' as const } : c)); const c = cases.find(x => x.id === id); if (c) addLog(`Confirmed: ${c.patient} → ${c.doctor}`, 'assign'); };
  const dismissCase = (id: string) => { setCases(p => p.map(c => c.id === id ? { ...c, status: 'dismissed' as const } : c)); const c = cases.find(x => x.id === id); if (c) addLog(`Dismissed: ${c.patient}`, 'alert'); };
  const assignBed = (bedId: string) => { if (!assignName.trim()) return; setBeds(p => p.map(b => b.id === bedId ? { ...b, patient: assignName, doctor: assignDoc || null, status: 'occupied' as const } : b)); addLog(`Bed ${bedId} → ${assignName}`, 'assign'); setAssignModal(null); setAssignName(''); setAssignDoc(''); };
  const dischargeBed = (bedId: string) => { const b = beds.find(x => x.id === bedId); if (b?.patient) { addLog(`Discharged ${b.patient} from ${bedId}`, 'discharge'); setBeds(p => p.map(x => x.id === bedId ? { ...x, patient: null, doctor: null, status: 'available' as const } : x)); } };
  const assignED = (i: number) => { setEdPatients(p => p.map((e, j) => j === i ? { ...e, assigned: true } : e)); addLog(`ED: Assigned ${edPatients[i].name}`, 'assign'); };
  const deletePt = (id: string) => { const pt = ptDetails.find(p => p.id === id); if (pt) { setPtDetails(p => p.filter(x => x.id !== id)); addLog(`Deleted patient: ${pt.name}`, 'delete'); } };

  const availBeds = beds.filter(b => b.status === 'available').length;
  const occBeds = beds.filter(b => b.status === 'occupied').length;
  const stats = { totalBeds: beds.length, doctors: 46, doctorsLeave: 4, patients: 212, patientsChange: 12, appointments: 50 };

  return (
      <div className="min-h-[calc(100vh-3.5rem)] p-6 overflow-y-auto" style={{ background: 'var(--heart-bg)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--heart-text)' }}>Hospital Command Center</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
              <Search className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} />
              <input type="text" placeholder="Search" className="bg-transparent outline-none text-xs w-32" style={{ color: 'var(--heart-text)' }} />
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#e0f2fe', color: '#3b82f6' }}>AD</div>
          </div>
        </div>

        {/* Page selector tabs */}
        <div className="flex items-center gap-2 mb-5">
          {(['Dashboard', 'Incoming Alerts', 'Ward Management', 'ED Patients'] as ViewPage[]).map(page => (
            <button key={page} onClick={() => setActivePage(page)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
              style={{ background: activePage === page ? '#1e293b' : 'var(--heart-surface)', color: activePage === page ? 'white' : 'var(--heart-text-secondary)', border: `1px solid ${activePage === page ? '#1e293b' : 'var(--heart-border)'}` }}>
              {page}
            </button>
          ))}
        </div>

        {/* ════════ DASHBOARD PAGE ════════ */}
        {activePage === 'Dashboard' && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mb-5">
              <div className="card p-4 transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer group relative">
                <div className="flex items-center gap-1.5 mb-2"><BedDouble className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} /><span className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>Total Beds</span></div>
                <div className="flex items-center gap-2 mb-2"><span className="text-3xl font-black" style={{ color: 'var(--heart-text)' }}>{stats.totalBeds}</span><span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ background: '#dcfce7', color: '#16a34a' }}>Available</span></div>
                <div className="grid grid-cols-2 gap-2 text-center"><div><div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{availBeds}</div><div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Available</div></div><div><div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{occBeds}</div><div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>Occupied</div></div></div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(16,185,129,0.08) 100%)' }}><div className="text-[9px]" style={{ color: '#059669' }}>ICU: {beds.filter(b=>b.type==='ICU').length} • Exec: {beds.filter(b=>b.type==='Executive').length} • Premium: {beds.filter(b=>b.type==='Premium').length} • Basic: {beds.filter(b=>b.type==='Basic').length}</div></div>
              </div>
              <div className="card p-4 transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer group relative">
                <div className="flex items-center gap-1.5 mb-2"><Stethoscope className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} /><span className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>Doctors</span></div>
                <div className="flex items-center gap-2 mb-2"><span className="text-3xl font-black" style={{ color: 'var(--heart-text)' }}>{stats.doctors}</span><span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ background: '#dcfce7', color: '#16a34a' }}>Available</span><span className="text-3xl font-black" style={{ color: 'var(--heart-text)' }}>{stats.doctorsLeave}</span><span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ background: '#fef3c7', color: '#ca8a04' }}>Leave</span></div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(59,130,246,0.06) 100%)' }}><div className="text-[9px]" style={{ color: '#3b82f6' }}>Shows the current number of available doctors.</div></div>
              </div>
              <div className="card p-4 transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer group relative" style={{ border: '1px solid #bbf7d0' }}>
                <div className="flex items-center gap-1.5 mb-2"><Users className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} /><span className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>Patients</span></div>
                <div className="flex items-center gap-2"><span className="text-3xl font-black" style={{ color: 'var(--heart-text)' }}>{stats.patients}</span><span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: '#10b981' }}><ArrowUpRight className="h-3 w-3" />{stats.patientsChange}%</span></div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(16,185,129,0.06) 100%)' }}><div className="text-[9px]" style={{ color: '#059669' }}>Displays live updates of patient numbers.</div></div>
              </div>
              <div className="card p-4 transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer group relative">
                <div className="flex items-center gap-1.5 mb-2"><Calendar className="h-4 w-4" style={{ color: 'var(--heart-text-muted)' }} /><span className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>Appointment</span></div>
                <div className="flex items-center gap-2"><span className="text-3xl font-black" style={{ color: 'var(--heart-text)' }}>{stats.appointments}</span><span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: '#ef4444' }}>↓ 11%</span></div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(239,68,68,0.06) 100%)' }}><div className="text-[9px]" style={{ color: '#ef4444' }}>Ensures accurate and current total patient appointment at all times.</div></div>
              </div>
            </div>

            {/* Report + Overview */}
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>Report</h3>
                  <button onClick={() => alert('Add Report form')} className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text-secondary)', border: '1px solid var(--heart-border)' }}><Plus className="h-3 w-3" /> Add Report</button>
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative w-44 h-44">
                    <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={reportData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>{reportData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}</Pie></PieChart></ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center"><div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Total Done</div><div className="text-2xl font-black" style={{ color: 'var(--heart-text)' }}>75%</div></div>
                  </div>
                  <div className="space-y-2">{reportData.filter(d => d.name !== 'Remaining').map(d => (<div key={d.name} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /><span className="text-xs" style={{ color: 'var(--heart-text)' }}>{d.name}</span><span className="text-xs font-bold" style={{ color: 'var(--heart-text-muted)' }}>{d.value}% done</span></div>))}</div>
                </div>
              </div>
              <div className="card p-5 relative">
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>Patients Overview</h3><span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>December 2024 ▾</span></div>
                <div className="absolute top-4 right-4 p-3 rounded-xl z-10" style={{ background: 'var(--heart-surface)', boxShadow: 'var(--heart-shadow)', border: '1px solid var(--heart-border-light)' }}>
                  <div className="flex items-center gap-1 mb-1"><Users className="h-3 w-3" style={{ color: 'var(--heart-text-muted)' }} /><span className="text-[10px] font-bold" style={{ color: 'var(--heart-text)' }}>Patients</span></div>
                  <div className="flex items-center gap-1"><span className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>50</span><span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: '#dcfce7', color: '#16a34a' }}>Discharged</span></div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={overviewData}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="range" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} /><Legend iconType="line" wrapperStyle={{ fontSize: 10, paddingTop: 8 }} /><Line type="monotone" dataKey="discharge" name="Discharge" stroke="#1e293b" strokeWidth={2} dot={{ r: 3 }} /><Line type="monotone" dataKey="new" name="New" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} /></LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Patients Detail Table */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>Patients Detail Information</h3>
                <div className="flex items-center gap-1 rounded-lg overflow-hidden" style={{ border: '1px solid var(--heart-border)' }}>
                  {(['Today', 'Last Week', 'Last Month', 'Last Year'] as const).map(f => (
                    <button key={f} onClick={() => setDetailFilter(f)} className="px-3 py-1.5 text-[10px] font-semibold transition-all"
                      style={{ background: detailFilter === f ? '#1e293b' : 'transparent', color: detailFilter === f ? 'white' : 'var(--heart-text-secondary)' }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <table className="w-full text-left"><thead><tr style={{ borderBottom: '1px solid var(--heart-border-light)' }}>
                <th className="pb-2 pr-3 w-8"><input type="checkbox" /></th>
                {['Name', 'ID Number', 'Admission Date', 'Diagnose', 'Status', 'Room Name', ''].map(h => (
                  <th key={h} className="pb-2 text-[10px] font-semibold" style={{ color: 'var(--heart-text-muted)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{ptDetails.map(p => {
                const sc = sevColor(p.status);
                return (
                  <tr key={p.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid var(--heart-border-light)' }}>
                    <td className="py-3 pr-3"><input type="checkbox" /></td>
                    <td className="py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: '#fde8e8', color: '#e74c5a' }}>{p.name.charAt(0)}</div><div><div className="text-xs font-semibold" style={{ color: 'var(--heart-text)' }}>{p.name}</div><div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{p.age} y.o., {p.gender}</div></div></div></td>
                    <td className="py-3 text-xs" style={{ color: 'var(--heart-text-secondary)' }}>{p.id}</td>
                    <td className="py-3 text-xs" style={{ color: 'var(--heart-text-secondary)' }}>{p.admission}</td>
                    <td className="py-3 text-xs" style={{ color: 'var(--heart-text-secondary)' }}>{p.diagnose}</td>
                    <td className="py-3"><span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: sc.bg, color: sc.color }}>{p.status}</span></td>
                    <td className="py-3 text-xs" style={{ color: 'var(--heart-text-secondary)' }}>{p.room}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => deletePt(p.id)} className="p-1.5 rounded hover:bg-red-50" title="Delete"><Trash2 className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} /></button>
                        <button onClick={() => alert(`Editing ${p.name}`)} className="p-1.5 rounded hover:bg-blue-50" title="Edit"><Edit3 className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}</tbody></table>
            </div>
          </>
        )}

        {/* ════════ INCOMING ALERTS PAGE ════════ */}
        {activePage === 'Incoming Alerts' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 card p-5">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--heart-text)' }}><Siren className="h-4 w-4" style={{ color: '#ef4444' }} /> Incoming Case Alerts</h2>
              <div className="space-y-3">{cases.map(c => { const sc = sevColor(c.severity); return (
                <div key={c.id} className="p-4 rounded-xl" style={{ background: c.status === 'confirmed' ? '#f0fdf4' : c.status === 'dismissed' ? '#f8fafc' : 'var(--heart-surface)', border: `1px solid ${c.status === 'confirmed' ? '#bbf7d0' : 'var(--heart-border-light)'}`, opacity: c.status === 'dismissed' ? 0.5 : 1 }}>
                  <div className="flex items-start justify-between"><div><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>{c.title}</span><span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: sc.bg, color: sc.color }}>{c.severity} Severity</span></div><div className="text-xs" style={{ color: 'var(--heart-text-secondary)' }}>{c.patient} ({c.age}, {c.gender}) • {c.symptoms}</div></div><div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#f59e0b' }}><Clock className="h-3.5 w-3.5" /> ETA: {c.eta}</div></div>
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--heart-border-light)' }}>
                    <div className="text-xs" style={{ color: 'var(--heart-text-muted)' }}>Suggested: <span className="font-semibold" style={{ color: 'var(--heart-text)' }}>{c.doctor}</span> / {c.dept}</div>
                    <div className="flex items-center gap-2">
                      {c.status === 'pending' && (<><button onClick={() => dismissCase(c.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ border: '1px solid #fecaca', color: '#dc2626' }}><XCircle className="h-3 w-3" /> Dismiss</button><button onClick={() => confirmCase(c.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: '#1e293b' }}><CheckCircle className="h-3 w-3" /> Confirm</button></>)}
                      {c.status === 'confirmed' && <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#16a34a' }}><CheckCircle className="h-3.5 w-3.5" /> Confirmed</span>}
                      {c.status === 'dismissed' && <span className="text-[10px]" style={{ color: '#9ca3af' }}>Dismissed</span>}
                    </div>
                  </div>
                </div>
              ); })}</div>
            </div>
            <div className="space-y-5">
              <div className="card p-5"><h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--heart-text)' }}><Shield className="h-4 w-4" style={{ color: '#3b82f6' }} /> On-Call Specialists</h3>
                <div className="space-y-2">{(showRoster ? specialists : specialists.slice(0, 4)).map(s => (<div key={s.name} className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: 'var(--heart-bg)' }}><div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `${s.color}15`, color: s.color }}>{s.name.split(' ').slice(1).map(w => w[0]).join('').substring(0, 2)}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold truncate" style={{ color: 'var(--heart-text)' }}>{s.name}</div><div className="text-[9px]" style={{ color: s.color }}>{s.dept}</div></div><div className="w-2.5 h-2.5 rounded-full" style={{ background: s.status === 'available' ? '#10b981' : s.status === 'busy' ? '#f59e0b' : '#9ca3af' }} /></div>))}</div>
                <button onClick={() => setShowRoster(!showRoster)} className="w-full mt-3 py-2 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text-secondary)', border: '1px solid var(--heart-border)' }}>{showRoster ? 'Show Less' : 'View Full Roster'}</button>
              </div>
              <div className="card p-5"><h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--heart-text)' }}><ClipboardList className="h-4 w-4" style={{ color: '#f59e0b' }} /> Recent Action Log</h3>
                {actionLog.length === 0 ? <div className="text-center py-4 text-xs" style={{ color: 'var(--heart-text-muted)' }}>No active assignments</div> : <div className="space-y-2 max-h-48 overflow-y-auto">{actionLog.map(e => (<div key={e.id} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'var(--heart-bg)' }}><div className="mt-0.5">{e.type === 'assign' ? <UserCheck className="h-3 w-3" style={{ color: '#10b981' }} /> : e.type === 'alert' ? <AlertTriangle className="h-3 w-3" style={{ color: '#f59e0b' }} /> : <ArrowRight className="h-3 w-3" style={{ color: '#3b82f6' }} />}</div><div><div className="text-[10px] font-semibold" style={{ color: 'var(--heart-text)' }}>{e.action}</div><div className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>{e.time}</div></div></div>))}</div>}
              </div>
            </div>
          </div>
        )}

        {/* ════════ WARD MANAGEMENT PAGE ════════ */}
        {activePage === 'Ward Management' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--heart-text)' }}><BedDouble className="h-4 w-4" style={{ color: '#8b5cf6' }} /> Ward Bed Allocation</h2>
              <div className="flex items-center gap-4 text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} /> Available ({availBeds})</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} /> Occupied ({occBeds})</span>
              </div>
            </div>
            {(['ICU', 'Executive', 'Premium', 'Basic'] as const).map(type => {
              const tb = beds.filter(b => b.type === type);
              const occ = tb.filter(b => b.status === 'occupied').length;
              const typeColors: Record<string, { accent: string; bg: string; border: string; glow: string }> = {
                ICU: { accent: '#dc2626', bg: '#fef2f2', border: '#fecaca', glow: 'rgba(220,38,38,0.08)' },
                Executive: { accent: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', glow: 'rgba(59,130,246,0.08)' },
                Premium: { accent: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd', glow: 'rgba(139,92,246,0.08)' },
                Basic: { accent: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', glow: 'rgba(16,185,129,0.08)' },
              };
              const tc = typeColors[type];
              return (
                <div key={type} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: tc.accent }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{type}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: tc.bg, color: tc.accent }}>{occ}/{tb.length} Occupied</span>
                    </div>
                    <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(occ / tb.length) * 100}%`, background: tc.accent }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">{tb.map(bed => (
                    <div key={bed.id} className="p-4 rounded-2xl transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer group"
                      style={{ background: bed.status === 'available' ? tc.bg : 'var(--heart-surface)', border: `1px solid ${bed.status === 'available' ? tc.border : 'var(--heart-border-light)'}`, boxShadow: bed.status === 'occupied' ? `0 0 0 1px ${tc.border}` : 'none' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black" style={{ color: tc.accent }}>{bed.id}</span>
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: bed.status === 'available' ? '#dcfce7' : '#fee2e2', color: bed.status === 'available' ? '#16a34a' : '#dc2626' }}>{bed.status === 'available' ? '● Free' : '● Occupied'}</span>
                      </div>
                      {bed.patient ? (<>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: `${tc.accent}15`, color: tc.accent }}>{bed.patient.split(' ').map(w => w[0]).join('').substring(0, 2)}</div>
                          <div className="min-w-0"><div className="text-[11px] font-bold truncate" style={{ color: 'var(--heart-text)' }}>{bed.patient}</div>{bed.doctor && <div className="text-[9px] truncate" style={{ color: 'var(--heart-text-muted)' }}>👨‍⚕️ {bed.doctor}</div>}</div>
                        </div>
                        <button onClick={() => dischargeBed(bed.id)} className="w-full py-1.5 rounded-lg text-[9px] font-semibold transition-all opacity-70 group-hover:opacity-100" style={{ background: '#fee2e2', color: '#dc2626' }}>Discharge</button>
                      </>) : (
                        <button onClick={() => { setAssignModal(bed.id); setAssignName(''); setAssignDoc(''); }} className="w-full py-2 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90" style={{ background: tc.accent }}>Assign Bed</button>
                      )}
                    </div>
                  ))}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════════ ED PATIENTS PAGE ════════ */}
        {activePage === 'ED Patients' && (
          <div className="card p-5">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--heart-text)' }}><Truck className="h-4 w-4" style={{ color: '#f59e0b' }} /> Patients Received from ED</h2>
            <div className="space-y-2">{edPatients.map((p, i) => { const tc = sevColor(p.triage); return (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: p.assigned ? '#f0fdf4' : 'var(--heart-surface)', border: `1px solid ${p.assigned ? '#bbf7d0' : 'var(--heart-border-light)'}` }}>
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: tc.bg, color: tc.color }}>{p.name.charAt(0)}</div><div><div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{p.name} <span className="font-normal" style={{ color: 'var(--heart-text-muted)' }}>({p.age}, {p.gender})</span></div><div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{p.complaint}</div></div></div>
                <div className="flex items-center gap-2"><span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: tc.bg, color: tc.color }}>{p.triage}</span><span className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{p.time}</span>
                  {!p.assigned ? (<>
                    <button onClick={() => { const icuBed = beds.find(b => b.type === 'ICU' && b.status === 'available'); if (icuBed) { setAssignModal(icuBed.id); setAssignName(p.name); setAssignDoc(''); } else { alert('No ICU beds available'); } }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: '#dc2626' }}><BedDouble className="h-3 w-3" /> Assign to ICU</button>
                    <button onClick={() => assignED(i)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: '#1e293b' }}><UserCheck className="h-3 w-3" /> Assign</button>
                  </>) : <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#16a34a' }}><CheckCircle className="h-3.5 w-3.5" /> Assigned</span>}
                </div>
              </div>
            ); })}</div>
          </div>
        )}

        {/* Assign Bed Modal */}
        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="card p-6 w-96 mx-4" style={{ background: 'var(--heart-surface)' }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--heart-text)' }}>Assign Bed {assignModal}</h3>
              <div className="space-y-3">
                <div><label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--heart-text-muted)' }}>Patient Name *</label><input type="text" value={assignName} onChange={e => setAssignName(e.target.value)} placeholder="Enter patient name" className="w-full text-xs p-2.5 rounded-lg outline-none" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }} /></div>
                <div><label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--heart-text-muted)' }}>Assigned Doctor</label><select value={assignDoc} onChange={e => setAssignDoc(e.target.value)} className="w-full text-xs p-2.5 rounded-lg outline-none" style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }}><option value="">Select doctor...</option>{specialists.filter(s => s.status === 'available').map(s => <option key={s.name} value={s.name}>{s.name} — {s.dept}</option>)}</select></div>
              </div>
              <div className="flex items-center gap-2 mt-5"><button onClick={() => setAssignModal(null)} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ border: '1px solid var(--heart-border)', color: 'var(--heart-text-secondary)' }}>Cancel</button><button onClick={() => assignBed(assignModal)} className="flex-1 py-2 rounded-lg text-xs font-bold text-white" style={{ background: assignName.trim() ? '#1e293b' : '#9ca3af' }}>Assign</button></div>
            </div>
          </div>
        )}
      </div>
  );
}
