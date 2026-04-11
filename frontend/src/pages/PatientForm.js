// src/pages/PatientForm.js
import React, { useState, useEffect } from 'react';
import { patientAPI } from '../services/api';
import { toast } from 'react-toastify';
import './PatientForm.css';

/**
 * FIXES applied (matched to PatientDTO.java):
 * 1. REMOVED profilePhotoUrl — not in PatientDTO → caused Jackson 400 "Unrecognized field"
 * 2. REMOVED emergencyContactAlternate — not in PatientDTO (Patient model has it but DTO + mapDtoToPatient don't)
 * 3. bloodGroup: backend returns BloodGroup enum as {dbValue:"O+"} — resolveBloodGroup() handles this
 * 4. JSON fields (medicalHistory etc.) kept as strings in state, parsed to objects on submit
 * 5. insuranceDetails: same JSON parse treatment
 * 6. Empty date strings sent as null (backend LocalDate rejects "")
 * 7. primaryDoctorId sent as number (Long), not string
 */

const TABS      = ['Personal', 'Contact', 'Medical', 'Emergency', 'Insurance'];
const TAB_ICONS = ['👤', '📍', '🏥', '🆘', '🛡'];

const EMPTY = {
  patientId: '',
  firstName: '',
  lastName: '',
  middleName: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  nationality: '',
  occupation: '',
  maritalStatus: '',
  religion: '',
  email: '',
  phone: '',
  mobile: '',
  alternatePhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  // Emergency (PatientDTO fields only)
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  // Insurance
  insuranceProvider: '',
  insurancePolicyNumber: '',
  insuranceGroupNumber: '',
  insuranceValidFrom: '',
  insuranceValidTo: '',
  // Admin
  primaryDoctorId: '',
  primaryDoctorName: '',
  patientStatus: 'ACTIVE',
  registrationDate: '',
  registrationType: 'OPD',
  notes: '',
  // JSON fields (string in state → parsed to object on submit)
  medicalHistory: '{}',
  currentMedications: '{}',
  allergies: '{}',
  chronicConditions: '{}',
  immunizations: '{}',
  familyHistory: '{}',
  lifestyleFactors: '{}',
  insuranceDetails: '{}',
};

