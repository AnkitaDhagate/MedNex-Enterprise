package com.mednex.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * FIX 5: Added missing fields that were in the schema but not in the model:
 *  - treatmentPlan (was in DTO and DB schema but missing from model)
 *  - followUpRequired, followUpDate, followUpInstructions
 *  - disposition, referralNotes
 *  - createdAt, updatedAt (needed for audit/ordering)
 */
@Entity
@Table(name = "medical_records")
@Data
@NoArgsConstructor
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_id", unique = true)
    private String recordId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "encounter_date")
    private LocalDateTime encounterDate;

    @Column(name = "encounter_type")
    private String encounterType;

    private String department;

    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(name = "history_of_present_illness", columnDefinition = "TEXT")
    private String historyOfPresentIllness;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", name = "past_medical_history")
    private Map<String, Object> pastMedicalHistory;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", name = "family_history")
    private Map<String, Object> familyHistory;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", name = "social_history")
    private Map<String, Object> socialHistory;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", name = "vital_signs")
    private Map<String, Object> vitalSigns;

    @Column(name = "physical_examination", columnDefinition = "TEXT")
    private String physicalExamination;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", name = "systemic_examination")
    private Map<String, Object> systemicExamination;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> investigations;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", name = "radiology_reports")
    private Map<String, Object> radiologyReports;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", name = "other_diagnostics")
    private Map<String, Object> otherDiagnostics;

    @Column(name = "primary_diagnosis", columnDefinition = "TEXT")
    private String primaryDiagnosis;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", name = "secondary_diagnosis")
    private Map<String, Object> secondaryDiagnosis;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", name = "icd_codes")
    private Map<String, Object> icdCodes;

    /** FIX 5: Was present in MedicalRecordDTO and DB schema but MISSING from model */
    @Column(name = "treatment_plan", columnDefinition = "TEXT")
    private String treatmentPlan;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", name = "medications_prescribed")
    private Map<String, Object> medicationsPrescribed;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> procedures;

    /** FIX 5: Missing from original model */
    @Column(name = "follow_up_required")
    private Boolean followUpRequired = false;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "follow_up_instructions", columnDefinition = "TEXT")
    private String followUpInstructions;

    /** FIX 5: Missing from original model */
    @Column(name = "disposition")
    private String disposition;

    @Column(name = "referral_notes", columnDefinition = "TEXT")
    private String referralNotes;

    @Column(name = "is_confidential")
    private Boolean isConfidential = false;

    @Column(name = "access_count")
    private Integer accessCount = 0;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_by")
    private Long updatedBy;

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
