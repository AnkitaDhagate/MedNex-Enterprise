package com.mednex.backend.service;

import com.mednex.backend.dto.AppointmentDTO;
import com.mednex.backend.model.Appointment;
import com.mednex.backend.repository.AppointmentRepository;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * FIXED:
 *  - Added deleteAppointment(Long id) — frontend calls DELETE /appointments/{id}
 *  - Added getAppointmentsByDoctorAndDate(Long doctorId, LocalDate date) — frontend
 *    calls GET /appointments/doctor/{id}?date=...
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;
    private final AuditService auditService;

    private String currentTenant() {
        String t = TenantContext.getCurrentTenant();
        if (t == null || t.isBlank()) throw new RuntimeException("Tenant context not set.");
        return t;
    }

    private String currentUser() {
        try { return SecurityContextHolder.getContext().getAuthentication().getName(); }
        catch (Exception e) { return "system"; }
    }

    @Transactional
    public Appointment createAppointment(AppointmentDTO dto) {
        String tenantId = currentTenant();

        boolean conflict = appointmentRepository.existsConflict(
                tenantId, dto.getDoctorId(),
                dto.getAppointmentDate(), dto.getAppointmentTime(), 0L);

        if (conflict) {
            throw new RuntimeException(
                    "Conflict detected: Dr. " + dto.getDoctorName() +
                    " is already booked on " + dto.getAppointmentDate() +
                    " at " + dto.getAppointmentTime() +
                    ". Please choose a different time slot.");
        }

        Appointment appt = new Appointment();
        mapDtoToAppointment(dto, appt);
        appt.setTenantId(tenantId);
        appt.setAppointmentId("APT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        appt.setStatus("SCHEDULED");

        Appointment saved = appointmentRepository.save(appt);

        emailService.sendAppointmentConfirmation(saved);
        saved.setConfirmationSent(true);
        appointmentRepository.save(saved);

        auditService.log(tenantId, currentUser(), "CREATE", "APPOINTMENT",
                String.valueOf(saved.getId()),
                "Appointment booked for doctor " + dto.getDoctorId() + " on " + dto.getAppointmentDate());

        return saved;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findByTenantIdOrderByAppointmentDateDescAppointmentTimeDesc(currentTenant());
    }

    public Appointment getAppointmentById(Long id) {
        String tenantId = currentTenant();
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (!appt.getTenantId().equals(tenantId)) throw new RuntimeException("Cross-tenant access denied.");
        return appt;
    }

    public List<Appointment> getAppointmentsByDate(LocalDate date) {
        return appointmentRepository.findByAppointmentDateAndTenantId(date, currentTenant());
    }

    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientIdAndTenantId(patientId, currentTenant());
    }

    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorIdAndTenantId(doctorId, currentTenant());
    }

    /**
     * ADDED: Filter by doctor + specific date.
     * Frontend: appointmentAPI.getByDoctor(doctorId, date)
     */
    public List<Appointment> getAppointmentsByDoctorAndDate(Long doctorId, LocalDate date) {
        String tenantId = currentTenant();
        return appointmentRepository.findByDoctorIdAndTenantIdAndDate(doctorId, tenantId, date);
    }

    @Transactional
    public Appointment updateAppointment(Long id, AppointmentDTO dto) {
        String tenantId = currentTenant();
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (!appt.getTenantId().equals(tenantId)) throw new RuntimeException("Cross-tenant access denied.");

        if (!appt.getAppointmentDate().equals(dto.getAppointmentDate()) ||
                !appt.getAppointmentTime().equals(dto.getAppointmentTime()) ||
                !appt.getDoctorId().equals(dto.getDoctorId())) {

            boolean conflict = appointmentRepository.existsConflict(
                    tenantId, dto.getDoctorId(),
                    dto.getAppointmentDate(), dto.getAppointmentTime(), id);
            if (conflict) {
                throw new RuntimeException("Conflict detected: doctor already booked at that time.");
            }
        }

        mapDtoToAppointment(dto, appt);
        Appointment saved = appointmentRepository.save(appt);
        auditService.log(tenantId, currentUser(), "UPDATE", "APPOINTMENT",
                String.valueOf(id), "Updated appointment: " + appt.getAppointmentId());
        return saved;
    }

    @Transactional
    public Appointment cancelAppointment(Long id) {
        String tenantId = currentTenant();
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (!appt.getTenantId().equals(tenantId)) throw new RuntimeException("Cross-tenant access denied.");
        appt.setStatus("CANCELLED");
        Appointment saved = appointmentRepository.save(appt);
        auditService.log(tenantId, currentUser(), "UPDATE", "APPOINTMENT",
                String.valueOf(id), "Cancelled appointment: " + appt.getAppointmentId());
        return saved;
    }

    /**
     * ADDED: Hard-delete appointment.
     * Frontend: appointmentAPI.delete(id) → DELETE /appointments/{id}
     */
    @Transactional
    public void deleteAppointment(Long id) {
        String tenantId = currentTenant();
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (!appt.getTenantId().equals(tenantId)) throw new RuntimeException("Cross-tenant access denied.");
        appointmentRepository.delete(appt);
        auditService.log(tenantId, currentUser(), "DELETE", "APPOINTMENT",
                String.valueOf(id), "Deleted appointment: " + appt.getAppointmentId());
    }

    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        log.info("Running daily reminder job for appointments on {}", tomorrow);

        List<Appointment> upcoming = appointmentRepository
                .findByReminderSentFalseAndStatusAndAppointmentDateBetween(
                        "SCHEDULED", tomorrow, tomorrow);

        for (Appointment appt : upcoming) {
            emailService.sendAppointmentReminder(appt);
            appt.setReminderSent(true);
            appointmentRepository.save(appt);
            log.info("Reminder sent for appointment {}", appt.getAppointmentId());
        }
    }

    private void mapDtoToAppointment(AppointmentDTO dto, Appointment appt) {
        appt.setPatientId(dto.getPatientId());
        appt.setDoctorId(dto.getDoctorId());
        appt.setPatientName(dto.getPatientName());
        appt.setDoctorName(dto.getDoctorName());
        appt.setDepartment(dto.getDepartment());
        appt.setAppointmentDate(dto.getAppointmentDate());
        appt.setAppointmentTime(dto.getAppointmentTime());
        appt.setDurationMinutes(dto.getDurationMinutes() != null ? dto.getDurationMinutes() : 30);
        appt.setReasonForVisit(dto.getReasonForVisit());
        appt.setAppointmentType(dto.getAppointmentType());
        appt.setPatientEmail(dto.getPatientEmail());
        appt.setNotes(dto.getNotes());
        if (dto.getStatus() != null) appt.setStatus(dto.getStatus());
    }
}