const JSON_MED_KEYS = [
  'medicalHistory', 'currentMedications', 'allergies',
  'chronicConditions', 'immunizations', 'familyHistory', 'lifestyleFactors',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS      = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
const MARITAL      = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
const STATUSES     = ['ACTIVE', 'INACTIVE', 'DECEASED', 'TRANSFERRED'];
const REG_TYPES    = ['OPD', 'IPD', 'Online', 'EMERGENCY', 'REFERRAL'];

/** Backend returns BloodGroup enum as { dbValue: "O+" } or plain string */
const resolveBloodGroup = (bg) => {
  if (!bg) return '';
  if (typeof bg === 'object' && bg.dbValue) return bg.dbValue;
  return String(bg);
};

const parseJsonSafe = (str) => {
  const raw = (str || '').trim();
  if (!raw || raw === '{}') return null;
  try { return JSON.parse(raw); } catch { return {}; }
};

export default function PatientForm({ patient, onClose, onSaved }) {
  const [tab, setTab]       = useState(0);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient) {
      const init = { ...EMPTY, ...patient };
      JSON_MED_KEYS.forEach(k => {
        const v = patient[k];
        init[k] = v && typeof v === 'object' ? JSON.stringify(v, null, 2) : (v || '{}');
      });
      const ins = patient.insuranceDetails;
      init.insuranceDetails = ins && typeof ins === 'object' ? JSON.stringify(ins, null, 2) : (ins || '{}');
      init.bloodGroup = resolveBloodGroup(patient.bloodGroup);
      setForm(init);
    }
  }, [patient]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buildPayload = () => {
    const payload = { ...form };
    JSON_MED_KEYS.forEach(k => { payload[k] = parseJsonSafe(form[k]); });
    payload.insuranceDetails = parseJsonSafe(form.insuranceDetails);
    payload.primaryDoctorId  = form.primaryDoctorId ? Number(form.primaryDoctorId) : null;
    if (!payload.registrationDate) payload.registrationDate = new Date().toISOString().split('T')[0];
    if (!payload.insuranceValidFrom) payload.insuranceValidFrom = null;
    if (!payload.insuranceValidTo)   payload.insuranceValidTo   = null;
    if (!payload.dateOfBirth)        payload.dateOfBirth        = null;
    return payload;
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and Last name are required'); return;
    }
    if (!form.mobile.trim()) {
      toast.error('Mobile number is required'); return;
    }
    if (!form.dateOfBirth) {
      toast.error('Date of birth is required'); return;
    }
    if (!form.gender) {
      toast.error('Gender is required'); return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (patient?.id) {
        await patientAPI.update(patient.id, payload);
        toast.success('Patient updated successfully!');
      } else {
        await patientAPI.create(payload);
        toast.success('Patient registered successfully!');
      }
      onSaved();
    } catch (error) {
      const msg = error.response?.data?.error
        || error.response?.data?.message
        || 'Save failed. Please ensure the backend is running.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2>{patient ? 'Edit Patient' : 'Register New Patient'}</h2>
            <p>Complete all sections for accurate EMR</p>
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

          {tab === 0 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Patient ID</label>
                <input className="form-control" value={form.patientId}
                  onChange={e => setField('patientId', e.target.value)} placeholder="e.g. P1001 (auto if blank)" />
              </div>
              <div className="form-group">
                <label className="form-label">Patient Status</label>
                <select className="form-control" value={form.patientStatus}
                  onChange={e => setField('patientStatus', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-control" value={form.firstName}
                  onChange={e => setField('firstName', e.target.value)} placeholder="Ankita" />
              </div>
              <div className="form-group">
                <label className="form-label">Middle Name</label>
                <input className="form-control" value={form.middleName}
                  onChange={e => setField('middleName', e.target.value)} placeholder="S" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-control" value={form.lastName}
                  onChange={e => setField('lastName', e.target.value)} placeholder="Patil" />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <input type="date" className="form-control" value={form.dateOfBirth}
                  onChange={e => setField('dateOfBirth', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select className="form-control" value={form.gender}
                  onChange={e => setField('gender', e.target.value)}>
                  <option value="">Select Gender</option>
                  {GENDERS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-control" value={form.bloodGroup}
                  onChange={e => setField('bloodGroup', e.target.value)}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Marital Status</label>
                <select className="form-control" value={form.maritalStatus}
                  onChange={e => setField('maritalStatus', e.target.value)}>
                  <option value="">Select</option>
                  {MARITAL.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Occupation</label>
                <input className="form-control" value={form.occupation}
                  onChange={e => setField('occupation', e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="form-group">
                <label className="form-label">Nationality</label>
                <input className="form-control" value={form.nationality}
                  onChange={e => setField('nationality', e.target.value)} placeholder="Indian" />
              </div>
              <div className="form-group">
                <label className="form-label">Religion</label>
                <input className="form-control" value={form.religion}
                  onChange={e => setField('religion', e.target.value)} placeholder="Hindu" />
              </div>
              <div className="form-group">
                <label className="form-label">Registration Type</label>
                <select className="form-control" value={form.registrationType}
                  onChange={e => setField('registrationType', e.target.value)}>
                  {REG_TYPES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Registration Date</label>
                <input type="date" className="form-control" value={form.registrationDate}
                  onChange={e => setField('registrationDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Primary Doctor ID</label>
                <input type="number" className="form-control" value={form.primaryDoctorId}
                  onChange={e => setField('primaryDoctorId', e.target.value)} placeholder="101" min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Primary Doctor Name</label>
                <input className="form-control" value={form.primaryDoctorName}
                  onChange={e => setField('primaryDoctorName', e.target.value)} placeholder="Dr. Sharma" />
              </div>
              <div className="form-group full">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} value={form.notes}
                  onChange={e => setField('notes', e.target.value)} placeholder="First visit…" />
              </div>
            </div>
          )}

          {tab === 1 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Mobile * <small>(primary)</small></label>
                <input className="form-control" value={form.mobile}
                  onChange={e => setField('mobile', e.target.value)} placeholder="9876543210" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone}
                  onChange={e => setField('phone', e.target.value)} placeholder="0231-1234567" />
              </div>
              <div className="form-group">
                <label className="form-label">Alternate Phone</label>
                <input className="form-control" value={form.alternatePhone}
                  onChange={e => setField('alternatePhone', e.target.value)} placeholder="9123456780" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email}
                  onChange={e => setField('email', e.target.value)} placeholder="ankita.patil@example.com" />
              </div>
              <div className="form-group full">
                <label className="form-label">Address Line 1</label>
                <input className="form-control" value={form.addressLine1}
                  onChange={e => setField('addressLine1', e.target.value)} placeholder="123 Main Street" />
              </div>
              <div className="form-group full">
                <label className="form-label">Address Line 2</label>
                <input className="form-control" value={form.addressLine2}
                  onChange={e => setField('addressLine2', e.target.value)} placeholder="Near Bus Stand" />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-control" value={form.city}
                  onChange={e => setField('city', e.target.value)} placeholder="Kolhapur" />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-control" value={form.state}
                  onChange={e => setField('state', e.target.value)} placeholder="Maharashtra" />
              </div>
              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input className="form-control" value={form.postalCode}
                  onChange={e => setField('postalCode', e.target.value)} placeholder="416003" />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input className="form-control" value={form.country}
                  onChange={e => setField('country', e.target.value)} placeholder="India" />
              </div>
            </div>
          )}

          {tab === 2 && (
            <div className="form-grid">
              {[
                ['medicalHistory',     'Medical History',     '{"past_illness":"none","surgeries":"none"}'],
                ['currentMedications', 'Current Medications', '{"medications":"paracetamol 500mg twice daily"}'],
                ['allergies',          'Allergies',           '{"allergy":"dust"}'],
                ['chronicConditions',  'Chronic Conditions',  '{"condition":"none"}'],
                ['immunizations',      'Immunizations',       '{"covid_vaccine":"2 doses","flu":"annual"}'],
                ['familyHistory',      'Family History',      '{"father":"diabetes","mother":"hypertension"}'],
                ['lifestyleFactors',   'Lifestyle Factors',   '{"smoking":false,"alcohol":"occasionally"}'],
              ].map(([key, label, placeholder]) => (
                <div key={key} className="form-group full">
                  <label className="form-label">
                    {label} <span className="badge badge-info" style={{ fontSize: 9 }}>JSON</span>
                  </label>
                  <textarea className="form-control" rows={2} placeholder={placeholder}
                    value={form[key]} onChange={e => setField(key, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {tab === 3 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input className="form-control" value={form.emergencyContactName}
                  onChange={e => setField('emergencyContactName', e.target.value)} placeholder="Ramesh Patil" />
              </div>
              <div className="form-group">
                <label className="form-label">Relationship</label>
                <input className="form-control" value={form.emergencyContactRelationship}
                  onChange={e => setField('emergencyContactRelationship', e.target.value)} placeholder="Father" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.emergencyContactPhone}
                  onChange={e => setField('emergencyContactPhone', e.target.value)} placeholder="9876500000" />
              </div>
            </div>
          )}

          {tab === 4 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Insurance Provider</label>
                <input className="form-control" value={form.insuranceProvider}
                  onChange={e => setField('insuranceProvider', e.target.value)} placeholder="Star Health" />
              </div>
              <div className="form-group">
                <label className="form-label">Policy Number</label>
                <input className="form-control" value={form.insurancePolicyNumber}
                  onChange={e => setField('insurancePolicyNumber', e.target.value)} placeholder="POL123456" />
              </div>
              <div className="form-group">
                <label className="form-label">Group Number</label>
                <input className="form-control" value={form.insuranceGroupNumber}
                  onChange={e => setField('insuranceGroupNumber', e.target.value)} placeholder="GRP7890" />
              </div>
              <div className="form-group">
                <label className="form-label">Valid From</label>
                <input type="date" className="form-control" value={form.insuranceValidFrom}
                  onChange={e => setField('insuranceValidFrom', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Valid To</label>
                <input type="date" className="form-control" value={form.insuranceValidTo}
                  onChange={e => setField('insuranceValidTo', e.target.value)} />
              </div>
              <div className="form-group full">
                <label className="form-label">
                  Insurance Details <span className="badge badge-info" style={{ fontSize: 9 }}>JSON</span>
                </label>
                <textarea className="form-control" rows={2}
                  placeholder='{"coverage":"full","copay":"500"}'
                  value={form.insuranceDetails}
                  onChange={e => setField('insuranceDetails', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="tab-nav">
            <button className="btn btn-secondary btn-sm" disabled={tab === 0}
              onClick={() => setTab(t => t - 1)}>← Prev</button>
            <span className="tab-progress">{tab + 1}/{TABS.length}</span>
            <button className="btn btn-secondary btn-sm" disabled={tab === TABS.length - 1}
              onClick={() => setTab(t => t + 1)}>Next →</button>
          </div>
          <div>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? '⏳ Saving…' : (patient ? '✓ Update Patient' : '✓ Register Patient')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
