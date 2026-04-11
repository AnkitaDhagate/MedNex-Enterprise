// src/pages/Appointments.js — Premium Appointments
import React, { useEffect, useState, useCallback } from 'react';
import { appointmentAPI } from '../services/api';
import { toast } from 'react-toastify';
import AppointmentForm from './AppointmentForm';
import './Appointments.css';

const STATUS_COLOR = { SCHEDULED:'info', CONFIRMED:'success', CANCELLED:'danger', COMPLETED:'muted', NO_SHOW:'warning', IN_PROGRESS:'violet' };
const TYPE_COLOR   = { CONSULTATION:'#00d4ff', FOLLOW_UP:'#00e5a0', EMERGENCY:'#f43f5e', SURGERY:'#a78bfa', CHECKUP:'#f59e0b' };

const formatDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
const todayStr = () => new Date().toISOString().split('T')[0];

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editAppt, setEdit]       = useState(null);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('ALL');
  const [dateFilter, setDate]     = useState('');
  const [view, setView]           = useState('list');

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const r = await appointmentAPI.getAll();
      setAppointments(r.data || []);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  useEffect(() => {
    let data = [...appointments];
    if (search) data = data.filter(a => `${a.patientName} ${a.doctorName} ${a.department||''}`.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'ALL') data = data.filter(a => a.status === statusFilter);
    if (dateFilter) data = data.filter(a => a.appointmentDate === dateFilter);
    setFiltered(data);
  }, [appointments, search, statusFilter, dateFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try { await appointmentAPI.cancel(id); toast.success('Appointment cancelled'); loadAppointments(); }
    catch (e) { toast.error(e.response?.data?.error || 'Cancel failed'); }
  };

  const grouped = filtered.reduce((acc, a) => {
    const d = a.appointmentDate || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(a);
    return acc;
  }, {});

  const today = todayStr();
  const todayCount     = appointments.filter(a => a.appointmentDate === today).length;
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
  const scheduledCount = appointments.filter(a => a.status === 'SCHEDULED').length;
  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

  return (
    <div className="appointments-page">

      {/* Header */}
      <div className="appt-banner">
        <div className="appt-banner-content">
          <div className="banner-icon-wrap">📅</div>
          <div>
            <h1>Appointment Scheduler</h1>
            <p>Doctor bookings with automatic double-booking conflict detection</p>
          </div>
        </div>
        <div className="appt-kpis">
          <div className="appt-kpi"><div className="akpi-val">{todayCount}</div><div className="akpi-lbl">Today</div></div>
          <div className="appt-kpi akpi-confirmed"><div className="akpi-val">{confirmedCount}</div><div className="akpi-lbl">Confirmed</div></div>
          <div className="appt-kpi akpi-scheduled"><div className="akpi-val">{scheduledCount}</div><div className="akpi-lbl">Scheduled</div></div>
          <div className="appt-kpi"><div className="akpi-val">{completedCount}</div><div className="akpi-lbl">Completed</div></div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEdit(null); setShowForm(true); }}>
          ＋ Book Appointment
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div style={{position:'relative',flex:1,minWidth:220}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none'}}>🔍</span>
            <input className="form-control" style={{paddingLeft:38}}
              placeholder="Search patient, doctor, department…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input type="date" className="form-control" style={{width:160}} value={dateFilter} onChange={e => setDate(e.target.value)} />
          <select className="form-control" style={{width:150}} value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            {['SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <button className={`vt-btn ${view==='list'?'active':''}`} onClick={() => setView('list')}>≡ List</button>
            <button className={`vt-btn ${view==='calendar'?'active':''}`} onClick={() => setView('calendar')}>📅 Timeline</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={loadAppointments}>↺</button>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="card">
          {loading ? (
            <div style={{padding:20}}>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{height:54,marginBottom:8,borderRadius:8}} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No appointments found</h3>
              <p>{search ? `No results for "${search}"` : 'Book your first appointment to get started'}</p>
              {!search && <button className="btn btn-primary" onClick={() => { setEdit(null); setShowForm(true); }}>+ Book Now</button>}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th><th>Doctor</th><th>Department</th>
                    <th>Date</th><th>Time</th><th>Type</th><th>Urgency</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} className={a.status === 'CANCELLED' ? 'row-cancelled' : ''}>
                      <td>
                        <div className="info-cell">
                          <div className="avatar avatar-sm" style={{background:'#f59e0b',color:'#000'}}>
                            {(a.patientName||'P').charAt(0)}
                          </div>
                          <div className="info-name">{a.patientName||'—'}</div>
                        </div>
                      </td>
                      <td><span style={{fontSize:13,color:'var(--text-secondary)'}}>{a.doctorName||'—'}</span></td>
                      <td><span style={{fontSize:12,color:'var(--text-muted)'}}>{a.department||'—'}</span></td>
                      <td><span style={{fontSize:12,color:'var(--text-secondary)'}}>{a.appointmentDate}</span></td>
                      <td>
                        <span className="time-pill">{a.appointmentTime||'—'}</span>
                      </td>
                      <td>
                        <span className="type-pill" style={{color:TYPE_COLOR[a.appointmentType]||'var(--text-muted)'}}>
                          {a.appointmentType||'—'}
                        </span>
                      </td>
                      <td>
                        {a.urgencyLevel ? (
                          <span className={`badge badge-${a.urgencyLevel==='HIGH'||a.urgencyLevel==='EMERGENCY'?'danger':a.urgencyLevel==='MEDIUM'?'warning':'muted'}`}>
                            {a.urgencyLevel}
                          </span>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <span className={`badge badge-${STATUS_COLOR[a.status]||'muted'}`}>{a.status}</span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEdit(a); setShowForm(true); }}>✏️</button>
                          {!['CANCELLED','COMPLETED'].includes(a.status) && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(a.id)}>✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Timeline / Calendar View */}
      {view === 'calendar' && (
        <div className="timeline-view">
          {Object.keys(grouped).length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">📅</div>
              <h3>No appointments to display</h3>
              <p>Try removing filters or book a new appointment</p>
            </div>
          ) : (
            Object.entries(grouped)
              .sort(([a],[b]) => a.localeCompare(b))
              .map(([date, appts]) => (
                <div key={date} className="day-section">
                  <div className="day-header">
                    <div className={`day-dot ${date === today ? 'today' : ''}`} />
                    <div className="day-label-text">
                      <span className="day-formatted">{formatDate(date)}</span>
                      {date === today && <span className="today-badge">TODAY</span>}
                    </div>
                    <span className="day-count">{appts.length} appt{appts.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="day-cards">
                    {appts
                      .sort((a,b) => (a.appointmentTime||'').localeCompare(b.appointmentTime||''))
                      .map((a, i) => (
                        <div key={i} className={`appt-card ${a.status === 'CANCELLED' ? 'cancelled' : ''}`}
                          style={{'--card-accent': TYPE_COLOR[a.appointmentType]||'var(--cyan)'}}>
                          <div className="ac-time">{a.appointmentTime||'—'}</div>
                          <div className="ac-body">
                            <div className="ac-patient">{a.patientName}</div>
                            <div className="ac-doctor">{a.doctorName} · {a.department||'—'}</div>
                            {a.reasonForVisit && <div className="ac-reason">{a.reasonForVisit}</div>}
                          </div>
                          <div className="ac-right">
                            <span className={`badge badge-${STATUS_COLOR[a.status]||'muted'}`}>{a.status}</span>
                            {!['CANCELLED','COMPLETED'].includes(a.status) && (
                              <button className="btn btn-danger btn-sm" style={{marginTop:8}} onClick={() => handleCancel(a.id)}>Cancel</button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {showForm && (
        <AppointmentForm
          appointment={editAppt}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadAppointments(); toast.success(editAppt ? 'Appointment updated!' : 'Appointment booked!'); }}
        />
      )}
    </div>
  );
}
