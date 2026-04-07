import React, { useState, useEffect } from 'react';
import { appointmentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './AppointmentForm.css';

const EMPTY = {
  patientId:'', patientName:'', patientEmail:'',
  doctorId:'', doctorName:'', department:'',
  appointmentDate:'', appointmentTime:'', durationMinutes:30,
  appointmentType:'IN_PERSON', status:'SCHEDULED',
  reasonForVisit:'', notes:'',
};

const DEPARTMENTS = ['Cardiology','Neurology','Orthopedics','Pediatrics','Gynecology','General Medicine','Dermatology','Ophthalmology','ENT','Oncology','Psychiatry','Radiology'];
const TIMES = Array.from({length:28},(_,i)=>{const h=Math.floor(i/2)+8; const m=i%2===0?'00':'30'; return `${String(h).padStart(2,'0')}:${m}`;});

export default function AppointmentForm({ appointment, onClose, onSaved }) {
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    if (appointment) {
      setForm({ ...EMPTY, ...appointment,
        appointmentDate: appointment.appointmentDate || '',
        appointmentTime: appointment.appointmentTime || '',
      });
    }
  }, [appointment]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setConflict(null);
  };

  const handleSubmit = async () => {
    if (!form.patientName || !form.doctorName || !form.appointmentDate || !form.appointmentTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      if (appointment?.id) {
        await appointmentAPI.update(appointment.id, form);
        toast.success('Appointment updated!');
      } else {
        await appointmentAPI.create(form);
        toast.success('Appointment booked!');
      }
      onSaved();
    } catch (e) {
      if (e.response?.status === 409) {
        setConflict(e.response.data?.error || 'Doctor is already booked at this time!');
        toast.error('⚠️ Scheduling conflict detected!');
      } else {
        toast.error(e.response?.data?.error || 'Booking failed');
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{maxWidth:620}}>
        <div className="modal-header">
          <div>
            <h2>{appointment ? 'Edit Appointment' : 'Book New Appointment'}</h2>
            <p>Conflict detection enabled — double bookings are prevented</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Conflict Alert */}
          {conflict && (
            <div className="conflict-alert">
              ⚠️ <strong>Scheduling Conflict:</strong> {conflict}
            </div>
          )}

          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">Patient Name *</label>
              <input className="form-control" value={form.patientName} onChange={e=>set('patientName',e.target.value)} placeholder="Patient full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Patient ID</label>
              <input className="form-control" value={form.patientId} onChange={e=>set('patientId',e.target.value)} placeholder="Patient ID" type="number" />
            </div>
            <div className="form-group">
              <label className="form-label">Patient Email</label>
              <input type="email" className="form-control" value={form.patientEmail} onChange={e=>set('patientEmail',e.target.value)} placeholder="For confirmation email" />
            </div>
            <div className="form-group">
              <label className="form-label">Doctor Name *</label>
              <input className="form-control" value={form.doctorName} onChange={e=>set('doctorName',e.target.value)} placeholder="Dr. Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Doctor ID *</label>
              <input className="form-control" value={form.doctorId} onChange={e=>set('doctorId',e.target.value)} placeholder="Doctor ID" type="number" />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-control" value={form.department} onChange={e=>set('department',e.target.value)}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Appointment Type</label>
              <select className="form-control" value={form.appointmentType} onChange={e=>set('appointmentType',e.target.value)}>
                <option value="IN_PERSON">🏥 In Person</option>
                <option value="TELECONSULT">💻 Teleconsult</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input type="date" className="form-control" value={form.appointmentDate} onChange={e=>set('appointmentDate',e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">Time *</label>
              <select className="form-control" value={form.appointmentTime} onChange={e=>set('appointmentTime',e.target.value)}>
                <option value="">Select Time</option>
                {TIMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <select className="form-control" value={form.durationMinutes} onChange={e=>set('durationMinutes',Number(e.target.value))}>
                {[15,30,45,60,90].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
                {['SCHEDULED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">Reason for Visit</label>
              <textarea className="form-control" rows={2} value={form.reasonForVisit} onChange={e=>set('reasonForVisit',e.target.value)} placeholder="Chief complaint or reason…"></textarea>
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Additional notes…"></textarea>
            </div>
          </div>

          {/* Conflict info box */}
          <div className="conflict-info-box">
            <span>🛡</span>
            <span>The system will automatically prevent double-booking of doctors at the same date and time.</span>
          </div>
        </div>

        <div className="modal-footer" style={{justifyContent:'flex-end'}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? '⏳ Booking…' : (appointment ? '✓ Update' : '✓ Book Appointment')}
          </button>
        </div>
      </div>
    </div>
  );
}
