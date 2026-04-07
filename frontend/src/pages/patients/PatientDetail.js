import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientAPI, exportAPI, medicalRecordAPI } from '../../services/api';
import { toast } from 'react-toastify';
import PatientForm from './PatientForm';
import './PatientDetail.css';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient]   = useState(null);
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setTab]     = useState('overview');

  useEffect(() => {
    Promise.all([
      patientAPI.getById(id),
      medicalRecordAPI.getByPatient(id).catch(() => ({ data: [] })),
    ]).then(([p, r]) => {
      setPatient(p.data);
      setRecords(r.data || []);
    }).catch(() => toast.error('Patient not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExport = async () => {
    try {
      toast.info('Generating encrypted PDF…');
      const res = await exportAPI.exportPatientPDF(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `${patient.firstName}_${patient.lastName}_history.pdf`; a.click();
      toast.success('PDF exported!');
    } catch { toast.error('Export failed'); }
  };

  if (loading) return <div className="loading-full"><div className="spinner-lg"></div></div>;
  if (!patient) return <div className="not-found">Patient not found. <button onClick={() => navigate('/patients')}>Go back</button></div>;

  const age = patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : '—';
  const sc  = { ACTIVE:'success', INACTIVE:'muted', DISCHARGED:'warning', DECEASED:'danger' };

  return (
    <div className="patient-detail fade-in">
      {/* Profile Header */}
      <div className="profile-header card">
        <div className="profile-banner">
          <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=70" alt="bg" />
          <div className="banner-overlay"></div>
        </div>
        <div className="profile-info">
          <div className="profile-avatar">
            {(patient.firstName||'P').charAt(0)}{(patient.lastName||'').charAt(0)}
          </div>
          <div className="profile-meta">
            <h2>{patient.firstName} {patient.middleName} {patient.lastName}</h2>
            <div className="meta-row">
              <code className="pid">{patient.patientId || '—'}</code>
              <span className={`badge badge-${sc[patient.patientStatus]||'info'}`}>{patient.patientStatus}</span>
              <span className="meta-item">🩸 {patient.bloodGroup?.dbValue || patient.bloodGroup || '—'}</span>
              <span className="meta-item">👤 {age}y / {patient.gender || '—'}</span>
            </div>
            <div className="meta-row">
              {patient.primaryDoctorName && <span className="meta-item">👨‍⚕️ Dr. {patient.primaryDoctorName}</span>}
              {patient.phone && <span className="meta-item">📞 {patient.phone}</span>}
              {patient.email && <span className="meta-item">✉️ {patient.email}</span>}
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>✏️ Edit</button>
            <button className="btn btn-primary"   onClick={handleExport}>📄 Export PDF</button>
            <button className="btn btn-secondary" onClick={() => navigate('/patients')}>← Back</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {[['overview','Overview'],['medical','Medical History'],['records','Encounter Records'],['insurance','Insurance']].map(([k,l]) => (
          <button key={k} className={`detail-tab ${activeTab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="detail-grid">
          <InfoCard title="Personal Information" icon="👤">
            <Row l="Full Name"    v={`${patient.firstName} ${patient.middleName||''} ${patient.lastName}`} />
            <Row l="Date of Birth" v={patient.dateOfBirth} />
            <Row l="Age"          v={`${age} years`} />
            <Row l="Gender"       v={patient.gender} />
            <Row l="Marital Status" v={patient.maritalStatus} />
            <Row l="Occupation"   v={patient.occupation} />
            <Row l="Nationality"  v={patient.nationality} />
            <Row l="Religion"     v={patient.religion} />
          </InfoCard>
          <InfoCard title="Contact Details" icon="📞">
            <Row l="Phone"     v={patient.phone} />
            <Row l="Mobile"    v={patient.mobile} />
            <Row l="Alt Phone" v={patient.alternatePhone} />
            <Row l="Email"     v={patient.email} />
            <Row l="Address"   v={[patient.addressLine1,patient.addressLine2,patient.city,patient.state,patient.postalCode].filter(Boolean).join(', ')} />
            <Row l="Country"   v={patient.country} />
          </InfoCard>
          <InfoCard title="Emergency Contact" icon="🆘">
            <Row l="Name"         v={patient.emergencyContactName} />
            <Row l="Relationship" v={patient.emergencyContactRelationship} />
            <Row l="Phone"        v={patient.emergencyContactPhone} />
          </InfoCard>
          <InfoCard title="Registration Info" icon="📋">
            <Row l="Patient ID"         v={patient.patientId} />
            <Row l="Reg. Date"          v={patient.registrationDate} />
            <Row l="Reg. Type"          v={patient.registrationType} />
            <Row l="Status"             v={patient.patientStatus} />
            <Row l="Primary Doctor"     v={patient.primaryDoctorName} />
            {patient.notes && <Row l="Notes" v={patient.notes} />}
          </InfoCard>
        </div>
      )}

      {activeTab === 'medical' && (
        <div className="detail-grid">
          {[
            { title:'Medical History',      icon:'🏥', data: patient.medicalHistory },
            { title:'Current Medications',  icon:'💊', data: patient.currentMedications },
            { title:'Known Allergies',      icon:'⚠️', data: patient.allergies },
            { title:'Chronic Conditions',   icon:'🔄', data: patient.chronicConditions },
            { title:'Immunizations',        icon:'💉', data: patient.immunizations },
            { title:'Family History',       icon:'👪', data: patient.familyHistory },
            { title:'Lifestyle Factors',    icon:'🏃', data: patient.lifestyleFactors },
          ].map(({ title, icon, data }) => (
            <InfoCard key={title} title={title} icon={icon}>
              {data && typeof data === 'object' ? (
                Object.entries(data).map(([k,v]) => <Row key={k} l={k} v={String(v)} />)
              ) : data ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{String(data)}</p>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data recorded</p>
              )}
            </InfoCard>
          ))}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="records-list">
          {records.length === 0 ? (
            <div className="card empty-state">
              <span>🏥</span><p>No encounter records found</p>
            </div>
          ) : records.map((r, i) => (
            <div key={i} className="record-card card">
              <div className="record-header">
                <div>
                  <span className="badge badge-info">{r.encounterType}</span>
                  <span className="record-date">{r.encounterDate}</span>
                </div>
                <code className="pid">{r.recordId}</code>
              </div>
              <div className="record-body">
                {r.chiefComplaint   && <Row l="Chief Complaint" v={r.chiefComplaint} />}
                {r.primaryDiagnosis && <Row l="Diagnosis"       v={r.primaryDiagnosis} />}
                {r.treatmentPlan    && <Row l="Treatment"       v={r.treatmentPlan} />}
                {r.department       && <Row l="Department"      v={r.department} />}
                <Row l="Follow-up" v={r.followUpRequired ? `Yes — ${r.followUpDate||'TBD'}` : 'No'} />
                {r.disposition && <Row l="Disposition" v={r.disposition} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'insurance' && (
        <div className="detail-grid">
          <InfoCard title="Insurance Details" icon="🛡">
            <Row l="Provider"       v={patient.insuranceProvider} />
            <Row l="Policy Number"  v={patient.insurancePolicyNumber} />
            <Row l="Group Number"   v={patient.insuranceGroupNumber} />
            <Row l="Valid From"     v={patient.insuranceValidFrom} />
            <Row l="Valid To"       v={patient.insuranceValidTo} />
          </InfoCard>
        </div>
      )}

      {showEdit && (
        <PatientForm
          patient={patient}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); window.location.reload(); }}
        />
      )}
    </div>
  );
}

const InfoCard = ({ title, icon, children }) => (
  <div className="info-card card">
    <div className="info-card-header"><span>{icon}</span><h3>{title}</h3></div>
    <div className="info-card-body">{children}</div>
  </div>
);
const Row = ({ l, v }) => (
  <div className="info-row">
    <span className="info-label">{l}</span>
    <span className="info-value">{v || '—'}</span>
  </div>
);
