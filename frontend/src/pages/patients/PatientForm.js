import React, { useState, useEffect } from 'react';
import { patientAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './PatientForm.css';

const TABS = ['Personal', 'Address', 'Medical', 'Emergency', 'Insurance'];

const EMPTY = {
  firstName:'', lastName:'', middleName:'', dateOfBirth:'', gender:'',
  bloodGroup:'', email:'', phone:'', mobile:'', alternatePhone:'',
  addressLine1:'', addressLine2:'', city:'', state:'', postalCode:'', country:'India', nationality:'',
  occupation:'', maritalStatus:'', religion:'',
  emergencyContactName:'', emergencyContactRelationship:'', emergencyContactPhone:'',
  insuranceProvider:'', insurancePolicyNumber:'', insuranceGroupNumber:'',
  insuranceValidFrom:'', insuranceValidTo:'',
  primaryDoctorName:'', patientStatus:'ACTIVE', registrationType:'OPD', notes:'',
};

export default function PatientForm({ patient, onClose, onSaved }) {
  const [tab, setTab]       = useState(0);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient) {
      setForm({
        ...EMPTY, ...patient,
        dateOfBirth: patient.dateOfBirth || '',
        insuranceValidFrom: patient.insuranceValidFrom || '',
        insuranceValidTo: patient.insuranceValidTo || '',
      });
    }
  }, [patient]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { toast.error('First and Last name are required'); return; }
    setSaving(true);
    try {
      if (patient?.id) { await patientAPI.update(patient.id, form); toast.success('Patient updated!'); }
      else             { await patientAPI.create(form);             toast.success('Patient created!'); }
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
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

        {/* Tabs */}
        <div className="form-tabs">
          {TABS.map((t, i) => (
            <button key={i} className={`form-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
              {TAB_ICONS[i]} {t}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {/* Tab 0: Personal */}
          {tab === 0 && (
            <div className="form-grid">
              <F label="First Name *" required><input className="form-control" value={form.firstName} onChange={e=>set('firstName',e.target.value)} placeholder="John" /></F>
              <F label="Last Name *"  required><input className="form-control" value={form.lastName}  onChange={e=>set('lastName',e.target.value)}  placeholder="Doe" /></F>
              <F label="Middle Name"><input className="form-control" value={form.middleName} onChange={e=>set('middleName',e.target.value)} placeholder="Middle" /></F>
              <F label="Date of Birth"><input type="date" className="form-control" value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)} /></F>
              <F label="Gender">
                <select className="form-control" value={form.gender} onChange={e=>set('gender',e.target.value)}>
                  <option value="">Select</option>
                  {['MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY'].map(g=><option key={g}>{g}</option>)}
                </select>
              </F>
              <F label="Blood Group">
                <select className="form-control" value={form.bloodGroup} onChange={e=>set('bloodGroup',e.target.value)}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}
                </select>
              </F>
              <F label="Email"><input type="email" className="form-control" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="patient@email.com" /></F>
              <F label="Phone"><input className="form-control" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 9000000000" /></F>
              <F label="Mobile"><input className="form-control" value={form.mobile} onChange={e=>set('mobile',e.target.value)} placeholder="+91 9000000001" /></F>
              <F label="Alternate Phone"><input className="form-control" value={form.alternatePhone} onChange={e=>set('alternatePhone',e.target.value)} /></F>
              <F label="Marital Status">
                <select className="form-control" value={form.maritalStatus} onChange={e=>set('maritalStatus',e.target.value)}>
                  <option value="">Select</option>
                  {['SINGLE','MARRIED','DIVORCED','WIDOWED'].map(m=><option key={m}>{m}</option>)}
                </select>
              </F>
              <F label="Occupation"><input className="form-control" value={form.occupation} onChange={e=>set('occupation',e.target.value)} placeholder="Profession" /></F>
              <F label="Religion"><input className="form-control" value={form.religion} onChange={e=>set('religion',e.target.value)} placeholder="Optional" /></F>
              <F label="Nationality"><input className="form-control" value={form.nationality} onChange={e=>set('nationality',e.target.value)} placeholder="Indian" /></F>
              <F label="Patient Status">
                <select className="form-control" value={form.patientStatus} onChange={e=>set('patientStatus',e.target.value)}>
                  {['ACTIVE','INACTIVE','DISCHARGED','DECEASED'].map(s=><option key={s}>{s}</option>)}
                </select>
              </F>
              <F label="Registration Type">
                <select className="form-control" value={form.registrationType} onChange={e=>set('registrationType',e.target.value)}>
                  {['OPD','IPD','EMERGENCY','REFERRAL'].map(r=><option key={r}>{r}</option>)}
                </select>
              </F>
              <F label="Primary Doctor"><input className="form-control" value={form.primaryDoctorName} onChange={e=>set('primaryDoctorName',e.target.value)} placeholder="Dr. Name" /></F>
              <F label="Notes" full><textarea className="form-control" rows={3} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Additional notes…"></textarea></F>
            </div>
          )}

          {/* Tab 1: Address */}
          {tab === 1 && (
            <div className="form-grid">
              <F label="Address Line 1" full><input className="form-control" value={form.addressLine1} onChange={e=>set('addressLine1',e.target.value)} placeholder="House no, Street" /></F>
              <F label="Address Line 2" full><input className="form-control" value={form.addressLine2} onChange={e=>set('addressLine2',e.target.value)} placeholder="Area, Landmark" /></F>
              <F label="City"><input className="form-control" value={form.city} onChange={e=>set('city',e.target.value)} placeholder="City" /></F>
              <F label="State"><input className="form-control" value={form.state} onChange={e=>set('state',e.target.value)} placeholder="State" /></F>
              <F label="Postal Code"><input className="form-control" value={form.postalCode} onChange={e=>set('postalCode',e.target.value)} placeholder="416001" /></F>
              <F label="Country"><input className="form-control" value={form.country} onChange={e=>set('country',e.target.value)} /></F>
            </div>
          )}

          {/* Tab 2: Medical */}
          {tab === 2 && (
            <div className="medical-tab">
              <div className="info-box">
                Medical history is stored as structured JSONB in PostgreSQL.
                Use the fields below to record key medical data.
              </div>
              {[
                { label: 'Medical History', key: 'medicalHistory' },
                { label: 'Current Medications', key: 'currentMedications' },
                { label: 'Known Allergies', key: 'allergies' },
                { label: 'Chronic Conditions', key: 'chronicConditions' },
                { label: 'Immunizations', key: 'immunizations' },
                { label: 'Family History', key: 'familyHistory' },
                { label: 'Lifestyle Factors', key: 'lifestyleFactors' },
              ].map(({ label, key }) => (
                <div key={key} className="json-field">
                  <label className="form-label">{label} <span className="badge badge-info" style={{fontSize:9}}>JSONB</span></label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder={`{"key": "value"} or plain text description`}
                    value={typeof form[key] === 'object' && form[key] ? JSON.stringify(form[key], null, 2) : (form[key] || '')}
                    onChange={e => {
                      try { set(key, JSON.parse(e.target.value)); }
                      catch { set(key, e.target.value); }
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Emergency */}
          {tab === 3 && (
            <div className="form-grid">
              <F label="Contact Name" full><input className="form-control" value={form.emergencyContactName} onChange={e=>set('emergencyContactName',e.target.value)} placeholder="Full name" /></F>
              <F label="Relationship"><input className="form-control" value={form.emergencyContactRelationship} onChange={e=>set('emergencyContactRelationship',e.target.value)} placeholder="Spouse, Parent…" /></F>
              <F label="Phone"><input className="form-control" value={form.emergencyContactPhone} onChange={e=>set('emergencyContactPhone',e.target.value)} placeholder="+91 9000000000" /></F>
            </div>
          )}

          {/* Tab 4: Insurance */}
          {tab === 4 && (
            <div className="form-grid">
              <F label="Insurance Provider" full><input className="form-control" value={form.insuranceProvider} onChange={e=>set('insuranceProvider',e.target.value)} placeholder="LIC, Star Health…" /></F>
              <F label="Policy Number"><input className="form-control" value={form.insurancePolicyNumber} onChange={e=>set('insurancePolicyNumber',e.target.value)} /></F>
              <F label="Group Number"><input className="form-control" value={form.insuranceGroupNumber} onChange={e=>set('insuranceGroupNumber',e.target.value)} /></F>
              <F label="Valid From"><input type="date" className="form-control" value={form.insuranceValidFrom} onChange={e=>set('insuranceValidFrom',e.target.value)} /></F>
              <F label="Valid To"><input type="date" className="form-control" value={form.insuranceValidTo} onChange={e=>set('insuranceValidTo',e.target.value)} /></F>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="tab-nav">
            <button className="btn btn-secondary btn-sm" disabled={tab===0} onClick={()=>setTab(t=>t-1)}>← Previous</button>
            <span className="tab-progress">{tab+1} / {TABS.length}</span>
            <button className="btn btn-secondary btn-sm" disabled={tab===TABS.length-1} onClick={()=>setTab(t=>t+1)}>Next →</button>
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

const TAB_ICONS = ['👤','📍','🏥','🆘','🛡'];
const F = ({ label, children, full }) => (
  <div className={`form-group ${full ? 'full' : ''}`}>
    <label className="form-label">{label}</label>
    {children}
  </div>
);
