import React, { useEffect, useState } from 'react';
import { medicalRecordAPI, patientAPI } from '../../services/api';
import { toast } from 'react-toastify';
import MedicalRecordForm from './MedicalRecordForm';
import './MedicalRecords.css';

const ENC_COLOR = { OUTPATIENT:'info', INPATIENT:'warning', EMERGENCY:'danger', FOLLOW_UP:'success', TELECONSULT:'muted' };

export default function MedicalRecords() {
  const [patientId, setPatientId]   = useState('');
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editRecord, setEdit]       = useState(null);
  const [patients, setPatients]     = useState([]);

  useEffect(() => {
    patientAPI.getAll().then(r => setPatients(r.data || [])).catch(() => {});
  }, []);

  const loadRecords = (pid) => {
    if (!pid) return;
    setLoading(true);
    medicalRecordAPI.getByPatient(pid)
      .then(r => setRecords(r.data || []))
      .catch(() => toast.error('Failed to load records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (patientId) loadRecords(patientId); else setRecords([]); }, [patientId]);

  const selectedPatient = patients.find(p => String(p.id) === String(patientId));

  return (
    <div className="medical-records-page fade-in">
      {/* Header */}
      <div className="mr-hero card">
        <div className="mr-hero-content">
          <h2>Electronic Medical Records</h2>
          <p>JSONB-powered encounter records stored in PostgreSQL · HIPAA compliant</p>
        </div>
        <img src="https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=300&q=80" alt="EMR" className="mr-hero-img" />
      </div>

      {/* Patient Selector */}
      <div className="card mr-selector">
        <div className="form-group" style={{flex:1}}>
          <label className="form-label">Select Patient to View Records</label>
          <select className="form-control" value={patientId} onChange={e => setPatientId(e.target.value)}>
            <option value="">— Select a patient —</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientId || `#${p.id}`})</option>
            ))}
          </select>
        </div>
        {patientId && (
          <button className="btn btn-primary" style={{alignSelf:'flex-end'}} onClick={() => { setEdit(null); setShowForm(true); }}>
            + Add Encounter Record
          </button>
        )}
      </div>

      {/* Patient Summary Strip */}
      {selectedPatient && (
        <div className="patient-strip card">
          <div className="strip-avatar">{(selectedPatient.firstName||'P').charAt(0)}{(selectedPatient.lastName||'').charAt(0)}</div>
          <div className="strip-info">
            <div className="strip-name">{selectedPatient.firstName} {selectedPatient.lastName}</div>
            <div className="strip-meta">
              <span>{selectedPatient.patientId}</span>
              <span>·</span>
              <span>{selectedPatient.gender}</span>
              <span>·</span>
              <span>🩸 {selectedPatient.bloodGroup?.dbValue || selectedPatient.bloodGroup || '—'}</span>
              <span>·</span>
              <span>Dr. {selectedPatient.primaryDoctorName || '—'}</span>
            </div>
          </div>
          <div className="strip-count">
            <span className="sum-num">{records.length}</span>
            <span style={{fontSize:12,color:'var(--text-muted)'}}>Records</span>
          </div>
        </div>
      )}

      {/* Records */}
      {!patientId ? (
        <div className="card empty-prompt">
          <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&q=70" alt="EMR" />
          <div>
            <h3>Select a Patient</h3>
            <p>Choose a patient from the dropdown above to view their encounter history</p>
          </div>
        </div>
      ) : loading ? (
        <div className="card loading-rows">{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:90,margin:'10px 16px',borderRadius:10}}></div>)}</div>
      ) : records.length === 0 ? (
        <div className="card empty-state"><span>📋</span><p>No encounter records for this patient yet</p><button className="btn btn-primary" onClick={()=>{setEdit(null);setShowForm(true);}}>+ Add First Record</button></div>
      ) : (
        <div className="records-timeline">
          {records.map((r, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-line"></div>
              <div className="timeline-dot"></div>
              <div className="record-card card">
                <div className="rc-header">
                  <div className="rc-badges">
                    <span className={`badge badge-${ENC_COLOR[r.encounterType]||'muted'}`}>{r.encounterType}</span>
                    {r.department && <span className="dept-chip">{r.department}</span>}
                  </div>
                  <div className="rc-meta">
                    <code className="pid">{r.recordId}</code>
                    <span className="rc-date">{new Date(r.encounterDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={()=>{setEdit(r);setShowForm(true);}}>Edit</button>
                </div>
                <div className="rc-body">
                  {r.chiefComplaint    && <RField l="Chief Complaint"   v={r.chiefComplaint} />}
                  {r.primaryDiagnosis  && <RField l="Primary Diagnosis" v={r.primaryDiagnosis} highlight />}
                  {r.treatmentPlan     && <RField l="Treatment Plan"    v={r.treatmentPlan} />}
                  {r.historyOfPresentIllness && <RField l="History"     v={r.historyOfPresentIllness} />}
                  <div className="rc-grid">
                    {r.vitalSigns && typeof r.vitalSigns === 'object' && Object.entries(r.vitalSigns).map(([k,v]) => (
                      <div key={k} className="vital-chip"><span>{k}</span><strong>{String(v)}</strong></div>
                    ))}
                  </div>
                  <div className="rc-footer">
                    <span>Follow-up: <strong>{r.followUpRequired ? `Yes — ${r.followUpDate||'TBD'}` : 'No'}</strong></span>
                    {r.disposition && <span>Disposition: <strong>{r.disposition}</strong></span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <MedicalRecordForm
          record={editRecord}
          patientId={patientId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadRecords(patientId); }}
        />
      )}
    </div>
  );
}

const RField = ({ l, v, highlight }) => (
  <div className={`rfield ${highlight ? 'highlight' : ''}`}>
    <span className="rfield-label">{l}:</span>
    <span className="rfield-value">{v}</span>
  </div>
);
