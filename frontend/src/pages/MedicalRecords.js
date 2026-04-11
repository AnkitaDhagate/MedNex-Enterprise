// src/pages/MedicalRecords.js — Enhanced EMR
import React, { useEffect, useState } from 'react';
import { medicalRecordAPI, patientAPI } from '../services/api';
import { toast } from 'react-toastify';
import MedicalRecordForm from './MedicalRecordForm';
import './MedicalRecords.css';

const ENC_COLOR = { OPD:'info', IPD:'warning', EMERGENCY:'danger', TELEMEDICINE:'success' };
const ENC_ICON  = { OPD:'🏥', IPD:'🛏️', EMERGENCY:'🚨', TELEMEDICINE:'💻' };

const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';

export default function MedicalRecords() {
  const [patientId, setPatientId]   = useState('');
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editRecord, setEdit]       = useState(null);
  const [patients, setPatients]     = useState([]);
  const [expanded, setExpanded]     = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [viewMode, setViewMode]     = useState('patient');

  useEffect(() => {
    patientAPI.getAll().then(r => setPatients(r.data||[])).catch(()=>{});
    // Load all records for summary
    medicalRecordAPI.getAll().then(r => setAllRecords(r.data||[])).catch(()=>{});
  }, []);

  const loadRecords = async (pid) => {
    if (!pid) return;
    setLoading(true);
    try {
      const r = await medicalRecordAPI.getByPatient(pid);
      setRecords(r.data||[]);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (patientId) loadRecords(patientId); else setRecords([]); }, [patientId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medical record?')) return;
    try { await medicalRecordAPI.delete(id); toast.success('Record deleted'); loadRecords(patientId); }
    catch { toast.error('Delete failed'); }
  };

  const selectedPatient = patients.find(p => String(p.id) === String(patientId));
  const calcAge = dob => { if(!dob) return '—'; const b=new Date(dob),t=new Date(); let a=t.getFullYear()-b.getFullYear(); if(t.getMonth()-b.getMonth()<0)a--; return a; };

  return (
    <div className="medical-records-page">

      {/* Header */}
      <div className="mr-banner">
        <div className="mrb-left">
          <div style={{fontSize:36}}>📋</div>
          <div>
            <h1>Electronic Medical Records</h1>
            <p>JSONB-powered EMR with FHIR-compatible storage · HIPAA compliant encounter records</p>
          </div>
        </div>
        <div className="mr-total-badge">
          <div style={{fontSize:24,fontWeight:800,color:'var(--cyan)'}}>{allRecords.length}</div>
          <div style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Total Records</div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="tab-bar">
        <button className={`tab-pill ${viewMode==='patient'?'active':''}`} onClick={() => setViewMode('patient')}>
          👤 By Patient
        </button>
        <button className={`tab-pill ${viewMode==='all'?'active':''}`} onClick={() => setViewMode('all')}>
          📋 All Records
        </button>
      </div>

      {/* Patient Selector (patient view) */}
      {viewMode === 'patient' && (
        <div className="card mr-selector">
          <div className="form-group" style={{flex:1,marginBottom:0}}>
            <label className="form-label">Select Patient</label>
            <select className="form-control" value={patientId} onChange={e => setPatientId(e.target.value)}>
              <option value="">— Choose a patient to view their records —</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientId||`#${p.id}`})</option>
              ))}
            </select>
          </div>
          {patientId && (
            <button className="btn btn-primary" style={{alignSelf:'flex-end'}}
              onClick={() => { setEdit(null); setShowForm(true); }}>
              ＋ New Encounter
            </button>
          )}
        </div>
      )}

      {/* All Records View */}
      {viewMode === 'all' && (
        <div className="card">
          <div className="table-wrapper">
            {allRecords.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><h3>No records yet</h3></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Record ID</th><th>Patient</th><th>Type</th><th>Date</th><th>Diagnosis</th><th>Doctor</th></tr>
                </thead>
                <tbody>
                  {allRecords.map(r => (
                    <tr key={r.id}>
                      <td><code style={{fontSize:11,color:'var(--cyan)',background:'rgba(0,212,255,0.06)',padding:'2px 7px',borderRadius:4}}>{r.recordId||`#${r.id}`}</code></td>
                      <td><span style={{fontWeight:600,color:'var(--text-primary)',fontSize:13}}>Patient #{r.patientId}</span></td>
                      <td><span className={`badge badge-${ENC_COLOR[r.encounterType]||'muted'}`}>{ENC_ICON[r.encounterType]||''} {r.encounterType}</span></td>
                      <td><span style={{fontSize:12,color:'var(--text-secondary)'}}>{formatDate(r.encounterDate)}</span></td>
                      <td><span style={{fontSize:12,color:'var(--text-secondary)',maxWidth:180,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.primaryDiagnosis||'—'}</span></td>
                      <td><span style={{fontSize:12,color:'var(--text-muted)'}}>Dr. #{r.doctorId}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Patient Summary Card */}
      {viewMode === 'patient' && selectedPatient && (
        <div className="patient-summary-card">
          <div className="psc-avatar" style={{background:selectedPatient.gender==='FEMALE'?'#f43f5e':'#00d4ff'}}>
            {(selectedPatient.firstName||'P').charAt(0)}{(selectedPatient.lastName||'').charAt(0)}
          </div>
          <div className="psc-info">
            <div className="psc-name">{selectedPatient.firstName} {selectedPatient.lastName}</div>
            <div className="psc-meta">
              <span>{selectedPatient.patientId}</span>
              <span>·</span>
              <span>{selectedPatient.gender}</span>
              <span>·</span>
              <span>{calcAge(selectedPatient.dateOfBirth)} yrs</span>
              <span>·</span>
              <span>🩸 {selectedPatient.bloodGroup?.dbValue||selectedPatient.bloodGroup||'—'}</span>
              {selectedPatient.primaryDoctorName && <><span>·</span><span>👨‍⚕️ {selectedPatient.primaryDoctorName}</span></>}
            </div>
            {selectedPatient.medicalHistory?.allergies?.length > 0 && (
              <div className="psc-allergies">
                ⚠️ Allergies: {selectedPatient.medicalHistory.allergies.join(', ')}
              </div>
            )}
          </div>
          <div className="psc-record-count">
            <div style={{fontSize:28,fontWeight:800,color:'var(--cyan)'}}>{records.length}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Encounters</div>
          </div>
        </div>
      )}

      {/* Records for Selected Patient */}
      {viewMode === 'patient' && patientId && (
        <div>
          {loading ? (
            <div style={{padding:20}}>{[1,2,3].map(i=><div key={i} className="skeleton" style={{height:80,marginBottom:8,borderRadius:8}}/>)}</div>
          ) : records.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">📋</div>
              <h3>No records for this patient</h3>
              <p>Add the first encounter record to start the medical history</p>
              <button className="btn btn-primary" onClick={() => { setEdit(null); setShowForm(true); }}>+ Add Encounter</button>
            </div>
          ) : (
            <div className="records-list">
              {records.map((rec, i) => (
                <div key={rec.id} className="record-card card">
                  <div className="rc-header" onClick={() => setExpanded(expanded === i ? null : i)}>
                    <div className="rc-left">
                      <span className="rc-enc-icon">{ENC_ICON[rec.encounterType]||'📋'}</span>
                      <div>
                        <div className="rc-title">{rec.primaryDiagnosis || 'Encounter Record'}</div>
                        <div className="rc-meta">
                          <span className={`badge badge-${ENC_COLOR[rec.encounterType]||'muted'}`}>{rec.encounterType}</span>
                          <span>·</span>
                          <span>{formatDate(rec.encounterDate)}</span>
                          {rec.department && <><span>·</span><span>🏥 {rec.department}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="rc-right">
                      <div className="action-btns">
                        <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setEdit(rec);setShowForm(true);}}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={e=>{e.stopPropagation();handleDelete(rec.id);}}>🗑</button>
                        <button className="btn btn-ghost btn-sm">{expanded===i?'▲':'▼'}</button>
                      </div>
                    </div>
                  </div>

                  {expanded === i && (
                    <div className="rc-body">
                      <div className="rc-section-grid">

                        {rec.chiefComplaint && (
                          <div className="rc-section">
                            <div className="section-divider">Chief Complaint</div>
                            <p style={{fontSize:13,color:'var(--text-secondary)'}}>{rec.chiefComplaint}</p>
                          </div>
                        )}

                        {rec.vitalSigns && (
                          <div className="rc-section">
                            <div className="section-divider">Vital Signs</div>
                            <div className="vitals-grid">
                              {Object.entries(typeof rec.vitalSigns === 'string' ? JSON.parse(rec.vitalSigns) : rec.vitalSigns).map(([k,v]) => (
                                <div key={k} className="vital-chip">
                                  <div className="vc-val">{v}</div>
                                  <div className="vc-key">{k.replace(/_/g,' ').replace('bp','BP').replace('bmi','BMI')}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {rec.treatmentPlan && (
                          <div className="rc-section">
                            <div className="section-divider">Treatment Plan</div>
                            <p style={{fontSize:13,color:'var(--text-secondary)'}}>{rec.treatmentPlan}</p>
                          </div>
                        )}

                        {rec.medicationsPrescribed && (
                          <div className="rc-section">
                            <div className="section-divider">Medications Prescribed</div>
                            <pre className="code-block">
                              {typeof rec.medicationsPrescribed === 'string'
                                ? rec.medicationsPrescribed
                                : JSON.stringify(rec.medicationsPrescribed, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      {rec.followUpRequired && (
                        <div className="follow-up-notice">
                          📅 Follow-up required: {formatDate(rec.followUpDate)}
                          {rec.followUpInstructions && ` — ${rec.followUpInstructions}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <MedicalRecordForm
          record={editRecord}
          patientId={patientId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadRecords(patientId); toast.success(editRecord ? 'Record updated!' : 'Record added!'); }}
        />
      )}
    </div>
  );
}
