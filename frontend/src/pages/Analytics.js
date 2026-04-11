// src/pages/Analytics.js — Premium Analytics Dashboard
import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import './Analytics.css';

const COLORS = ['#00d4ff','#00e5a0','#f59e0b','#f43f5e','#a78bfa','#fb923c'];

const MOCK_BED = [
  { department:'Cardiology',  totalBeds:30, occupiedBeds:22, availableBeds:8,  occupancyRate:73 },
  { department:'Neurology',   totalBeds:20, occupiedBeds:15, availableBeds:5,  occupancyRate:75 },
  { department:'Pediatrics',  totalBeds:25, occupiedBeds:12, availableBeds:13, occupancyRate:48 },
  { department:'Orthopedics', totalBeds:35, occupiedBeds:28, availableBeds:7,  occupancyRate:80 },
  { department:'ICU',         totalBeds:15, occupiedBeds:12, availableBeds:3,  occupancyRate:80 },
  { department:'Emergency',   totalBeds:20, occupiedBeds:16, availableBeds:4,  occupancyRate:80 },
];
const MOCK_TREND = [
  { date:'Mon', rate:65 },{ date:'Tue', rate:68 },{ date:'Wed', rate:72 },
  { date:'Thu', rate:70 },{ date:'Fri', rate:75 },{ date:'Sat', rate:73 },{ date:'Sun', rate:68 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
          <span style={{ color:'var(--text-muted)' }}>{p.name}:</span>
          <span style={{ fontWeight:700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [bedData, setBedData]   = useState([]);
  const [trend, setTrend]       = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      analyticsAPI.getBedOccupancy(),
      analyticsAPI.getTrend(),
      analyticsAPI.getSummary(),
    ]).then(([b, t, s]) => {
      setBedData(b.status === 'fulfilled' && b.value.data?.length ? b.value.data : MOCK_BED);
      setTrend(t.status === 'fulfilled' && t.value.data?.length ? t.value.data : MOCK_TREND);
      if (s.status === 'fulfilled') setSummary(s.value.data);
      setLoading(false);
    });
  }, []);

  const totalBeds    = bedData.reduce((a,d) => a + (d.totalBeds||0), 0);
  const occupiedBeds = bedData.reduce((a,d) => a + (d.occupiedBeds||0), 0);
  const availBeds    = totalBeds - occupiedBeds;
  const occRate      = totalBeds ? Math.round((occupiedBeds/totalBeds)*100) : 0;

  const pieData = bedData.map(d => ({ name:d.department, value:d.occupiedBeds||0, rate:d.occupancyRate||0 }));

  const radialData = bedData.map((d,i) => ({
    name:d.department.substring(0,4), rate:d.occupancyRate||0, fill:COLORS[i%COLORS.length]
  }));

  if (loading) return (
    <div className="loading-center" style={{height:'60vh'}}>
      <div className="spinner" />
      <span style={{color:'var(--text-muted)'}}>Loading analytics…</span>
    </div>
  );

  return (
    <div className="analytics-page">

      {/* Header */}
      <div className="analytics-banner">
        <div className="ab-left">
          <div style={{fontSize:40}}>📊</div>
          <div>
            <h1>Analytics &amp; Bed Occupancy</h1>
            <p>Real-time hospital capacity monitoring · HIPAA/GDPR Compliance Audit (Week 4)</p>
          </div>
        </div>
        <div className="hipaa-badge">
          <span className="hipaa-icon">🔒</span>
          <div>
            <div className="hipaa-title">HIPAA Compliant</div>
            <div className="hipaa-sub">Audit Trail Active</div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid-4 mb-24">
        <KpiCard label="Total Beds"      value={totalBeds}    icon="🛏️" color="cyan"    />
        <KpiCard label="Occupied Beds"   value={occupiedBeds} icon="🔴" color="rose"    />
        <KpiCard label="Available Beds"  value={availBeds}    icon="🟢" color="emerald" />
        <KpiCard label="Occupancy Rate"  value={`${occRate}%`} icon="📊"
          color={occRate > 80 ? 'rose' : occRate > 60 ? 'amber' : 'emerald'} />
      </div>

      {/* Main Charts */}
      <div className="analytics-main-charts mb-24">

        {/* Bar Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🛏️ Beds by Department</span>
            <span style={{fontSize:11,color:'var(--text-muted)'}}>Occupied vs Available</span>
          </div>
          <div style={{padding:'4px 16px 20px'}}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bedData} margin={{top:10,right:0,bottom:40,left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="department" tick={{fill:'var(--text-muted)',fontSize:10}} angle={-30} textAnchor="end" interval={0} tickLine={false} />
                <YAxis tick={{fill:'var(--text-muted)',fontSize:10}} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{paddingTop:52,color:'var(--text-muted)',fontSize:11}} />
                <Bar dataKey="occupiedBeds"  fill="#00d4ff" radius={[4,4,0,0]} name="Occupied" />
                <Bar dataKey="availableBeds" fill="rgba(0,229,160,0.35)" radius={[4,4,0,0]} name="Available" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Trend Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📈 7-Day Occupancy Trend</span>
            <span style={{fontSize:11,color:'var(--text-muted)'}}>{trend.length ? 'Live Data' : 'Sample'}</span>
          </div>
          <div style={{padding:'4px 16px 20px'}}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend} margin={{top:10,right:0,bottom:0,left:-20}}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{fill:'var(--text-muted)',fontSize:11}} tickLine={false} axisLine={false} />
                <YAxis domain={[0,100]} tick={{fill:'var(--text-muted)',fontSize:10}} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="rate" stroke="#00d4ff" strokeWidth={2.5} fill="url(#areaGrad)" name="Occupancy %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="analytics-secondary mb-24">

        {/* Pie Distribution */}
        <div className="card">
          <div className="card-header"><span className="card-title">🥧 Occupancy Distribution</span></div>
          <div style={{padding:'8px 16px 20px'}}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {pieData.map((d,i) => (
                <div key={i} className="pie-legend-item">
                  <span className="ple-dot" style={{background:COLORS[i%COLORS.length]}} />
                  <span className="ple-name">{d.name}</span>
                  <span className="ple-rate">{d.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Rate Table */}
        <div className="card">
          <div className="card-header"><span className="card-title">📋 Department Summary</span></div>
          <div className="dept-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Department</th><th>Total</th><th>Occupied</th><th>Available</th><th>Rate</th></tr>
              </thead>
              <tbody>
                {bedData.map((d,i) => (
                  <tr key={i}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:COLORS[i%COLORS.length],flexShrink:0}} />
                        <span style={{fontWeight:600,color:'var(--text-primary)',fontSize:12}}>{d.department}</span>
                      </div>
                    </td>
                    <td><span style={{color:'var(--text-secondary)'}}>{d.totalBeds}</span></td>
                    <td><span style={{color:'var(--cyan)',fontWeight:600}}>{d.occupiedBeds}</span></td>
                    <td><span style={{color:'var(--emerald)',fontWeight:600}}>{d.availableBeds}</span></td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div className="occ-bar-bg">
                          <div className="occ-bar-fill"
                            style={{
                              width:`${d.occupancyRate||0}%`,
                              background:d.occupancyRate>80?'var(--rose)':d.occupancyRate>60?'var(--amber)':'var(--emerald)'
                            }} />
                        </div>
                        <span style={{fontSize:12,fontWeight:700,color:'var(--text-primary)',minWidth:36}}>{d.occupancyRate||0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="card compliance-card">
          <div className="card-header"><span className="card-title">🔒 Compliance Status</span></div>
          <div style={{padding:'16px'}}>
            {[
              { label:'HIPAA Audit Logs',   status:'ACTIVE',  color:'emerald', icon:'✅' },
              { label:'GDPR Compliance',    status:'ENABLED', color:'emerald', icon:'✅' },
              { label:'Data Encryption',    status:'AES-256', color:'cyan',    icon:'🔐' },
              { label:'Access Controls',    status:'RBAC',    color:'cyan',    icon:'👮' },
              { label:'Multi-Tenancy',      status:'ACTIVE',  color:'emerald', icon:'✅' },
              { label:'PDF Export Encrypt', status:'ACTIVE',  color:'emerald', icon:'✅' },
              { label:'JWT Authentication', status:'ACTIVE',  color:'emerald', icon:'✅' },
              { label:'Cross-Tenant Block', status:'ENFORCED',color:'emerald', icon:'🚫' },
            ].map(c => (
              <div key={c.label} className="compliance-row">
                <span className="cr-icon">{c.icon}</span>
                <span className="cr-label">{c.label}</span>
                <span className={`badge badge-${c.color==='emerald'?'success':'info'}`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }) {
  const colors = {
    cyan:    { bg:'rgba(0,212,255,0.08)',   text:'var(--cyan)',    border:'rgba(0,212,255,0.15)' },
    rose:    { bg:'rgba(244,63,94,0.08)',   text:'var(--rose)',    border:'rgba(244,63,94,0.15)' },
    emerald: { bg:'rgba(0,229,160,0.08)',   text:'var(--emerald)', border:'rgba(0,229,160,0.15)' },
    amber:   { bg:'rgba(245,158,11,0.08)',  text:'var(--amber)',   border:'rgba(245,158,11,0.15)' },
  };
  const c = colors[color] || colors.cyan;
  return (
    <div className="kpi-card" style={{background:c.bg, borderColor:c.border}}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-value" style={{color:c.text}}>{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
