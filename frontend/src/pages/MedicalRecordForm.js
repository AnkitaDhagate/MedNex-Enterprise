// src/pages/MedicalRecordForm.js
import React, { useState, useEffect } from 'react';
import { medicalRecordAPI } from '../services/api';
import { toast } from 'react-toastify';

/**
 * Matches medical_records table columns from Schema.sql.
 * JSON fields are kept as raw textarea strings and parsed in buildPayload().
 */
const EMPTY = {
  // Identifiers
  patientId: '',          // BIGINT FK → patients.id
  doctorId: '',           // BIGINT FK → doctors.id / users.id
  appointmentId: '',      // BIGINT FK → appointments.id (nullable)
  tenantId: '',           // VARCHAR(50) — injected from auth context by backend if omitted

  // Encounter
  encounterDate: '',      // DATETIME NOT NULL
  encounterType: 'OUTPATIENT',  // ENUM('OUTPATIENT','INPATIENT','EMERGENCY','FOLLOW_UP','TELECONSULT')
  department: '',

  // Clinical narrative
  chiefComplaint: '',
  historyOfPresentIllness: '',
  physicalExamination: '',

  // Diagnosis
  primaryDiagnosis: '',
  // JSON fields — stored as textarea strings, parsed on submit
  secondaryDiagnosis: '',   // JSON
  pastMedicalHistory: '',   // JSON

  // Vitals & Labs — JSON
  vitalSigns: '',         // JSON e.g. {"BP":"120/80","HR":"72","Temp":"98.6F","SpO2":"98%"}
  investigations: '',     // JSON e.g. {"CBC":"Normal","Blood Sugar":"95mg/dl"}

  // Treatment
  treatmentPlan: '',
  medicationsPrescribed: '', // JSON
  procedures: '',            // JSON

  // Disposition
  disposition: '',        // ENUM('DISCHARGED','ADMITTED','REFERRED','DECEASED','FOLLOW_UP')
  referralNotes: '',

  // Follow-up
  followUpRequired: false,
  followUpDate: '',
  followUpInstructions: '',
};

const JSON_FIELDS = [
  'vitalSigns', 'pastMedicalHistory', 'secondaryDiagnosis',
  'investigations', 'medicationsPrescribed', 'procedures',
];

const TABS      = ['Encounter', 'Examination', 'Diagnosis', 'Treatment', 'Follow-up'];
const TAB_ICONS = ['📋', '🔬', '🏥', '💊', '📅'];

const DEPTS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'General Medicine', 'Dermatology', 'Emergency', 'Radiology',
  'Oncology', 'Gynecology', 'ENT', 'Ophthalmology',
];

