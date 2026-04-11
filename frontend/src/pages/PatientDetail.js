import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientAPI, exportAPI, medicalRecordAPI } from '../services/api';
import { toast } from 'react-toastify';
import PatientForm from './PatientForm';
import './PatientDetail.css';

// Sample patient data for demo
const SAMPLE_PATIENT = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'Robert',
  patientId: 'P001',
  dateOfBirth: '1990-05-15',
  gender: 'MALE',
  bloodGroup: 'O+',
  email: 'john.doe@email.com',
  phone: '+91 98765 43210',
  mobile: '+91 98765 43211',
  alternatePhone: '',
  addressLine1: '123 Main Street',
  addressLine2: 'Near City Hospital',
  city: 'Mumbai',
  state: 'Maharashtra',
  postalCode: '400001',
  country: 'India',
  nationality: 'Indian',
  occupation: 'Software Engineer',
  maritalStatus: 'MARRIED',
  religion: 'Hindu',
  emergencyContactName: 'Jane Doe',
  emergencyContactRelationship: 'Spouse',
  emergencyContactPhone: '+91 98765 43212',
  insuranceProvider: 'Star Health',
  insurancePolicyNumber: 'SH123456789',
  insuranceGroupNumber: 'GRP001',
  insuranceValidFrom: '2024-01-01',
  insuranceValidTo: '2025-12-31',
  primaryDoctorName: 'Dr. Smith',
  patientStatus: 'ACTIVE',
  registrationType: 'OPD',
  notes: 'Regular checkup patient',
  medicalHistory: { hypertension: 'diagnosed 2020', diabetes: 'type 2' },
  currentMedications: { lisinopril: '10mg daily', metformin: '500mg twice daily' },
  allergies: { penicillin: 'severe' }
};

