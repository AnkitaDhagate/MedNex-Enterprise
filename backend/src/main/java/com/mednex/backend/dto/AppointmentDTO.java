package com.mednex.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

/**
 * FIXED — Added all fields AppointmentForm.js sends:
 * urgencyLevel, patientPhone, roomNumber, floor, referredBy,
 * consultationFee, discountAmount, totalAmount, paymentStatus,
 * cancellationReason, symptoms.
 */
@Data
public class AppointmentDTO {
    private String     appointmentId;
    private Long       patientId;
    private Long       doctorId;
    private Long       referredBy;
    private LocalDate  appointmentDate;
    private LocalTime  appointmentTime;
    private Integer    durationMinutes;
    private String     appointmentType;
    private String     status;
    private String     patientName;
    private String     patientPhone;
    private String     patientEmail;
    private String     doctorName;
    private String     department;
    private String     roomNumber;
    private Integer    floor;
    private String     reasonForVisit;
    private String     urgencyLevel;
    private Map<String,Object> symptoms;
    private BigDecimal consultationFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String     paymentStatus;
    private String     notes;
    private String     cancellationReason;
}
