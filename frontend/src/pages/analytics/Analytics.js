import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import './Analytics.css';

const COLORS = ['#00b4d8','#2ec4b6','#f4a261','#e63946','#7b2d8b','#06d6a0'];

export default function Analytics() {
  const [bedData, setBedData] = useState([]);
  const [trend, setTrend]     = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      analyticsAPI.getBedOccupancy(),
      analyticsAPI.getTrend(),
      analyticsAPI.getSummary(),
    ]).then(([b, t, s]) => {
      if (b.status === 'fulfilled') setBedData(b.value.data || []);
      if (t.status === 'fulfilled') setTrend(t.value.data || []);
      if (s.status === 'fulfilled') setSummary(s.value.data);
      setLoading(false);
    });
  }, []);

  const totalBeds     = bedData.reduce((a, d) => a + (d.totalBeds    || 0), 0);
  const occupiedBeds  = bedData.reduce((a, d) => a + (d.occupiedBeds || 0), 0);
  const occupancyRate = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const pieData = bedData.map(d => ({
    name: d.department,
    value: d.occupiedBeds || 0,
    rate: d.occupancyRate || 0,
  }));

  const displayTrend = trend.length ? trend : MOCK_TREND;

  return (
    <div className="analytics-page fade-in">
      {/* Hero */}
      <div className="analytics-hero card">
        <div>
          <h2>Analytics & Bed Occupancy Dashboard</h2>
          <p>Real-time hospital capacity monitoring · Week 4 HIPAA/GDPR Compliance</p>
        </div>
        <img src="https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=300&q=80" alt="Analytics" className="analytics-hero-img" />
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid grid-4">
        <KpiCard title="Total Beds"     value={totalBeds}    icon="🛏" color="teal" />
        <KpiCard title="Occupied Beds"  value={occupiedBeds} icon="🔴" color="danger" />
        <KpiCard title="Available Beds" value={totalBeds - occupiedBeds} icon="🟢" color="success" />
        <KpiCard title="Occupancy Rate" value={`${occupancyRate}%`} icon="📊" color={occupancyRate > 80 ? 'danger' : occupancyRate > 60 ? 'warning' : 'success'} />
      </div>

      {/* Department Charts */}
      <div className="analytics-charts-row">
        {/* Bar Chart */}
        <div className="card analytics-chart">
          <div className="chart-header">
            <h3>Bed Occupancy by Department</h3>
            <p>Occupied vs. available beds across all departments</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bedData} margin={{top:10,right:10,bottom:40,left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="department" tick={{ fill:'#8899b4', fontSize:10 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fill:'#8899b4', fontSize:11 }} />
              <Tooltip contentStyle={{ background:'#112240', border:'1px solid rgba(0,180,216,0.2)', borderRadius:8, color:'#e8edf5' }} />
              <Legend wrapperStyle={{ paddingTop:50, color:'#8899b4', fontSize:12 }} />
              <Bar dataKey="occupiedBeds"  fill="#00b4d8" radius={[4,4,0,0]} name="Occupied" />
              <Bar dataKey="availableBeds" fill="rgba(46,196,182,0.3)" radius={[4,4,0,0]} name="Available" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card analytics-chart analytics-chart-sm">
          <div className="chart-header">
            <h3>Occupancy Distribution</h3>
            <p>Share of beds by department</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} dataKey="value">
                {pieData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'#112240', border:'1px solid rgba(0,180,216,0.2)', borderRadius:8, color:'#e8edf5' }} formatter={(v,n,p) => [`${v} beds`, p.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {pieData.map((d,i) => (
              <div key={i} className="legend-item">
                <span className="legend-dot" style={{background:COLORS[i%COLORS.length]}}></span>
                <span>{d.name}</span>
                <span style={{color:'var(--teal)',marginLeft:'auto'}}>{d.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="card analytics-chart">
        <div className="chart-header">
          <h3>7-Day Occupancy Trend</h3>
          <p>Daily bed utilization pattern — helps predict capacity needs</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={displayTrend} margin={{top:10,right:20,bottom:0,left:-20}}>
            <defs>
              <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00b4d8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill:'#8899b4', fontSize:11 }} />
            <YAxis tick={{ fill:'#8899b4', fontSize:11 }} domain={[0,100]} tickFormatter={v=>`${v}%`} />
            <Tooltip contentStyle={{ background:'#112240', border:'1px solid rgba(0,180,216,0.2)', borderRadius:8, color:'#e8edf5' }} formatter={(v) => [`${v}%`, 'Occupancy Rate']} />
            <Area type="monotone" dataKey="occupancyRate" stroke="#00b4d8" strokeWidth={2} fill="url(#tealGrad)" name="Rate %" dot={{ fill:'#00b4d8', r:4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Department Table */}
      <div className="card">
        <div className="card-head">
          <h3>Department Occupancy Details</h3>
          <span className="badge badge-info">Live Data</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Department</th><th>Total Beds</th><th>Occupied</th><th>Available</th><th>Occupancy Rate</th><th>Status</th></tr>
            </thead>
            <tbody>
              {bedData.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text-muted)',padding:32}}>No bed data available</td></tr>
              ) : bedData.map((d,i) => {
                const rate = d.occupancyRate || Math.round(((d.occupiedBeds||0)/(d.totalBeds||1))*100);
                const status = rate >= 90 ? ['danger','Critical'] : rate >= 75 ? ['warning','High'] : rate >= 50 ? ['info','Moderate'] : ['success','Low'];
                return (
                  <tr key={i}>
                    <td style={{color:'var(--text-primary)',fontWeight:500}}>{d.department}</td>
                    <td>{d.totalBeds || '—'}</td>
                    <td style={{color:'var(--danger)'}}>{d.occupiedBeds || 0}</td>
                    <td style={{color:'var(--success)'}}>{(d.totalBeds||0)-(d.occupiedBeds||0)}</td>
                    <td>
                      <div className="rate-bar">
                        <div className="rate-fill" style={{width:`${rate}%`, background: rate>=90?'var(--danger)':rate>=75?'var(--warning)':'var(--teal)'}}></div>
                        <span>{rate}%</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${status[0]}`}>{status[1]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="compliance-card card">
        <div className="compliance-icon">🔒</div>
        <div>
          <h3>HIPAA / GDPR Compliance</h3>
          <p>All patient data is AES-128 encrypted. PDF exports are password-protected. Access logs are maintained for audit purposes. Unauthorized data disclosure is strictly prohibited.</p>
        </div>
      </div>
    </div>
  );
}

const KpiCard = ({ title, value, icon, color }) => (
  <div className={`kpi-card card color-${color}`}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-title">{title}</div>
  </div>
);

const MOCK_TREND = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({ date: d, occupancyRate: 45 + Math.round(Math.random()*40) }));
