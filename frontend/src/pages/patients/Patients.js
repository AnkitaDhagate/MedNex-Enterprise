import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAPI, exportAPI } from '../../services/api';
import { toast } from 'react-toastify';
import PatientForm from './PatientForm';
import './Patients.css';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPatient, setEdit]  = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    patientAPI.getAll().then(r => {
      setPatients(r.data || []);
      setFiltered(r.data || []);
    }).catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(patients); return; }
    const q = search.toLowerCase();
    setFiltered(patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      (p.patientId || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    ));
  }, [search, patients]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient? This cannot be undone.')) return;
    try {
      await patientAPI.delete(id);
      toast.success('Patient deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleExport = async (id, name) => {
    try {
      toast.info('Generating encrypted PDF…');
      const res = await exportAPI.exportPatientPDF(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `${name}_history.pdf`; a.click();
      toast.success('PDF exported successfully');
    } catch { toast.error('Export failed'); }
  };

  const statusColor = s => ({ ACTIVE:'success', INACTIVE:'muted', DISCHARGED:'warning', DECEASED:'danger' }[s] || 'info');

  return (
    <div className="patients-page fade-in">
      {/* Header */}
      <div className="page-header card">
        <div className="page-header-img">
          <img src="https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=300&q=80" alt="Patients" />
          <div className="ph-overlay"></div>
        </div>
        <div className="page-header-content">
          <h2>Patient Registry</h2>
          <p>Manage all patient records, medical history and insurance data</p>
          <div className="header-stats">
            <span><strong>{patients.length}</strong> Total</span>
            <span><strong>{patients.filter(p=>p.patientStatus==='ACTIVE').length}</strong> Active</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEdit(null); setShowForm(true); }}>
          + Add Patient
        </button>
      </div>

      {/* Search & Filters */}
      <div className="filter-bar card">
        <input
          className="form-control search-input"
          placeholder="🔍  Search by name, ID, phone or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="result-count">{filtered.length} patients</span>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-rows">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52, margin: '8px 16px', borderRadius: 8 }}></div>)}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient</th><th>ID</th><th>Age / Gender</th>
                  <th>Contact</th><th>Doctor</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="empty-row">No patients found</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="patient-row">
                    <td>
                      <div className="patient-cell">
                        <div className="patient-avatar">{(p.firstName||'P').charAt(0)}{(p.lastName||'').charAt(0)}</div>
                        <div>
                          <div className="cell-name">{p.firstName} {p.lastName}</div>
                          <div className="cell-sub">{p.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td><code className="pid">{p.patientId || '—'}</code></td>
                    <td>{p.dateOfBirth ? calcAge(p.dateOfBirth) + 'y' : '—'} / {p.gender || '—'}</td>
                    <td>{p.phone || '—'}</td>
                    <td>{p.primaryDoctorName || '—'}</td>
                    <td><span className={`badge badge-${statusColor(p.patientStatus)}`}>{p.patientStatus || 'ACTIVE'}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/patients/${p.id}`)}>View</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEdit(p); setShowForm(true); }}>Edit</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleExport(p.id, `${p.firstName}_${p.lastName}`)}>PDF</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <PatientForm
          patient={editPatient}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function calcAge(dob) {
  const d = new Date(dob);
  return new Date().getFullYear() - d.getFullYear();
}
