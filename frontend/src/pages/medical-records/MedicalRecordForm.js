import React, { useState, useEffect } from 'react';
import { medicalRecordAPI } from '../../services/api';
import { toast } from 'react-toastify';

const EMPTY = {
  patientId:'', doctorId:'', appointmentId:'',
  encounterDate:'', encounterType:'OUTPATIENT', department:'',
  chiefComplaint:'', historyOfPresentIllness:'',
  physicalExamination:'', primaryDiagnosis:'', treatmentPlan:'',
  followUpRequired:false, followUpDate:'', followUpInstructions:'',
  disposition:'', referralNotes:'',
  vitalSigns:'', pastMedicalHistory:'', secondaryDiagnosis:'',
  medicationsPrescribed:'', procedures:'',
};

const TABS = ['Encounter','Examination','Diagnosis','Treatment','Follow-up'];
const TAB_ICONS = ['📋','🔬','🏥','💊','📅'];
const DEPTS = ['Cardiology','Neurology','Orthopedics','Pediatrics','General Medicine','Dermatology','Emergency','Radiology','Oncology'];

export default function MedicalRecordForm({ record, patientId, onClose, onSaved }) {
  const [tab, setTab]       = useState(0);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) setForm({ ...EMPTY, ...record });
    else if (patientId) setForm(f => ({ ...f, patientId }));
  }, [record, patientId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const jsonField = (k) => typeof form[k] === 'object' && form[k] ? JSON.stringify(form[k], null, 2) : (form[k] || '');
  const setJson = (k, v) => { try { set(k, JSON.parse(v)); } catch { set(k, v); } };

  const handleSubmit = async () => {
    if (!form.encounterDate || !form.encounterType) { toast.error('Encounter date and type required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, patientId: patientId || form.patientId };
      if (record?.id) { await medicalRecordAPI.update(record.id, payload); toast.success('Record updated!'); }
      else            { await medicalRecordAPI.create(payload);            toast.success('Record created!'); }
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{maxWidth:780}}>
        <div className="modal-header">
          <div>
            <h2>{record ? 'Edit Encounter Record' : 'New Encounter Record'}</h2>
            <p>JSONB data stored securely in PostgreSQL</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="form-tabs">
          {TABS.map((t,i) => (
            <button key={i} className={`form-tab ${tab===i?'active':''}`} onClick={()=>setTab(i)}>
              {TAB_ICONS[i]} {t}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 0 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Encounter Date *</label>
                <input type="datetime-local" className="form-control" value={form.encounterDate} onChange={e=>set('encounterDate',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Encounter Type *</label>
                <select className="form-control" value={form.encounterType} onChange={e=>set('encounterType',e.target.value)}>
                  {['OUTPATIENT','INPATIENT','EMERGENCY','FOLLOW_UP','TELECONSULT'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={form.department} onChange={e=>set('department',e.target.value)}>
                  <option value="">Select</option>
                  {DEPTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Doctor ID</label>
                <input type="number" className="form-control" value={form.doctorId} onChange={e=>set('doctorId',e.target.value)} />
              </div>
              <div className="form-group full">
                <label className="form-label">Chief Complaint</label>
                <textarea className="form-control" rows={2} value={form.chiefComplaint} onChange={e=>set('chiefComplaint',e.target.value)} placeholder="Patient's main complaint…"></textarea>
              </div>
              <div className="form-group full">
                <label className="form-label">History of Present Illness</label>
                <textarea className="form-control" rows={3} value={form.historyOfPresentIllness} onChange={e=>set('historyOfPresentIllness',e.target.value)}></textarea>
              </div>
            </div>
          )}

          {tab === 1 && (
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Physical Examination</label>
                <textarea className="form-control" rows={3} value={form.physicalExamination} onChange={e=>set('physicalExamination',e.target.value)}></textarea>
              </div>
              <div className="form-group full">
                <label className="form-label">Vital Signs <span className="badge badge-info" style={{fontSize:9}}>JSONB</span></label>
                <textarea className="form-control" rows={3} placeholder='{"BP":"120/80","Temp":"98.6F","HR":"72"}' value={jsonField('vitalSigns')} onChange={e=>setJson('vitalSigns',e.target.value)}></textarea>
              </div>
              <div className="form-group full">
                <label className="form-label">Investigations <span className="badge badge-info" style={{fontSize:9}}>JSONB</span></label>
                <textarea className="form-control" rows={3} placeholder='{"CBC":"Normal","Blood Sugar":"95mg/dl"}' value={jsonField('investigations')} onChange={e=>setJson('investigations',e.target.value)}></textarea>
              </div>
            </div>
          )}

          {tab === 2 && (
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Primary Diagnosis</label>
                <textarea className="form-control" rows={2} value={form.primaryDiagnosis} onChange={e=>set('primaryDiagnosis',e.target.value)} placeholder="Main diagnosis…"></textarea>
              </div>
              <div className="form-group full">
                <label className="form-label">Secondary Diagnosis <span className="badge badge-info" style={{fontSize:9}}>JSONB</span></label>
                <textarea className="form-control" rows={3} value={jsonField('secondaryDiagnosis')} onChange={e=>setJson('secondaryDiagnosis',e.target.value)} placeholder='{"1":"Hypertension","2":"Type 2 Diabetes"}'></textarea>
              </div>
              <div className="form-group full">
                <label className="form-label">Past Medical History <span className="badge badge-info" style={{fontSize:9}}>JSONB</span></label>
                <textarea className="form-control" rows={3} value={jsonField('pastMedicalHistory')} onChange={e=>setJson('pastMedicalHistory',e.target.value)}></textarea>
              </div>
            </div>
          )}

          {tab === 3 && (
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Treatment Plan</label>
                <textarea className="form-control" rows={3} value={form.treatmentPlan} onChange={e=>set('treatmentPlan',e.target.value)}></textarea>
              </div>
              <div className="form-group full">
                <label className="form-label">Medications Prescribed <span className="badge badge-info" style={{fontSize:9}}>JSONB</span></label>
                <textarea className="form-control" rows={3} value={jsonField('medicationsPrescribed')} onChange={e=>setJson('medicationsPrescribed',e.target.value)} placeholder='{"1":{"name":"Amoxicillin","dose":"500mg","freq":"3x daily"}}'></textarea>
              </div>
              <div className="form-group full">
                <label className="form-label">Procedures <span className="badge badge-info" style={{fontSize:9}}>JSONB</span></label>
                <textarea className="form-control" rows={2} value={jsonField('procedures')} onChange={e=>setJson('procedures',e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Disposition</label>
                <select className="form-control" value={form.disposition} onChange={e=>set('disposition',e.target.value)}>
                  <option value="">Select</option>
                  {['DISCHARGED','ADMITTED','REFERRED','DECEASED','FOLLOW_UP'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Referral Notes</label>
                <input className="form-control" value={form.referralNotes} onChange={e=>set('referralNotes',e.target.value)} placeholder="Referred to…" />
              </div>
            </div>
          )}

          {tab === 4 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Follow-up Required</label>
                <select className="form-control" value={form.followUpRequired?'yes':'no'} onChange={e=>set('followUpRequired',e.target.value==='yes')}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              {form.followUpRequired && <>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input type="date" className="form-control" value={form.followUpDate} onChange={e=>set('followUpDate',e.target.value)} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Follow-up Instructions</label>
                  <textarea className="form-control" rows={3} value={form.followUpInstructions} onChange={e=>set('followUpInstructions',e.target.value)}></textarea>
                </div>
              </>}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="tab-nav">
            <button className="btn btn-secondary btn-sm" disabled={tab===0} onClick={()=>setTab(t=>t-1)}>← Prev</button>
            <span className="tab-progress">{tab+1}/{TABS.length}</span>
            <button className="btn btn-secondary btn-sm" disabled={tab===TABS.length-1} onClick={()=>setTab(t=>t+1)}>Next →</button>
          </div>
          <div>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? '⏳ Saving…' : '✓ Save Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