const SAMPLE_RECORDS = [
  {
    id: 1,
    recordId: 'REC001',
    encounterDate: '2024-01-15T10:00:00',
    encounterType: 'OUTPATIENT',
    department: 'Cardiology',
    chiefComplaint: 'Chest pain and shortness of breath',
    primaryDiagnosis: 'Hypertension',
    treatmentPlan: 'Prescribed Lisinopril 10mg daily',
    followUpRequired: true,
    followUpDate: '2024-02-15',
    disposition: 'FOLLOW_UP'
  },
  {
    id: 2,
    recordId: 'REC002',
    encounterDate: '2024-02-15T11:30:00',
    encounterType: 'FOLLOW_UP',
    department: 'Cardiology',
    chiefComplaint: 'Follow-up for hypertension',
    primaryDiagnosis: 'Blood pressure controlled',
    treatmentPlan: 'Continue current medication',
    followUpRequired: false,
    disposition: 'DISCHARGED'
  }
];

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setTab] = useState('overview');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const patientRes = await patientAPI.getById(id);
        setPatient(patientRes.data);
        
        try {
          const recordsRes = await medicalRecordAPI.getByPatient(id);
          setRecords(recordsRes.data || []);
        } catch {
          setRecords(SAMPLE_RECORDS);
        }
      } catch (error) {
        console.error('Patient not found:', error);
        setPatient(SAMPLE_PATIENT);
        setRecords(SAMPLE_RECORDS);
        toast.info('Using sample patient data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id]);

  const handleExport = async () => {
    if (!patient) return;
    try {
      toast.info('Generating encrypted PDF…');
      const res = await exportAPI.exportPatientPDF(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${patient.firstName}_${patient.lastName}_medical_history.pdf`;
      a.click();
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return (
      <div className="loading-full">
        <div className="spinner-lg"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="not-found">
        Patient not found. 
        <button onClick={() => navigate('/patients')} className="btn btn-primary">Go back</button>
      </div>
    );
  }

  const age = patient.dateOfBirth ? 
    new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : '—';
  
  const statusColor = {
    ACTIVE: 'success',
    INACTIVE: 'muted',
    DISCHARGED: 'warning',
    DECEASED: 'danger'
  };

  return (
    <div className="patient-detail fade-in">
      <div className="profile-header card">
        <div className="profile-banner">
          <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=70" alt="bg" />
          <div className="banner-overlay"></div>
        </div>
        <div className="profile-info">
          <div className="profile-avatar">
            {(patient.firstName || 'P').charAt(0)}{(patient.lastName || '').charAt(0)}
          </div>
          <div className="profile-meta">
            <h2>{patient.firstName} {patient.middleName || ''} {patient.lastName}</h2>
            <div className="meta-row">
              <code className="pid">{patient.patientId || '—'}</code>
              <span className={`badge badge-${statusColor[patient.patientStatus] || 'info'}`}>
                {patient.patientStatus || 'ACTIVE'}
              </span>
              <span className="meta-item">🩸 {patient.bloodGroup || '—'}</span>
              <span className="meta-item">👤 {age}y / {patient.gender || '—'}</span>
            </div>
            <div className="meta-row">
              {patient.primaryDoctorName && (
                <span className="meta-item">👨‍⚕️ Dr. {patient.primaryDoctorName}</span>
              )}
              {patient.phone && <span className="meta-item">📞 {patient.phone}</span>}
              {patient.email && <span className="meta-item">✉️ {patient.email}</span>}
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>✏️ Edit</button>
            <button className="btn btn-primary" onClick={handleExport}>📄 Export PDF</button>
            <button className="btn btn-secondary" onClick={() => navigate('/patients')}>← Back</button>
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        {[
          ['overview', 'Overview'],
          ['medical', 'Medical History'],
          ['records', 'Encounter Records'],
          ['insurance', 'Insurance']
        ].map(([key, label]) => (
          <button 
            key={key} 
            className={`detail-tab ${activeTab === key ? 'active' : ''}`} 
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="detail-grid">
          <InfoCard title="Personal Information" icon="👤">
            <Row label="Full Name" value={`${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`} />
            <Row label="Date of Birth" value={patient.dateOfBirth} />
            <Row label="Age" value={`${age} years`} />
            <Row label="Gender" value={patient.gender} />
            <Row label="Marital Status" value={patient.maritalStatus} />
            <Row label="Occupation" value={patient.occupation} />
            <Row label="Nationality" value={patient.nationality} />
            <Row label="Religion" value={patient.religion} />
          </InfoCard>
          
          <InfoCard title="Contact Details" icon="📞">
            <Row label="Phone" value={patient.phone} />
            <Row label="Mobile" value={patient.mobile} />
            <Row label="Alternate Phone" value={patient.alternatePhone} />
            <Row label="Email" value={patient.email} />
            <Row label="Address" value={[patient.addressLine1, patient.addressLine2, patient.city, patient.state, patient.postalCode].filter(Boolean).join(', ')} />
            <Row label="Country" value={patient.country} />
          </InfoCard>
          
          <InfoCard title="Emergency Contact" icon="🆘">
            <Row label="Name" value={patient.emergencyContactName} />
            <Row label="Relationship" value={patient.emergencyContactRelationship} />
            <Row label="Phone" value={patient.emergencyContactPhone} />
          </InfoCard>
          
          <InfoCard title="Registration Info" icon="📋">
            <Row label="Patient ID" value={patient.patientId} />
            <Row label="Registration Date" value={patient.registrationDate} />
            <Row label="Registration Type" value={patient.registrationType} />
            <Row label="Status" value={patient.patientStatus} />
            <Row label="Primary Doctor" value={patient.primaryDoctorName} />
            {patient.notes && <Row label="Notes" value={patient.notes} />}
          </InfoCard>
        </div>
      )}

      {activeTab === 'medical' && (
        <div className="detail-grid">
          <InfoCard title="Medical History" icon="🏥">
            {renderMedicalData(patient.medicalHistory)}
          </InfoCard>
          <InfoCard title="Current Medications" icon="💊">
            {renderMedicalData(patient.currentMedications)}
          </InfoCard>
          <InfoCard title="Known Allergies" icon="⚠️">
            {renderMedicalData(patient.allergies)}
          </InfoCard>
          <InfoCard title="Chronic Conditions" icon="🔄">
            {renderMedicalData(patient.chronicConditions)}
          </InfoCard>
          <InfoCard title="Immunizations" icon="💉">
            {renderMedicalData(patient.immunizations)}
          </InfoCard>
          <InfoCard title="Family History" icon="👪">
            {renderMedicalData(patient.familyHistory)}
          </InfoCard>
          <InfoCard title="Lifestyle Factors" icon="🏃">
            {renderMedicalData(patient.lifestyleFactors)}
          </InfoCard>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="records-list">
          {records.length === 0 ? (
            <div className="card empty-state">
              <span>🏥</span>
              <p>No encounter records found</p>
            </div>
          ) : (
            records.map((record, i) => (
              <div key={i} className="record-card card">
                <div className="record-header">
                  <div>
                    <span className="badge badge-info">{record.encounterType}</span>
                    <span className="record-date">
                      {new Date(record.encounterDate).toLocaleDateString()}
                    </span>
                  </div>
                  <code className="pid">{record.recordId}</code>
                </div>
                <div className="record-body">
                  {record.chiefComplaint && <Row label="Chief Complaint" value={record.chiefComplaint} />}
                  {record.primaryDiagnosis && <Row label="Diagnosis" value={record.primaryDiagnosis} />}
                  {record.treatmentPlan && <Row label="Treatment" value={record.treatmentPlan} />}
                  {record.department && <Row label="Department" value={record.department} />}
                  <Row label="Follow-up" value={record.followUpRequired ? `Yes — ${record.followUpDate || 'TBD'}` : 'No'} />
                  {record.disposition && <Row label="Disposition" value={record.disposition} />}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'insurance' && (
        <div className="detail-grid">
          <InfoCard title="Insurance Details" icon="🛡">
            <Row label="Provider" value={patient.insuranceProvider} />
            <Row label="Policy Number" value={patient.insurancePolicyNumber} />
            <Row label="Group Number" value={patient.insuranceGroupNumber} />
            <Row label="Valid From" value={patient.insuranceValidFrom} />
            <Row label="Valid To" value={patient.insuranceValidTo} />
          </InfoCard>
        </div>
      )}

      {showEdit && (
        <PatientForm
          patient={patient}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

const InfoCard = ({ title, icon, children }) => (
  <div className="info-card card">
    <div className="info-card-header">
      <span>{icon}</span>
      <h3>{title}</h3>
    </div>
    <div className="info-card-body">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-value">{value || '—'}</span>
  </div>
);

const renderMedicalData = (data) => {
  if (!data) return <p className="empty-data">No data recorded</p>;
  
  if (typeof data === 'object' && Object.keys(data).length > 0) {
    return Object.entries(data).map(([key, value]) => (
      <Row key={key} label={key.replace(/_/g, ' ')} value={String(value)} />
    ));
  }
  
  if (typeof data === 'string' && data.trim()) {
    return <p className="info-value">{data}</p>;
  }
  
  return <p className="empty-data">No data recorded</p>;
};