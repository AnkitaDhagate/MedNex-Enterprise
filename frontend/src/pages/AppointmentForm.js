// src/pages/AppointmentForm.js
import React, { useState, useEffect } from 'react';
import { appointmentAPI } from '../services/api';
import { toast } from 'react-toastify';
import './AppointmentForm.css';

/**
 * FIXES applied (matched to AppointmentDTO.java):
 *
 * AppointmentDTO has ONLY these fields:
 *   appointmentId, patientId, doctorId, patientName, doctorName, department,
 *   appointmentDate, appointmentTime, durationMinutes, status, reasonForVisit,
 *   appointmentType, patientEmail, notes
 *
 * Previous form was sending: referredBy, patientPhone, urgencyLevel, symptoms,
 * roomNumber, floor, consultationFee, discountAmount, totalAmount, paymentStatus,
 * cancellationReason — NONE of these exist in AppointmentDTO.
 * Jackson default is FAIL_ON_UNKNOWN_PROPERTIES=true → 400 Bad Request on every submit.
 *
 * FIX: Only send the 14 fields that AppointmentDTO actually declares.
 * The extra columns (urgency, billing etc.) exist in DB but the backend DTO doesn't expose
 * them yet — they must be added to AppointmentDTO if needed in future.
 *
 * appointmentTime: sent as "HH:mm" string → Jackson deserializes to LocalTime correctly.
 */

const EMPTY = {
  appointmentId:    '',
  patientId:        '',
  doctorId:         '',
  patientName:      '',
  doctorName:       '',
  department:       '',
  appointmentDate:  '',
  appointmentTime:  '',
  durationMinutes:  30,
  appointmentType:  'CONSULTATION',
  status:           'SCHEDULED',
  reasonForVisit:   '',
  patientEmail:     '',
  notes:            '',
};

const DEPARTMENTS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology',
  'General Medicine', 'Dermatology', 'Ophthalmology', 'ENT', 'Oncology',
  'Psychiatry', 'Radiology', 'Emergency', 'ICU',
];

