// src/pages/Dashboard.js — Premium MedNex Dashboard
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientAPI, appointmentAPI, medicalRecordAPI, analyticsAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import PatientForm from './PatientForm';
import AppointmentForm from './AppointmentForm';
import './Dashboard.css';

const COLORS = ['#00d4ff','#00e5a0','#f59e0b','#f43f5e','#a78bfa','#fb923c'];

const SAMPLE_BED_DATA = [
  { department:'Cardiology',  totalBeds:30, occupiedBeds:22, availableBeds:8,  occupancyRate:73 },
  { department:'Neurology',   totalBeds:20, occupiedBeds:15, availableBeds:5,  occupancyRate:75 },
  { department:'Pediatrics',  totalBeds:25, occupiedBeds:12, availableBeds:13, occupancyRate:48 },
  { department:'Orthopedics', totalBeds:35, occupiedBeds:28, availableBeds:7,  occupancyRate:80 },
  { department:'ICU',         totalBeds:15, occupiedBeds:12, availableBeds:3,  occupancyRate:80 },
  { department:'Emergency',   totalBeds:20, occupiedBeds:16, availableBeds:4,  occupancyRate:80 },
];
const SAMPLE_TREND = [
  { date:'Mon', rate:65 },{ date:'Tue', rate:68 },{ date:'Wed', rate:72 },
  { date:'Thu', rate:70 },{ date:'Fri', rate:75 },{ date:'Sat', rate:73 },{ date:'Sun', rate:68 },
];
const SAMPLE_PATIENTS = [
  { id:1,firstName:'John',lastName:'Doe',patientId:'P001',gender:'MALE',patientStatus:'ACTIVE',city:'Mumbai',primaryDoctorName:'Dr. Smith' },
  { id:2,firstName:'Jane',lastName:'Smith',patientId:'P002',gender:'FEMALE',patientStatus:'ACTIVE',city:'Delhi',primaryDoctorName:'Dr. Johnson' },
  { id:3,firstName:'Robert',lastName:'Brown',patientId:'P003',gender:'MALE',patientStatus:'ACTIVE',city:'Pune',primaryDoctorName:'Dr. Williams' },
];
const SAMPLE_APPTS = [
  { id:1,patientName:'John Doe',doctorName:'Dr. Smith',appointmentDate:new Date().toISOString().split('T')[0],appointmentTime:'09:00',status:'CONFIRMED',department:'Cardiology',appointmentType:'CONSULTATION' },
  { id:2,patientName:'Jane Smith',doctorName:'Dr. Johnson',appointmentDate:new Date().toISOString().split('T')[0],appointmentTime:'10:30',status:'SCHEDULED',department:'Neurology',appointmentType:'FOLLOW_UP' },
  { id:3,patientName:'Robert Brown',doctorName:'Dr. Williams',appointmentDate:new Date().toISOString().split('T')[0],appointmentTime:'14:00',status:'CONFIRMED',department:'Orthopedics',appointmentType:'CHECKUP' },
];

const STATUS_BADGE = { SCHEDULED:'info', CONFIRMED:'success', CANCELLED:'danger', COMPLETED:'muted', NO_SHOW:'warning' };
const GENDER_COLOR = { MALE:'#00d4ff', FEMALE:'#f43f5e', OTHER:'#a78bfa', PREFER_NOT_TO_SAY:'#4e6490' };

