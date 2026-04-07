import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, analyticsAPI } from '../../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const COLORS = ['#00b4d8','#2ec4b6','#f4a261','#e63946','#7b2d8b'];

export default function Dashboard() {
  const [stats, setStats]       = useState(null);
  const [recentPts, setRPts]    = useState([]);
  const [recentApts, setRApts]  = useState([]);
  const [bedData, setBedData]   = useState([]);
  const [trend, setTrend]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.allSettled([
      dashboardAPI.getStats(),
      dashboardAPI.getRecentPatients(),
      dashboardAPI.getRecentAppts(),
      analyticsAPI.getBedOccupancy(),
      analyticsAPI.getTrend(),
    ]).then(([s, rp, ra, bed, tr]) => {
      if (s.status === 'fulfilled')   setStats(s.value.data);
      if (rp.status === 'fulfilled')  setRPts(rp.value.data || []);
      if (ra.status === 'fulfilled')  setRApts(ra.value.data || []);
      if (bed.status === 'fulfilled') setBedData(bed.value.data || []);
      if (tr.status === 'fulfilled')  setTrend(tr.value.data || []);
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: 'Total Patients',     value: stats?.totalPatients     || 0, icon: '👤', color: 'teal',  path: '/patients' },
    { label: "Today's Appointments",value: stats?.todayAppointments || 0, icon: '📅', color: 'gold',  path: '/appointments' },
    { label: 'Active Records',     value: stats?.activeRecords     || 0, icon: '🏥', color: 'green', path: '/medical-records' },
    { label: 'Bed Occupancy',      value: `${stats?.bedOccupancyRate || 0}%`, icon: '🛏', color: 'orange', path: '/analytics' },
  ];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="dashboard fade-in">
      {/* Hero Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>Clinical Command Center</h1>
          <p>Real-time overview of hospital operations · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80"
          alt="Hospital" className="hero-img"
        />
      </div>

      {/* Stat Cards */}
      <div className="stat-cards grid-4">
        {statCards.map((c, i) => (
          <div key={i} className={`stat-card card color-${c.color}`} onClick={() => navigate(c.path)} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-arrow">→</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Bed Occupancy Bar */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3>Bed Occupancy by Department</h3>
              <p>Current capacity utilization</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bedData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="department" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#112240', border: '1px solid rgba(0,180,216,0.2)', borderRadius: 8, color: '#e8edf5' }} />
              <Bar dataKey="occupiedBeds" fill="#00b4d8" radius={[4,4,0,0]} name="Occupied" />
              <Bar dataKey="availableBeds" fill="rgba(0,180,216,0.2)" radius={[4,4,0,0]} name="Available" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Line */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3>7-Day Occupancy Trend</h3>
              <p>Daily bed utilization pattern</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend.length ? trend : MOCK_TREND} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#112240', border: '1px solid rgba(0,180,216,0.2)', borderRadius: 8, color: '#e8edf5' }} />
              <Line type="monotone" dataKey="occupancyRate" stroke="#00b4d8" strokeWidth={2} dot={{ fill: '#00b4d8', r: 4 }} name="Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie — Appointment Status */}
        <div className="card chart-card chart-sm">
          <div className="chart-header">
            <div><h3>Appt. Status</h3><p>Today's breakdown</p></div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={APT_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {APT_PIE.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#112240', border: '1px solid rgba(0,180,216,0.2)', borderRadius: 8, color: '#e8edf5' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {APT_PIE.map((d, i) => (
              <div key={i} className="legend-item">
                <span className="legend-dot" style={{ background: COLORS[i] }}></span>
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="tables-row">
        {/* Recent Patients */}
        <div className="card table-card">
          <div className="card-head">
            <h3>Recent Patients</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/patients')}>View All</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient</th><th>Status</th><th>Doctor</th><th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {recentPts.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No recent patients</td></tr>
                ) : recentPts.slice(0, 6).map((p, i) => (
                  <tr key={i} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="patient-cell">
                        <div className="mini-avatar">{(p.firstName || 'P').charAt(0)}</div>
                        <div>
                          <div className="cell-name">{p.firstName} {p.lastName}</div>
                          <div className="cell-sub">{p.patientId}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${statusColor(p.patientStatus)}`}>{p.patientStatus || 'Active'}</span></td>
                    <td style={{ color: 'var(--text-primary)' }}>{p.primaryDoctorName || '—'}</td>
                    <td>{p.registrationDate || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="card table-card">
          <div className="card-head">
            <h3>Upcoming Appointments</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/appointments')}>View All</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentApts.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No appointments</td></tr>
                ) : recentApts.slice(0, 6).map((a, i) => (
                  <tr key={i}>
                    <td>
                      <div className="patient-cell">
                        <div className="mini-avatar" style={{ background: 'var(--gold)' }}>{(a.patientName || 'P').charAt(0)}</div>
                        <span className="cell-name">{a.patientName}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{a.doctorName}</td>
                    <td>{a.appointmentTime}</td>
                    <td><span className={`badge badge-${apptColor(a.status)}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_TREND = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => ({ date: d, occupancyRate: 55 + Math.round(Math.random()*30) }));
const APT_PIE = [
  { name: 'Scheduled', value: 40 },
  { name: 'Confirmed', value: 30 },
  { name: 'Completed', value: 20 },
  { name: 'Cancelled', value: 10 },
];
const statusColor = s => ({ ACTIVE:'success', INACTIVE:'muted', DISCHARGED:'warning', DECEASED:'danger' }[s] || 'info');
const apptColor   = s => ({ SCHEDULED:'info', CONFIRMED:'success', CANCELLED:'danger', COMPLETED:'muted', NO_SHOW:'warning' }[s] || 'muted');

function DashboardSkeleton() {
  return (
    <div className="dashboard">
      <div className="skeleton" style={{ height: 160, borderRadius: 16, marginBottom: 24 }}></div>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }}></div>)}
      </div>
    </div>
  );
}