// 08:00 → 20:30 in HH:mm — backend LocalTime expects "HH:mm"
const TIMES = Array.from({ length: 26 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

export default function AppointmentForm({ appointment, onClose, onSaved }) {
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    if (appointment) {
      setForm({
        ...EMPTY,
        appointmentId:   appointment.appointmentId   || '',
        patientId:       appointment.patientId       || '',
        doctorId:        appointment.doctorId        || '',
        patientName:     appointment.patientName     || '',
        doctorName:      appointment.doctorName      || '',
        department:      appointment.department      || '',
        appointmentDate: appointment.appointmentDate || '',
        // Backend may return "09:30:00" — trim to "HH:mm"
        appointmentTime: appointment.appointmentTime
          ? String(appointment.appointmentTime).substring(0, 5)
          : '',
        durationMinutes: appointment.durationMinutes || 30,
        appointmentType: appointment.appointmentType || 'CONSULTATION',
        status:          appointment.status          || 'SCHEDULED',
        reasonForVisit:  appointment.reasonForVisit  || '',
        patientEmail:    appointment.patientEmail    || '',
        notes:           appointment.notes           || '',
      });
    }
  }, [appointment]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setConflict(null);
  };

  const buildPayload = () => ({
    appointmentId:    form.appointmentId   || undefined,
    patientId:        form.patientId       ? Number(form.patientId)       : null,
    doctorId:         form.doctorId        ? Number(form.doctorId)        : null,
    patientName:      form.patientName,
    doctorName:       form.doctorName,
    department:       form.department      || null,
    appointmentDate:  form.appointmentDate,
    appointmentTime:  form.appointmentTime,
    durationMinutes:  Number(form.durationMinutes),
    appointmentType:  form.appointmentType || null,
    status:           form.status,
    reasonForVisit:   form.reasonForVisit  || null,
    patientEmail:     form.patientEmail    || null,
    notes:            form.notes           || null,
  });

  const handleSubmit = async () => {
    if (!form.patientName.trim()) {
      toast.error('Patient name is required'); return;
    }
    if (!form.doctorName.trim()) {
      toast.error('Doctor name is required'); return;
    }
    if (!form.appointmentDate) {
      toast.error('Appointment date is required'); return;
    }
    if (!form.appointmentTime) {
      toast.error('Appointment time is required'); return;
    }
    if (!form.doctorId) {
      toast.error('Doctor ID is required for conflict detection'); return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (appointment?.id) {
        await appointmentAPI.update(appointment.id, payload);
        toast.success('Appointment updated successfully!');
      } else {
        await appointmentAPI.create(payload);
        toast.success('Appointment booked! Confirmation email sent.');
      }
      onSaved();
    } catch (e) {
      if (e.response?.status === 409) {
        const msg = e.response.data?.error || 'Doctor is already booked at this time!';
        setConflict(msg);
        toast.error('⚠️ Scheduling conflict detected!');
      } else {
        toast.error(e.response?.data?.error || 'Booking failed. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div>
            <h2>{appointment ? 'Edit Appointment' : 'Book New Appointment'}</h2>
            <p>Conflict detection enabled — double bookings are prevented automatically</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {conflict && (
            <div className="conflict-alert">
              ⚠️ <strong>Scheduling Conflict:</strong> {conflict}
            </div>
          )}

          <div className="form-grid">

            {/* Patient */}
            <div className="form-group full">
              <label className="form-label">Patient Name *</label>
              <input className="form-control" value={form.patientName}
                onChange={e => set('patientName', e.target.value)} placeholder="Ankita Patil" />
            </div>
            <div className="form-group">
              <label className="form-label">Patient ID</label>
              <input type="number" className="form-control" value={form.patientId}
                onChange={e => set('patientId', e.target.value)} placeholder="Numeric Patient ID" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Patient Email</label>
              <input type="email" className="form-control" value={form.patientEmail}
                onChange={e => set('patientEmail', e.target.value)} placeholder="For confirmation email" />
            </div>

            {/* Doctor */}
            <div className="form-group">
              <label className="form-label">Doctor Name *</label>
              <input className="form-control" value={form.doctorName}
                onChange={e => set('doctorName', e.target.value)} placeholder="Dr. Sharma" />
            </div>
            <div className="form-group">
              <label className="form-label">
                Doctor ID * <small style={{ color: '#f4a261' }}>(required for conflict check)</small>
              </label>
              <input type="number" className="form-control" value={form.doctorId}
                onChange={e => set('doctorId', e.target.value)} placeholder="Numeric Doctor ID" min="1" />
            </div>

            {/* Scheduling */}
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-control" value={form.department}
                onChange={e => set('department', e.target.value)}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Appointment Type</label>
              <select className="form-control" value={form.appointmentType}
                onChange={e => set('appointmentType', e.target.value)}>
                <option value="CONSULTATION">Consultation</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="IN_PERSON">In Person</option>
                <option value="TELECONSULT">Teleconsult</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input type="date" className="form-control" value={form.appointmentDate}
                onChange={e => set('appointmentDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">Time * <small style={{ color: '#8899b4' }}>(24h)</small></label>
              <select className="form-control" value={form.appointmentTime}
                onChange={e => set('appointmentTime', e.target.value)}>
                <option value="">Select Time</option>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <select className="form-control" value={form.durationMinutes}
                onChange={e => set('durationMinutes', Number(e.target.value))}>
                {[15, 30, 45, 60, 90].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status}
                onChange={e => set('status', e.target.value)}>
                {['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Visit details */}
            <div className="form-group full">
              <label className="form-label">Reason for Visit</label>
              <textarea className="form-control" rows={2} value={form.reasonForVisit}
                onChange={e => set('reasonForVisit', e.target.value)}
                placeholder="Chief complaint or reason for visit…" />
            </div>
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes}
                onChange={e => set('notes', e.target.value)} placeholder="Additional notes…" />
            </div>
          </div>

          <div className="conflict-info-box">
            <span>🛡</span>
            <span>The system automatically prevents double-booking of the same doctor at the same date and time.</span>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? '⏳ Booking…' : (appointment ? '✓ Update Appointment' : '✓ Book Appointment')}
          </button>
        </div>
      </div>
    </div>
  );
}