export default function Dashboard() {
  const { user, tenant } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPatientForm, setShowPatientForm]     = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  const [stats, setStats] = useState({ totalPatients:0, todayAppointments:0, totalRecords:0, availableBeds:0, occupancyRate:0 });
  const [patients, setPatients]   = useState([]);
  const [appointments, setAppts] = useState([]);
  const [bedData, setBedData]     = useState([]);
  const [trendData, setTrend]     = useState([]);
  const [genderData, setGender]   = useState([]);

  const loadData = useCallback(async (silent=false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      let pats=[], appts=[], recs=[], beds=SAMPLE_BED_DATA, trend=SAMPLE_TREND;
      try { const r=await patientAPI.getAll(); pats=r.data||[]; } catch { pats=SAMPLE_PATIENTS; }
      try { const r=await appointmentAPI.getAll(); appts=r.data||[]; } catch { appts=SAMPLE_APPTS; }
      try { const r=await medicalRecordAPI.getAll(); recs=r.data||[]; } catch { recs=[]; }
      try { const r=await analyticsAPI.getBedOccupancy(); beds=r.data||SAMPLE_BED_DATA; } catch {}
      try { const r=await analyticsAPI.getTrend(); trend=r.data||SAMPLE_TREND; } catch {}

      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appts.filter(a => a.appointmentDate === today);
      const avail = beds.reduce((s,b) => s + (b.availableBeds||0), 0);
      const total = beds.reduce((s,b) => s + (b.totalBeds||0), 0);
      const occ = total ? Math.round(beds.reduce((s,b)=>s+(b.occupiedBeds||0),0)*100/total) : 0;

      setStats({ totalPatients:pats.length, todayAppointments:todayAppts.length, totalRecords:recs.length, availableBeds:avail, occupancyRate:occ });
      setPatients(pats.slice(0,5));
      setAppts(todayAppts.slice(0,5));
      setBedData(beds);
      setTrend(trend);

      // Gender distribution
      const gm = {};
      pats.forEach(p => { const g=p.gender||'UNKNOWN'; gm[g]=(gm[g]||0)+1; });
      setGender(Object.entries(gm).map(([name,value])=>({ name, value })));
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = user?.firstName || user?.username || 'Doctor';

  if (loading) return (
    <div className="loading-center" style={{height:'60vh'}}>
      <div className="spinner" />
      <span style={{color:'var(--text-muted)'}}>Loading dashboard…</span>
    </div>
  );

  return (
    <div className="dashboard">

      {/* Welcome Banner */}
      <div className="dash-welcome">
        <div className="dash-welcome-text">
          <div className="dash-greeting">{greeting()}, {userName} 👋</div>
          <div className="dash-date-info">
            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            {refreshing && <span className="dash-refreshing">↻ Refreshing…</span>}
          </div>
        </div>
        <div className="dash-welcome-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowPatientForm(true)}>+ New Patient</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAppointmentForm(true)}>+ Appointment</button>
          <button className="btn btn-ghost btn-sm" onClick={() => loadData(true)}>↺ Refresh</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4 mb-24">
        <div className="stat-card" style={{'--accent':'#00d4ff'}}>
          <div className="stat-icon" style={{background:'rgba(0,212,255,0.1)'}}>👥</div>
          <div className="stat-value">{stats.totalPatients.toLocaleString()}</div>
          <div className="stat-label">Total Patients</div>
          <div className="stat-change up">▲ Active records</div>
        </div>
        <div className="stat-card" style={{'--accent':'#f59e0b'}}>
          <div className="stat-icon" style={{background:'rgba(245,158,11,0.1)'}}>📅</div>
          <div className="stat-value">{stats.todayAppointments}</div>
          <div className="stat-label">Today's Appointments</div>
          <div className="stat-change up">Scheduled today</div>
        </div>
        <div className="stat-card" style={{'--accent':'#a78bfa'}}>
          <div className="stat-icon" style={{background:'rgba(167,139,250,0.1)'}}>📋</div>
          <div className="stat-value">{stats.totalRecords}</div>
          <div className="stat-label">Medical Records</div>
          <div className="stat-change up">EMR entries</div>
        </div>
        <div className="stat-card" style={{'--accent':'#00e5a0'}}>
          <div className="stat-icon" style={{background:'rgba(0,229,160,0.1)'}}>🛏️</div>
          <div className="stat-value">{stats.occupancyRate}%</div>
          <div className="stat-label">Bed Occupancy</div>
          <div className={`stat-change ${stats.occupancyRate > 80 ? 'down' : 'up'}`}>
            {stats.availableBeds} beds available
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dash-charts-row mb-24">

        {/* Bed Occupancy Bar Chart */}
        <div className="card dash-chart-card">
          <div className="card-header">
            <span className="card-title">🛏️ Bed Occupancy by Department</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')}>View All ›</button>
          </div>
          <div className="card-body" style={{padding:'16px 16px 20px'}}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bedData} margin={{top:0,right:0,bottom:0,left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="department" tick={{fill:'var(--text-muted)',fontSize:10}} tickLine={false} axisLine={false}
                  tickFormatter={v=>v.substring(0,5)} />
                <YAxis tick={{fill:'var(--text-muted)',fontSize:10}} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'12px'}}
                  labelStyle={{color:'var(--text-primary)',fontWeight:600}}
                />
                <Bar dataKey="occupiedBeds" name="Occupied" fill="#00d4ff" radius={[4,4,0,0]} />
                <Bar dataKey="availableBeds" name="Available" fill="rgba(0,229,160,0.4)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Trend */}
        <div className="card dash-chart-card">
          <div className="card-header">
            <span className="card-title">📈 Occupancy Trend (7 Days)</span>
          </div>
          <div className="card-body" style={{padding:'16px 16px 20px'}}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{top:5,right:0,bottom:0,left:-20}}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{fill:'var(--text-muted)',fontSize:11}} tickLine={false} axisLine={false} />
                <YAxis tick={{fill:'var(--text-muted)',fontSize:10}} tickLine={false} axisLine={false} domain={[0,100]} />
                <Tooltip
                  contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'12px'}}
                  formatter={v=>[`${v}%`,'Occupancy']}
                />
                <Area type="monotone" dataKey="rate" stroke="#00d4ff" strokeWidth={2} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="card dash-chart-card dash-chart-sm">
          <div className="card-header">
            <span className="card-title">👥 Patient Demographics</span>
          </div>
          <div className="card-body" style={{padding:'16px',display:'flex',flexDirection:'column',alignItems:'center'}}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={genderData.length ? genderData : [{name:'No Data',value:1}]}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {(genderData.length ? genderData : [{name:'No Data'}]).map((e,i) => (
                    <Cell key={i} fill={GENDER_COLOR[e.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'12px'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center'}}>
              {genderData.map((g,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',color:'var(--text-secondary)'}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:GENDER_COLOR[g.name]||COLORS[i%COLORS.length]}} />
                  {g.name} ({g.value})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Patients + Today's Appointments */}
      <div className="dash-tables-row">

        {/* Recent Patients */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">👥 Recent Patients</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/patients')}>View All ›</button>
          </div>
          <div className="table-wrapper">
            {patients.length === 0 ? (
              <div className="empty-state" style={{padding:'40px'}}>
                <div className="empty-icon">👤</div>
                <p>No patients found</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Patient</th><th>ID</th><th>Doctor</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="info-cell">
                          <div className="avatar avatar-sm" style={{background:p.gender==='FEMALE'?'#f43f5e':'#00d4ff'}}>
                            {p.firstName?.charAt(0)}
                          </div>
                          <div>
                            <div className="info-name">{p.firstName} {p.lastName}</div>
                            <div className="info-sub">{p.city || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="text-muted fs-12">{p.patientId}</span></td>
                      <td><span style={{fontSize:12,color:'var(--text-secondary)'}}>{p.primaryDoctorName||'—'}</span></td>
                      <td><span className={`badge badge-${p.patientStatus==='ACTIVE'?'success':'muted'}`}>{p.patientStatus}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/patients/${p.id}`)}>›</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📅 Today's Schedule</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/appointments')}>View All ›</button>
          </div>
          <div className="table-wrapper">
            {appointments.length === 0 ? (
              <div className="empty-state" style={{padding:'40px'}}>
                <div className="empty-icon">📅</div>
                <p>No appointments today</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Patient</th><th>Time</th><th>Type</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div>
                          <div className="info-name">{a.patientName}</div>
                          <div className="info-sub">{a.doctorName}</div>
                        </div>
                      </td>
                      <td><span style={{fontWeight:600,color:'var(--text-primary)',fontSize:13}}>{a.appointmentTime}</span></td>
                      <td><span style={{fontSize:11,color:'var(--text-muted)'}}>{a.appointmentType||'—'}</span></td>
                      <td><span className={`badge badge-${STATUS_BADGE[a.status]||'muted'}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dash-quick-actions mt-24">
        <div className="section-divider">Quick Actions</div>
        <div className="grid-4">
          {[
            { icon:'👤', label:'Register Patient',    action:()=>setShowPatientForm(true),       color:'#00d4ff' },
            { icon:'📅', label:'Book Appointment',   action:()=>setShowAppointmentForm(true),   color:'#f59e0b' },
            { icon:'📋', label:'Medical Records',    action:()=>navigate('/medical-records'),   color:'#a78bfa' },
            { icon:'📊', label:'Analytics Report',   action:()=>navigate('/analytics'),         color:'#00e5a0' },
          ].map(q => (
            <button key={q.label} className="dash-quick-btn" onClick={q.action} style={{'--qa-color':q.color}}>
              <span className="qa-icon">{q.icon}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showPatientForm && (
        <PatientForm onClose={() => setShowPatientForm(false)} onSaved={() => { setShowPatientForm(false); loadData(true); toast.success('Patient registered!'); }} />
      )}
      {showAppointmentForm && (
        <AppointmentForm onClose={() => setShowAppointmentForm(false)} onSaved={() => { setShowAppointmentForm(false); loadData(true); toast.success('Appointment booked!'); }} />
      )}
    </div>
  );
}
