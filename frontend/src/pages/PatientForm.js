// src/pages/PatientForm.js — FIXED: primaryDoctorId is a searchable dropdown (not raw number input)
import React, { useState, useEffect, useRef } from 'react';
import { patientAPI, hospitalAPI } from '../services/api';
import { toast } from 'react-toastify';
import './PatientForm.css';

const TABS      = ['Personal', 'Contact', 'Medical', 'Emergency', 'Insurance'];
const TAB_ICONS = ['👤', '📍', '🏥', '🆘', '🛡'];

const EMPTY = {
  patientId: '',
  firstName: '', lastName: '', middleName: '',
  dateOfBirth: '', gender: '', bloodGroup: '',
  nationality: '', occupation: '', maritalStatus: '', religion: '',
  email: '', phone: '', mobile: '', alternatePhone: '',
  addressLine1: '', addressLine2: '', city: '', state: '',
  postalCode: '', country: 'India',
  emergencyContactName: '', emergencyContactRelationship: '',
  emergencyContactPhone: '', emergencyContactAlternate: '',
  insuranceProvider: '', insurancePolicyNumber: '',
  insuranceGroupNumber: '', insuranceValidFrom: '', insuranceValidTo: '',
  insuranceDetails: null,
  primaryDoctorId: null,
  primaryDoctorName: '',
  patientStatus: 'ACTIVE',
  registrationDate: '',
  registrationType: 'OPD',
  notes: '',
  profilePhotoUrl: '',
  medicalHistory: '{}', currentMedications: '{}', allergies: '{}',
  chronicConditions: '{}', immunizations: '{}', familyHistory: '{}', lifestyleFactors: '{}',
};

const JSON_MED_KEYS = ['medicalHistory','currentMedications','allergies','chronicConditions','immunizations','familyHistory','lifestyleFactors'];
const BLOOD_GROUPS  = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const GENDERS       = ['MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY'];
const MARITAL       = ['SINGLE','MARRIED','DIVORCED','WIDOWED'];
const STATUSES      = ['ACTIVE','INACTIVE','DECEASED','TRANSFERRED'];
const REG_TYPES     = ['OPD','IPD','Online','EMERGENCY','REFERRAL'];

