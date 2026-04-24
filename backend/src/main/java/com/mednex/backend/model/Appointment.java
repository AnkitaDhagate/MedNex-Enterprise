package com.mednex.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * FIXED — Added all columns that were in the schema and form but missing from entity:
 * referredBy, patientPhone, doctorName, urgencyLevel, roomNumber, floor,
 * consultationFee, discountAmount, totalAmount, paymentStatus,
 * cancellationReason, cancelledAt, confirmationSent.
 * Without these, Hibernate silently ignored the fields → data loss on save.
 */
@Entity
@Table(name = "appointments",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_doctor_date_time_tenant",
        columnNames = {"doctor_id","appointment_date","appointment_time","tenant_id"}
    )
)
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

    @Column(name = "referred_by")
    private Long referredBy;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 30;

    @Column(name = "appointment_type")
    private String appointmentType;

    @Column(nullable = false)
    private String status = "SCHEDULED";

    @Column(name = "patient_name")
    private String patientName;

    @Column(name = "patient_phone")
    private String patientPhone;

    @Column(name = "patient_email")
    private String patientEmail;

    @Column(name = "doctor_name")
    private String doctorName;

    @Column(name = "department")
    private String department;

    @Column(name = "room_number")
    private String roomNumber;

    @Column(name = "floor")
    private Integer floor;

    @Column(name = "reason_for_visit", columnDefinition = "TEXT")
    private String reasonForVisit;

    @Column(name = "urgency_level")
    private String urgencyLevel = "MEDIUM";

    @Column(name = "consultation_fee", precision = 10, scale = 2)
    private BigDecimal consultationFee;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_status")
    private String paymentStatus = "PENDING";

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false;

    @Column(name = "confirmation_sent")
    private Boolean confirmationSent = false;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

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
