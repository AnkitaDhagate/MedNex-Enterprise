package com.mednex.backend.model;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

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

    // ---- JSONB Medical Data (Week 2) ----
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "past_medical_history")
    private Map<String, Object> pastMedicalHistory;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "family_history")
    private Map<String, Object> familyHistory;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "social_history")
    private Map<String, Object> socialHistory;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "vital_signs")
    private Map<String, Object> vitalSigns;

    @Column(name = "physical_examination", columnDefinition = "TEXT")
    private String physicalExamination;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "systemic_examination")
    private Map<String, Object> systemicExamination;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> investigations;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "radiology_reports")
    private Map<String, Object> radiologyReports;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "other_diagnostics")
    private Map<String, Object> otherDiagnostics;

    @Column(name = "primary_diagnosis", columnDefinition = "TEXT")
    private String primaryDiagnosis;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "secondary_diagnosis")
    private Map<String, Object> secondaryDiagnosis;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "icd_codes")
    private Map<String, Object> icdCodes;

    @Column(name = "treatment_plan", columnDefinition = "TEXT")
    private String treatmentPlan;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "medications_prescribed")
    private Map<String, Object> medicationsPrescribed;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> procedures;

    @Column(name = "follow_up_required")
    private Boolean followUpRequired;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "follow_up_instructions", columnDefinition = "TEXT")
    private String followUpInstructions;

    private String disposition;

    @Column(name = "referral_notes", columnDefinition = "TEXT")
    private String referralNotes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.encounterDate == null) this.encounterDate = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
