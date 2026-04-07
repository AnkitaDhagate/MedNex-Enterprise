import React, { useEffect, useState } from 'react';
import { appointmentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import AppointmentForm from './AppointmentForm';
import './Appointments.css';

const STATUS_COLOR = { SCHEDULED:'info', CONFIRMED:'success', CANCELLED:'danger', COMPLETED:'muted', NO_SHOW:'warning' };

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editAppt, setEdit]             = useState(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatus]       = useState('ALL');
  const [selectedDate, setDate]         = useState('');
  const [view, setView]                 = useState('list'); // list | calendar

  const load = () => {
    setLoading(true);
    appointmentAPI.getAll()
      .then(r => { setAppointments(r.data || []); })
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let data = [...appointments];
    if (search)        data = data.filter(a => `${a.patientName} ${a.doctorName}`.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'ALL') data = data.filter(a => a.status === statusFilter);
    if (selectedDate)  data = data.filter(a => a.appointmentDate === selectedDate);
    setFiltered(data);
  }, [appointments, search, statusFilter, selectedDate]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await appointmentAPI.cancel(id);
      toast.success('Appointment cancelled');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Cancel failed'); }
  };

  // Group by date for calendar view
  const grouped = filtered.reduce((acc, a) => {
    const d = a.appointmentDate;
    if (!acc[d]) acc[d] = [];
    acc[d].push(a);
    return acc;
  }, {});

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter(a => a.appointmentDate === todayStr).length;
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
  const pendingCount   = appointments.filter(a => a.status === 'SCHEDULED').length;

  return (
    <div className="appointments-page fade-in">
      {/* Header Banner */}
      <div className="appt-hero card">
        <div className="appt-hero-text">
          <h2>Appointment Scheduler</h2>
          <p>Manage doctor bookings with automatic conflict detection</p>
          <div className="appt-summary">
            <div className="sum-item"><span className="sum-num">{todayCount}</span><span>Today</span></div>
            <div className="sum-item"><span className="sum-num" style={{color:'var(--success)'}}>{confirmedCount}</span><span>Confirmed</span></div>
            <div className="sum-item"><span className="sum-num" style={{color:'var(--info)'}}>{pendingCount}</span><span>Scheduled</span></div>
            <div className="sum-item"><span className="sum-num">{appointments.length}</span><span>Total</span></div>
          </div>
        </div>
        <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=320&q=80" alt="Appointments" className="appt-hero-img" />
      </div>

      {/* Controls */}
      <div className="appt-controls card">
        <input className="form-control" placeholder="🔍 Search patient or doctor…" value={search} onChange={e => setSearch(e.target.value)} style={{flex:1}} />
        <input type="date" className="form-control" value={selectedDate} onChange={e => setDate(e.target.value)} style={{width:160}} />
        <select className="form-control" value={statusFilter} onChange={e => setStatus(e.target.value)} style={{width:160}}>
          <option value="ALL">All Statuses</option>
          {['SCHEDULED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW'].map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="view-toggle">
          <button className={`toggle-btn ${view==='list'?'active':''}`} onClick={()=>setView('list')}>≡ List</button>
          <button className={`toggle-btn ${view==='calendar'?'active':''}`} onClick={()=>setView('calendar')}>📅 Calendar</button>
        </div>
        <button className="btn btn-primary" onClick={() => { setEdit(null); setShowForm(true); }}>+ Book Appointment</button>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="card">
          {loading ? (
            <div className="loading-rows">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{height:52,margin:'8px 16px',borderRadius:8}}></div>)}</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Patient</th><th>Doctor</th><th>Department</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="empty-row">No appointments found</td></tr>
                  ) : filtered.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="patient-cell">
                          <div className="mini-avatar" style={{background:'linear-gradient(135deg,#f4a261,#e76f51)'}}>{(a.patientName||'P').charAt(0)}</div>
                          <div>
                            <div className="cell-name">{a.patientName}</div>
                            <div className="cell-sub">{a.appointmentId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{color:'var(--text-primary)'}}>{a.doctorName}</td>
                      <td>{a.department || '—'}</td>
                      <td>{a.appointmentDate}</td>
                      <td><span className="time-chip">{a.appointmentTime}</span></td>
                      <td><span className="type-chip">{a.appointmentType || 'IN_PERSON'}</span></td>
                      <td><span className={`badge badge-${STATUS_COLOR[a.status]||'muted'}`}>{a.status}</span></td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEdit(a); setShowForm(true); }}>Edit</button>
                          {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(a.id)}>Cancel</button>
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

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="calendar-view">
          {Object.keys(grouped).length === 0 ? (
            <div className="card empty-state">
              <span>📅</span><p>No appointments to display</p>
            </div>
          ) : Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([date, appts]) => (
            <div key={date} className="day-group">
              <div className="day-label">
                <span className={`day-dot ${date === todayStr ? 'today' : ''}`}></span>
                <strong>{formatDate(date)}</strong>
                <span className="day-count">{appts.length} appointment{appts.length!==1?'s':''}</span>
              </div>
              <div className="day-appts">
                {appts.sort((a,b) => a.appointmentTime?.localeCompare(b.appointmentTime||'')).map((a,i) => (
                  <div key={i} className={`appt-chip card status-${a.status?.toLowerCase()}`}>
                    <div className="chip-time">{a.appointmentTime}</div>
                    <div className="chip-info">
                      <div className="chip-patient">{a.patientName}</div>
                      <div className="chip-doctor">Dr. {a.doctorName} · {a.department}</div>
                    </div>
                    <span className={`badge badge-${STATUS_COLOR[a.status]||'muted'}`}>{a.status}</span>
                    {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(a.id)}>Cancel</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AppointmentForm
          appointment={editAppt}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}