// ── Reusable searchable dropdown ───────────────────────────────────────────────
function SearchableSelect({ label, placeholder, options, value, onSelect, loading }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const wrapRef           = useRef(null);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) || String(o.id).includes(query)
  );

  return (
    <div className="form-group" ref={wrapRef} style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <div className="form-control" onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', cursor:'pointer', padding:'0 10px', gap:8, minHeight:40 }}>
        {value
          ? <span style={{ flex:1, fontSize:14, color:'#e0eaff' }}>{value.label}</span>
          : <span style={{ flex:1, fontSize:13, color:'#666' }}>{placeholder}</span>
        }
        {value && (
          <span onClick={e => { e.stopPropagation(); onSelect(null); setQuery(''); }}
            style={{ cursor:'pointer', color:'#aaa', fontSize:16 }}>✕</span>
        )}
        <span style={{ color:'#aaa', fontSize:11 }}>{open ? '▲' : '▼'}</span>
      </div>
      {value && (
        <div style={{ fontSize:11, color:'#8899b4', marginTop:3 }}>
          ID: {value.id}{value.sub ? ' · ' + value.sub : ''}
        </div>
      )}
      {open && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:1000,
          background:'#1e2d3d', border:'1px solid #2d4a6b', borderRadius:8,
          boxShadow:'0 8px 28px rgba(0,0,0,.55)', maxHeight:240,
          display:'flex', flexDirection:'column',
        }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #2d4a6b' }}>
            <input autoFocus className="form-control" style={{ margin:0, fontSize:13 }}
              placeholder="Type to search…" value={query}
              onChange={e => setQuery(e.target.value)} onClick={e => e.stopPropagation()} />
          </div>
          <div style={{ overflowY:'auto', flex:1 }}>
            {loading && <div style={{ padding:'12px 14px', color:'#8899b4', fontSize:13 }}>Loading…</div>}
            {!loading && filtered.length === 0 && (
              <div style={{ padding:'12px 14px', color:'#8899b4', fontSize:13 }}>No results</div>
            )}
            {!loading && filtered.map(opt => (
              <div key={opt.id}
                onClick={() => { onSelect(opt); setQuery(''); setOpen(false); }}
                style={{ padding:'10px 14px', cursor:'pointer', fontSize:13,
                  background: value?.id === opt.id ? '#1a3a5c' : 'transparent',
                  borderBottom:'1px solid #182533' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a3a5c'}
                onMouseLeave={e => e.currentTarget.style.background = value?.id === opt.id ? '#1a3a5c' : 'transparent'}
              >
                <div style={{ fontWeight:600, color:'#e0eaff' }}>{opt.label}</div>
                {opt.sub && <div style={{ color:'#8899b4', fontSize:11, marginTop:2 }}>{opt.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PatientForm({ patient, onClose, onSaved }) {
  const [tab, setTab]       = useState(0);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [doctors, setDoctors]       = useState([]);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [selDoctor, setSelDoctor]   = useState(null);

  // Load doctors for primary-doctor dropdown
  useEffect(() => {
    hospitalAPI.getDoctors()
      .then(r => setDoctors(
        (r.data || []).map(d => ({
          id:    d.id,
          label: d.name,
          sub:   d.specialization || '',
        }))
      ))
      .catch(() => toast.error('Could not load doctors list'))
      .finally(() => setLoadingDoc(false));
  }, []);

  // Pre-fill when editing
  useEffect(() => {
    if (patient) {
      const init = { ...EMPTY, ...patient };
      JSON_MED_KEYS.forEach(k => {
        const v = patient[k];
        init[k] = v && typeof v === 'object' ? JSON.stringify(v, null, 2) : (v || '{}');
      });
      setForm(init);
      if (patient.primaryDoctorId) {
        setSelDoctor({
          id:    patient.primaryDoctorId,
          label: patient.primaryDoctorName || `Doctor #${patient.primaryDoctorId}`,
          sub:   '',
        });
      }
    }
  }, [patient]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleDoctorSelect = (opt) => {
    setSelDoctor(opt);
    if (opt) {
      setForm(f => ({ ...f, primaryDoctorId: opt.id, primaryDoctorName: opt.label }));
    } else {
      setForm(f => ({ ...f, primaryDoctorId: null, primaryDoctorName: '' }));
    }
  };

  const buildPayload = () => {
    const payload = { ...form };
    JSON_MED_KEYS.forEach(k => {
      const raw = (payload[k] || '').trim();
      try   { payload[k] = JSON.parse(raw || '{}'); }
      catch { payload[k] = {}; }
    });
    if (!payload.insuranceDetails) payload.insuranceDetails = { coverage: 'full' };
    if (payload.primaryDoctorId) payload.primaryDoctorId = Number(payload.primaryDoctorId);
    else delete payload.primaryDoctorId;
    if (!payload.registrationDate)
      payload.registrationDate = new Date().toISOString().split('T')[0];
    return payload;
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { toast.error('First name and Last name are required'); return; }
    if (!form.mobile.trim())   { toast.error('Mobile number is required'); return; }
    if (!form.dateOfBirth)     { toast.error('Date of birth is required'); return; }
    if (!form.gender)          { toast.error('Gender is required'); return; }

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
        || 'Save failed. Please ensure the backend is running and you are logged in.';
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

          {/* ── Tab 0: Personal ── */}
          {tab === 0 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Patient ID</label>
                <input className="form-control" value={form.patientId}
                  onChange={e => setField('patientId', e.target.value)}
                  placeholder="e.g. P1001 (auto-generated if blank)" />
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

              {/* FIXED: Primary Doctor is now a searchable dropdown */}
              <SearchableSelect
                label="Primary Doctor"
                placeholder="Search doctor by name…"
                options={doctors}
                value={selDoctor}
                onSelect={handleDoctorSelect}
                loading={loadingDoc}
              />

              <div className="form-group">
                <label className="form-label">Profile Photo URL</label>
                <input className="form-control" value={form.profilePhotoUrl}
                  onChange={e => setField('profilePhotoUrl', e.target.value)} placeholder="https://…/photo.jpg" />
              </div>
              <div className="form-group full">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} value={form.notes}
                  onChange={e => setField('notes', e.target.value)} placeholder="First visit, referred by Dr. Joshi…" />
              </div>
            </div>
          )}

          {/* ── Tab 1: Contact & Address ── */}
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

          {/* ── Tab 2: Medical (JSON) ── */}
          {tab === 2 && (
            <div className="form-grid">
              {[
                ['medicalHistory',     'Medical History',     '{"past_illness":"Appendectomy 2010","surgeries":"none"}'],
                ['currentMedications', 'Current Medications', '{"medications":"paracetamol 500mg twice daily"}'],
                ['allergies',          'Allergies',           '{"allergy":"dust, pollen"}'],
                ['chronicConditions',  'Chronic Conditions',  '{"condition":"Hypertension"}'],
                ['immunizations',      'Immunizations',       '{"covid_vaccine":"2 doses + booster","flu":"annual"}'],
                ['familyHistory',      'Family History',      '{"father":"diabetes","mother":"hypertension"}'],
                ['lifestyleFactors',   'Lifestyle Factors',   '{"smoking":false,"alcohol":"occasionally","exercise":"regular"}'],
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

          {/* ── Tab 3: Emergency Contact ── */}
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
              <div className="form-group">
                <label className="form-label">Alternate Phone</label>
                <input className="form-control" value={form.emergencyContactAlternate}
                  onChange={e => setField('emergencyContactAlternate', e.target.value)} placeholder="9876500001" />
              </div>
            </div>
          )}

          {/* ── Tab 4: Insurance ── */}
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
                  placeholder='{"coverage":"full","copay":"500","deductible":"2000"}'
                  value={typeof form.insuranceDetails === 'object'
                    ? JSON.stringify(form.insuranceDetails, null, 2)
                    : (form.insuranceDetails || '')}
                  onChange={e => setField('insuranceDetails', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="tab-nav">
            <button className="btn btn-secondary btn-sm" disabled={tab === 0} onClick={() => setTab(t => t - 1)}>← Prev</button>
            <span className="tab-progress">{tab + 1}/{TABS.length}</span>
            <button className="btn btn-secondary btn-sm" disabled={tab === TABS.length - 1} onClick={() => setTab(t => t + 1)}>Next →</button>
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
