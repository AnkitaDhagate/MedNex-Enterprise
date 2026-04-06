package com.mednex.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class MedicalRecordDTO {
    private String recordId;
    private Long patientId;
    private Long doctorId;
    private Long appointmentId;
    private LocalDateTime encounterDate;
    private String encounterType;
    private String department;
    private String chiefComplaint;
    private String historyOfPresentIllness;
    private Map<String, Object> pastMedicalHistory;
    private Map<String, Object> familyHistory;
    private Map<String, Object> socialHistory;
    private Map<String, Object> vitalSigns;
    private String physicalExamination;
    private Map<String, Object> systemicExamination;
    private Map<String, Object> investigations;
    private Map<String, Object> radiologyReports;
    private Map<String, Object> otherDiagnostics;
    private String primaryDiagnosis;
    private Map<String, Object> secondaryDiagnosis;
    private Map<String, Object> icdCodes;
    private String treatmentPlan;
    private Map<String, Object> medicationsPrescribed;
    private Map<String, Object> procedures;
    private Boolean followUpRequired;
    private LocalDate followUpDate;
    private String followUpInstructions;
    private String disposition;
    private String referralNotes;
}
