package com.mednex.backend.repository;

import com.mednex.backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByTenantIdOrderByAppointmentDateDescAppointmentTimeDesc(String tenantId);

    List<Appointment> findByPatientIdAndTenantId(Long patientId, String tenantId);

    List<Appointment> findByDoctorIdAndTenantId(Long doctorId, String tenantId);

    List<Appointment> findByAppointmentDateAndTenantId(LocalDate date, String tenantId);

    /**
     * Week 3 — Simple slot conflict check:
     * Returns true if the doctor already has a non-cancelled appointment
     * at the exact same date+time in the same tenant (excluding the given id
     * for update scenarios — pass 0L or null when creating).
     */
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE " +
            "a.tenantId = :tenantId AND " +
            "a.doctorId = :doctorId AND " +
            "a.appointmentDate = :date AND " +
            "a.appointmentTime = :time AND " +
            "a.status NOT IN ('CANCELLED', 'NO_SHOW') AND " +
            "(:excludeId = 0 OR a.id <> :excludeId)")
    boolean existsConflict(@Param("tenantId")   String tenantId,
                           @Param("doctorId")   Long doctorId,
                           @Param("date")       LocalDate date,
                           @Param("time")       LocalTime time,
                           @Param("excludeId")  Long excludeId);

    List<Appointment> findByReminderSentFalseAndStatusAndAppointmentDateBetween(
            String status, LocalDate from, LocalDate to);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, String status);
}