export default function MedicalRecordForm({ record, patientId, onClose, onSaved }) {
  const [tab, setTab]       = useState(0);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      const init = { ...EMPTY, ...record };
      // Stringify any JSON fields that came as objects from the API
      JSON_FIELDS.forEach(k => {
        const v = record[k];
        if (v && typeof v === 'object') {
          init[k] = JSON.stringify(v, null, 2);
        } else if (typeof v === 'string') {
          init[k] = v;
        } else {
          init[k] = '';
        }
      });
      setForm(init);
    } else if (patientId) {
      setForm(f => ({ ...f, patientId }));
    }
  }, [record, patientId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Parse all JSON text fields into objects before submitting
  const buildPayload = () => {
    const payload = { ...form, patientId: patientId || form.patientId };

    JSON_FIELDS.forEach(k => {
      const raw = (form[k] || '').trim();
      if (!raw) {
        payload[k] = null;
      } else {
        try {
          payload[k] = JSON.parse(raw);
        } catch {
          // Wrap invalid JSON so the backend doesn't choke
          payload[k] = { value: raw };
        }
      }
    });

    // Ensure numeric IDs
    if (payload.patientId)     payload.patientId     = Number(payload.patientId);
    if (payload.doctorId)      payload.doctorId      = Number(payload.doctorId);
    if (payload.appointmentId && payload.appointmentId !== '') {
      payload.appointmentId = Number(payload.appointmentId);
    } else {
      payload.appointmentId = null;
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!form.encounterDate || !form.encounterType) {
      toast.error('Encounter date and type are required');
      return;
    }
    if (!form.patientId && !patientId) {
      toast.error('Patient ID is required');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (record?.id) {
        await medicalRecordAPI.update(record.id, payload);
        toast.success('Medical record updated successfully!');
      } else {
        await medicalRecordAPI.create(payload);
        toast.success('Medical record created successfully!');
      }
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 780 }}>
        <div className="modal-header">
          <div>
            <h2>{record ? 'Edit Encounter Record' : 'New Encounter Record'}</h2>
            <p>JSON data stored securely in MySQL · HIPAA compliant</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="form-tabs">
          {TABS.map((t, i) => (
            <button key={i} className={`form-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
              {TAB_ICONS[i]} {t}
            </button>
          ))}
        </div>

        <div className="modal-body">

          {/* ── Tab 0: Encounter ── */}
          {tab === 0 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Patient ID</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.patientId}
                  onChange={e => set('patientId', e.target.value)}
                  placeholder="Numeric patient ID"
                  min="1"
                  disabled={!!patientId}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Doctor ID</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.doctorId}
                  onChange={e => set('doctorId', e.target.value)}
                  placeholder="Numeric doctor ID"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Appointment ID</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.appointmentId}
                  onChange={e => set('appointmentId', e.target.value)}
                  placeholder="Linked appointment (optional)"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Encounter Date *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={form.encounterDate}
                  onChange={e => set('encounterDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Encounter Type *</label>
                <select className="form-control" value={form.encounterType} onChange={e => set('encounterType', e.target.value)}>
                  {['OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'FOLLOW_UP', 'TELECONSULT'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={form.department} onChange={e => set('department', e.target.value)}>
                  <option value="">Select</option>
                  {DEPTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">Chief Complaint</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.chiefComplaint}
                  onChange={e => set('chiefComplaint', e.target.value)}
                  placeholder="Patient's main complaint…"
                />
              </div>
              <div className="form-group full">
                <label className="form-label">History of Present Illness</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.historyOfPresentIllness}
                  onChange={e => set('historyOfPresentIllness', e.target.value)}
                  placeholder="Onset, duration, character, associated symptoms…"
                />
              </div>
            </div>
          )}

          {/* ── Tab 1: Examination ── */}
          {tab === 1 && (
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Physical Examination</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.physicalExamination}
                  onChange={e => set('physicalExamination', e.target.value)}
                  placeholder="General physical examination findings…"
                />
              </div>
              <div className="form-group full">
                <label className="form-label">
                  Vital Signs <span className="badge badge-info" style={{ fontSize: 9 }}>JSON</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder='{"BP":"120/80","Temp":"98.6F","HR":"72","SpO2":"98%","Weight":"70kg","Height":"165cm"}'
                  value={form.vitalSigns}
                  onChange={e => set('vitalSigns', e.target.value)}
                />
              </div>
              <div className="form-group full">
                <label className="form-label">
                  Investigations / Lab Results <span className="badge badge-info" style={{ fontSize: 9 }}>JSON</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder='{"CBC":"Normal","Blood Sugar":"95mg/dl","HbA1c":"6.2%","Urine":"Clear"}'
                  value={form.investigations}
                  onChange={e => set('investigations', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── Tab 2: Diagnosis ── */}
          {tab === 2 && (
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Primary Diagnosis</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.primaryDiagnosis}
                  onChange={e => set('primaryDiagnosis', e.target.value)}
                  placeholder="Main diagnosis with ICD code if applicable…"
                />
              </div>
              <div className="form-group full">
                <label className="form-label">
                  Secondary Diagnosis <span className="badge badge-info" style={{ fontSize: 9 }}>JSON</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.secondaryDiagnosis}
                  onChange={e => set('secondaryDiagnosis', e.target.value)}
                  placeholder='{"1":"Hypertension","2":"Type 2 Diabetes"}'
                />
              </div>
              <div className="form-group full">
                <label className="form-label">
                  Past Medical History <span className="badge badge-info" style={{ fontSize: 9 }}>JSON</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.pastMedicalHistory}
                  onChange={e => set('pastMedicalHistory', e.target.value)}
                  placeholder='{"allergies":"Penicillin","surgeries":"Appendectomy 2010","chronic":"Hypertension"}'
                />
              </div>
            </div>
          )}

          {/* ── Tab 3: Treatment ── */}
          {tab === 3 && (
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Treatment Plan</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.treatmentPlan}
                  onChange={e => set('treatmentPlan', e.target.value)}
                  placeholder="Detailed treatment plan…"
                />
              </div>
              <div className="form-group full">
                <label className="form-label">
                  Medications Prescribed <span className="badge badge-info" style={{ fontSize: 9 }}>JSON</span>
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.medicationsPrescribed}
                  onChange={e => set('medicationsPrescribed', e.target.value)}
                  placeholder='{"1":{"name":"Amoxicillin","dose":"500mg","freq":"3x daily","days":7}}'
                />
              </div>
              <div className="form-group full">
                <label className="form-label">
                  Procedures <span className="badge badge-info" style={{ fontSize: 9 }}>JSON</span>
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.procedures}
                  onChange={e => set('procedures', e.target.value)}
                  placeholder='{"1":"ECG","2":"Chest X-ray","3":"Spirometry"}'
                />
              </div>
              <div className="form-group">
                <label className="form-label">Disposition</label>
                <select className="form-control" value={form.disposition} onChange={e => set('disposition', e.target.value)}>
                  <option value="">Select</option>
                  {['DISCHARGED', 'ADMITTED', 'REFERRED', 'DECEASED', 'FOLLOW_UP'].map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Referral Notes</label>
                <input
                  className="form-control"
                  value={form.referralNotes}
                  onChange={e => set('referralNotes', e.target.value)}
                  placeholder="Referred to cardiologist at City Hospital…"
                />
              </div>
            </div>
          )}

          {/* ── Tab 4: Follow-up ── */}
          {tab === 4 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Follow-up Required</label>
                <select
                  className="form-control"
                  value={form.followUpRequired ? 'yes' : 'no'}
                  onChange={e => set('followUpRequired', e.target.value === 'yes')}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              {form.followUpRequired && (
                <>
                  <div className="form-group">
                    <label className="form-label">Follow-up Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.followUpDate}
                      onChange={e => set('followUpDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Follow-up Instructions</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.followUpInstructions}
                      onChange={e => set('followUpInstructions', e.target.value)}
                      placeholder="Return in 2 weeks for blood pressure review…"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="tab-nav">
            <button className="btn btn-secondary btn-sm" disabled={tab === 0} onClick={() => setTab(t => t - 1)}>
              ← Prev
            </button>
            <span className="tab-progress">{tab + 1}/{TABS.length}</span>
            <button className="btn btn-secondary btn-sm" disabled={tab === TABS.length - 1} onClick={() => setTab(t => t + 1)}>
              Next →
            </button>
          </div>
          <div>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? '⏳ Saving…' : (record ? '✓ Update Record' : '✓ Save Record')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
