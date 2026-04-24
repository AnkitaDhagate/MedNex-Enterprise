// src/pages/Patients.js — Premium Patient Management
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, exportAPI } from '../services/api';
import { toast } from 'react-toastify';
import PatientForm from './PatientForm';
import './Patients.css';

const STATUS_COLOR = { ACTIVE:'success', INACTIVE:'muted', DECEASED:'danger', TRANSFERRED:'warning' };
const GENDER_COLOR = { MALE:'#00d4ff', FEMALE:'#f43f5e', OTHER:'#a78bfa' };

const calcAge = (dob) => {
  if (!dob) return '—';
  const b = new Date(dob), t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return age;
};

export default function Patients() {
  const [patients, setPatients]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('ALL');
  const [genderFilter, setGender] = useState('ALL');
  const [showForm, setShowForm]   = useState(false);
  const [editPatient, setEdit]    = useState(null);
  const [exporting, setExporting] = useState(null);
  const navigate = useNavigate();

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientAPI.getAll();
      setPatients(res.data || []);
    } catch (e) {
      toast.error('Failed to load patients');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  useEffect(() => {
    let data = [...patients];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.patientId || '').toLowerCase().includes(q) ||
        (p.phone || '').includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') data = data.filter(p => p.patientStatus === statusFilter);
    if (genderFilter !== 'ALL') data = data.filter(p => p.gender === genderFilter);
    setFiltered(data);
  }, [patients, search, statusFilter, genderFilter]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try { await patientAPI.delete(id); toast.success('Patient deleted'); loadPatients(); }
    catch { toast.error('Delete failed'); }
  };

  const handleExport = async (id, name) => {
    setExporting(id);
    try {
      toast.info('Generating PDF report…');
      const res = await exportAPI.exportPatientPDF(id);
      const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `${name.replace(/\s/g,'_')}_report.pdf`; a.click();
      URL.revokeObjectURL(url); toast.success('PDF exported!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(null); }
  };

  const active   = patients.filter(p => p.patientStatus === 'ACTIVE').length;
  const female   = patients.filter(p => p.gender === 'FEMALE').length;
  const male     = patients.filter(p => p.gender === 'MALE').length;

  return (
    <div className="patients-page">

      {/* Header Banner */}
      <div className="patients-banner">
        <div className="banner-left">
          <div className="banner-icon">👥</div>
          <div>
            <h1>Patient Registry</h1>
            <p>Manage patient records, medical history &amp; insurance data with full tenant isolation</p>
          </div>
        </div>
        <div className="banner-stats">
          <div className="bs-item"><div className="bs-val">{patients.length}</div><div className="bs-lbl">Total</div></div>
          <div className="bs-item bs-active"><div className="bs-val">{active}</div><div className="bs-lbl">Active</div></div>
          <div className="bs-item"><div className="bs-val">{male}</div><div className="bs-lbl">Male</div></div>
          <div className="bs-item"><div className="bs-val">{female}</div><div className="bs-lbl">Female</div></div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEdit(null); setShowForm(true); }}>
          ＋ New Patient
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div style={{position:'relative',flex:1,minWidth:220}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none'}}>🔍</span>
            <input
              className="form-control" style={{paddingLeft:38}}
              placeholder="Search name, ID, phone, email…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-control" style={{width:140}} value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="ALL">All Status</option>
            {['ACTIVE','INACTIVE','DECEASED','TRANSFERRED'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{width:130}} value={genderFilter} onChange={e => setGender(e.target.value)}>
            <option value="ALL">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="toolbar-right">
          <span className="result-badge">{filtered.length} patients</span>
          <button className="btn btn-ghost btn-sm" onClick={loadPatients}>↺ Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{padding:20}}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton" style={{height:54,marginBottom:8,borderRadius:8}} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>No patients found</h3>
            <p>{search ? `No results for "${search}"` : 'Register your first patient to get started'}</p>
            {!search && <button className="btn btn-primary" onClick={() => { setEdit(null); setShowForm(true); }}>+ Add Patient</button>}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>ID</th>
                  <th>Age · Gender</th>
                  <th>Blood</th>
                  <th>Contact</th>
                  <th>City</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="patient-row">
                    <td>
                      <div className="info-cell">
                        <div className="avatar" style={{background:GENDER_COLOR[p.gender]||'var(--cyan)'}}>
                          {(p.firstName||'P').charAt(0)}{(p.lastName||'').charAt(0)}
                        </div>
                        <div>
                          <div className="info-name">{p.firstName} {p.lastName}</div>
                          <div className="info-sub">{p.email||'—'}</div>
                        </div>
                      </div>
                    </td>
                    <td><code className="pid-badge">{p.patientId||`#${p.id}`}</code></td>
                    <td>
                      <div style={{fontWeight:600,color:'var(--text-primary)'}}>{calcAge(p.dateOfBirth)} yrs</div>
                      <div style={{fontSize:11,color:'var(--text-muted)'}}>{p.gender||'—'}</div>
                    </td>
                    <td>
                      {p.bloodGroup ? (
                        <span className="blood-badge">{p.bloodGroup?.dbValue||p.bloodGroup}</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <div style={{fontSize:13,color:'var(--text-secondary)'}}>{p.phone||p.mobile||'—'}</div>
                    </td>
                    <td><span style={{fontSize:12,color:'var(--text-muted)'}}>{p.city||'—'}</span></td>
                    <td><span style={{fontSize:12,color:'var(--text-secondary)'}}>{p.primaryDoctorName||'—'}</span></td>
                    <td>
                      <span className={`badge badge-${STATUS_COLOR[p.patientStatus]||'muted'}`}>
                        {p.patientStatus||'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-ghost btn-sm" title="View Details" onClick={() => navigate(`/patients/${p.id}`)}>👁</button>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => { setEdit(p); setShowForm(true); }}>✏️</button>
                        <button className="btn btn-ghost btn-sm" title="Export PDF" disabled={exporting===p.id}
                          onClick={() => handleExport(p.id, `${p.firstName}_${p.lastName}`)}>
                          {exporting===p.id ? '…' : '📄'}
                        </button>
                        <button className="btn btn-danger btn-sm" title="Delete"
                          onClick={() => handleDelete(p.id, `${p.firstName} ${p.lastName}`)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <PatientForm
          patient={editPatient}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadPatients(); toast.success(editPatient ? 'Patient updated!' : 'Patient registered!'); }}
        />
      )}
    </div>
  );
}
