package com.mednex.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_doctor_date_time",
                columnNames = {"doctor_id", "appointment_date", "appointment_time", "tenant_id"}
        ))
@Data
@NoArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appointment_id", unique = true, nullable = false)
    private String appointmentId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "patient_name")
    private String patientName;

    @Column(name = "doctor_name")
    private String doctorName;

    @Column(name = "department")
    private String department;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 30;

    // SCHEDULED, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
    @Column(nullable = false)
    private String status = "SCHEDULED";

    @Column(name = "reason_for_visit", columnDefinition = "TEXT")
    private String reasonForVisit;

    @Column(name = "appointment_type")
    private String appointmentType; // IN_PERSON, TELECONSULT

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false;

    @Column(name = "confirmation_sent")
    private Boolean confirmationSent = false;

    @Column(name = "patient_email")
    private String patientEmail;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
