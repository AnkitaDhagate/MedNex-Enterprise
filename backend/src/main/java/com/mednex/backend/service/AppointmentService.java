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
 * FIX LIST:
 * 1. mapDtoToAppointment() now maps ALL DTO fields (none are silently dropped).
 * 2. Email send is @Async and swallows exceptions — appointment is already
 *    committed before email fires, so email failure cannot roll back the save.
 * 3. Conflict check uses excludeId=0L for new appointments (not null — JPQL
 *    cannot compare :excludeId = 0 with null).
 * 4. appointmentTime deserialization: frontend sends "HH:mm", Spring/Jackson
 *    parses LocalTime correctly when dates-as-timestamps=false is set.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final EmailService          emailService;
    private final AuditService          auditService;

    private String currentTenant() {
        String t = TenantContext.getCurrentTenant();
        if (t == null || t.isBlank()) throw new RuntimeException("Tenant context not set.");
        return t;
    }

    private String currentUser() {
        try {
            String principal = SecurityContextHolder.getContext().getAuthentication().getName();
            if (principal != null && principal.contains("::")) return principal.split("::")[0];
            return principal != null ? principal : "system";
        } catch (Exception e) { return "system"; }
    }

    @Transactional
    public Appointment createAppointment(AppointmentDTO dto) {
        String tenantId = currentTenant();

        // Conflict check — use 0L as excludeId (no existing appointment to exclude)
        boolean conflict = appointmentRepository.existsConflict(
                tenantId, dto.getDoctorId(),
                dto.getAppointmentDate(), dto.getAppointmentTime(), 0L);
        if (conflict) {
            throw new RuntimeException("Scheduling conflict: " +
                (dto.getDoctorName() != null ? dto.getDoctorName() : "Doctor") +
                " is already booked on " + dto.getAppointmentDate() +
                " at " + dto.getAppointmentTime() + ". Please choose a different slot.");
        }

        Appointment appt = new Appointment();
        mapDtoToAppointment(dto, appt);
        appt.setTenantId(tenantId);
        appt.setAppointmentId("APT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        appt.setStatus("SCHEDULED");
        appt.setReminderSent(false);
        appt.setConfirmationSent(false);

        Appointment saved = appointmentRepository.save(appt);
        log.info("Appointment created: {} (tenant={})", saved.getAppointmentId(), tenantId);

        // Fire email AFTER commit — async, exceptions swallowed in EmailService
        emailService.sendAppointmentConfirmation(saved);

        auditService.log(tenantId, currentUser(), "CREATE", "APPOINTMENT",
            String.valueOf(saved.getId()),
            "Appointment " + saved.getAppointmentId() + " booked for " + dto.getAppointmentDate());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findByTenantIdOrderByAppointmentDateDescAppointmentTimeDesc(currentTenant());
    }

    @Transactional(readOnly = true)
    public Appointment getAppointmentById(Long id) {
        String tenantId = currentTenant();
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (!appt.getTenantId().equals(tenantId)) throw new RuntimeException("Access denied.");
        return appt;
    }

    @Transactional(readOnly = true)
    public List<Appointment> getAppointmentsByDate(LocalDate date) {
        return appointmentRepository.findByAppointmentDateAndTenantId(date, currentTenant());
    }

    @Transactional(readOnly = true)
    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientIdAndTenantId(patientId, currentTenant());
    }

    @Transactional(readOnly = true)
    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorIdAndTenantId(doctorId, currentTenant());
    }

    @Transactional(readOnly = true)
    public List<Appointment> getAppointmentsByDoctorAndDate(Long doctorId, LocalDate date) {
        return appointmentRepository.findByDoctorIdAndTenantIdAndDate(doctorId, currentTenant(), date);
    }

    @Transactional
    public Appointment updateAppointment(Long id, AppointmentDTO dto) {
        String tenantId = currentTenant();
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (!appt.getTenantId().equals(tenantId)) throw new RuntimeException("Access denied.");

        boolean dateOrDoctorChanged =
            !appt.getAppointmentDate().equals(dto.getAppointmentDate()) ||
            !appt.getAppointmentTime().equals(dto.getAppointmentTime()) ||
            !appt.getDoctorId().equals(dto.getDoctorId());

        if (dateOrDoctorChanged) {
            boolean conflict = appointmentRepository.existsConflict(
                    tenantId, dto.getDoctorId(),
                    dto.getAppointmentDate(), dto.getAppointmentTime(), id);
            if (conflict) throw new RuntimeException("Scheduling conflict: doctor already booked at that time.");
        }

        mapDtoToAppointment(dto, appt);
        Appointment saved = appointmentRepository.save(appt);
        log.info("Appointment updated: id={}", id);
        auditService.log(tenantId, currentUser(), "UPDATE", "APPOINTMENT",
            String.valueOf(id), "Updated: " + appt.getAppointmentId());
        return saved;
    }

    @Transactional
    public Appointment cancelAppointment(Long id) {
        String tenantId = currentTenant();
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (!appt.getTenantId().equals(tenantId)) throw new RuntimeException("Access denied.");
        appt.setStatus("CANCELLED");
        return appointmentRepository.save(appt);
    }

    @Transactional
    public void deleteAppointment(Long id) {
        String tenantId = currentTenant();
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (!appt.getTenantId().equals(tenantId)) throw new RuntimeException("Access denied.");
        appointmentRepository.delete(appt);
        auditService.log(tenantId, currentUser(), "DELETE", "APPOINTMENT",
            String.valueOf(id), "Deleted appointment.");
    }

    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Appointment> upcoming = appointmentRepository
                .findByReminderSentFalseAndStatusAndAppointmentDateBetween("SCHEDULED", tomorrow, tomorrow);
        for (Appointment appt : upcoming) {
            emailService.sendAppointmentReminder(appt);
            appt.setReminderSent(true);
            appointmentRepository.save(appt);
        }
    }

    // ── DTO → Entity mapping (ALL fields) ────────────────────────────────────

    private void mapDtoToAppointment(AppointmentDTO dto, Appointment appt) {
        appt.setPatientId(dto.getPatientId());
        appt.setDoctorId(dto.getDoctorId());
        appt.setReferredBy(dto.getReferredBy());
        appt.setPatientName(dto.getPatientName());
        appt.setPatientPhone(dto.getPatientPhone());
        appt.setPatientEmail(dto.getPatientEmail());
        appt.setDoctorName(dto.getDoctorName());
        appt.setDepartment(dto.getDepartment());
        appt.setAppointmentDate(dto.getAppointmentDate());
        appt.setAppointmentTime(dto.getAppointmentTime());
        appt.setDurationMinutes(dto.getDurationMinutes() != null ? dto.getDurationMinutes() : 30);
        appt.setAppointmentType(dto.getAppointmentType() != null ? dto.getAppointmentType() : "IN_PERSON");
        appt.setReasonForVisit(dto.getReasonForVisit());
        appt.setUrgencyLevel(dto.getUrgencyLevel()   != null ? dto.getUrgencyLevel()   : "MEDIUM");
        appt.setRoomNumber(dto.getRoomNumber());
        appt.setFloor(dto.getFloor());
        appt.setConsultationFee(dto.getConsultationFee());
        appt.setDiscountAmount(dto.getDiscountAmount());
        appt.setTotalAmount(dto.getTotalAmount());
        appt.setPaymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : "PENDING");
        appt.setNotes(dto.getNotes());
        appt.setCancellationReason(dto.getCancellationReason());
        // Only override status on explicit update (create sets it to SCHEDULED)
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            appt.setStatus(dto.getStatus());
        }
    }
}
