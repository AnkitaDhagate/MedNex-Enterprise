package com.mednex.backend.service;

import com.mednex.backend.dto.MedicalRecordDTO;
import com.mednex.backend.model.MedicalRecord;
import com.mednex.backend.model.EncounterType;
import com.mednex.backend.model.Disposition;
import com.mednex.backend.repository.MedicalRecordRepository;
import com.mednex.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public MedicalRecord createMedicalRecord(MedicalRecordDTO recordDTO) {
        String tenantId = TenantContext.getCurrentTenant();

        if (tenantId == null) {
            tenantId = "HOSP_A";
            log.warn("Tenant ID not found, using default: HOSP_A");
        }

        log.debug("Creating medical record for tenant: {}", tenantId);

        MedicalRecord record = new MedicalRecord();
        record.setRecordId(generateRecordId());
        record.setTenantId(tenantId);
        record.setPatientId(recordDTO.getPatientId());
        record.setDoctorId(recordDTO.getDoctorId());
        record.setAppointmentId(recordDTO.getAppointmentId());
        record.setEncounterDate(recordDTO.getEncounterDate() != null ? recordDTO.getEncounterDate() : LocalDateTime.now());

        // Safely convert encounter type
        EncounterType encounterType = EncounterType.OPD;
        if (recordDTO.getEncounterType() != null) {
            try {
                encounterType = EncounterType.valueOf(recordDTO.getEncounterType());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid encounter type: {}, defaulting to OPD", recordDTO.getEncounterType());
            }
        }
        record.setEncounterType(encounterType);

        record.setDepartment(recordDTO.getDepartment());
        record.setChiefComplaint(recordDTO.getChiefComplaint());
        record.setHistoryOfPresentIllness(recordDTO.getHistoryOfPresentIllness());

        // Convert JSON fields
        convertJsonFields(record, recordDTO);

        record.setPrimaryDiagnosis(recordDTO.getPrimaryDiagnosis());
        record.setTreatmentPlan(recordDTO.getTreatmentPlan());
        record.setFollowUpRequired(recordDTO.getFollowUpRequired() != null ? recordDTO.getFollowUpRequired() : false);
        record.setFollowUpDate(recordDTO.getFollowUpDate());
        record.setFollowUpInstructions(recordDTO.getFollowUpInstructions());

        // Safely convert disposition
        Disposition disposition = Disposition.FOLLOW_UP;
        if (recordDTO.getDisposition() != null) {
            try {
                disposition = Disposition.valueOf(recordDTO.getDisposition());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid disposition: {}, defaulting to FOLLOW_UP", recordDTO.getDisposition());
            }
        }
        record.setDisposition(disposition);

        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        record.setAccessCount(0);
        record.setIsConfidential(false);

        try {
            return medicalRecordRepository.save(record);
        } catch (Exception e) {
            log.error("Error saving medical record", e);
            throw new RuntimeException("Failed to save medical record: " + e.getMessage(), e);
        }
    }

    private void convertJsonFields(MedicalRecord record, MedicalRecordDTO recordDTO) {
        try {
            if (recordDTO.getVitalSigns() != null && !recordDTO.getVitalSigns().isEmpty()) {
                record.setVitalSigns(objectMapper.writeValueAsString(recordDTO.getVitalSigns()));
            }
            if (recordDTO.getInvestigations() != null && !recordDTO.getInvestigations().isEmpty()) {
                record.setInvestigations(objectMapper.writeValueAsString(recordDTO.getInvestigations()));
            }
            if (recordDTO.getMedicationsPrescribed() != null && !recordDTO.getMedicationsPrescribed().isEmpty()) {
                record.setMedicationsPrescribed(objectMapper.writeValueAsString(recordDTO.getMedicationsPrescribed()));
            }
            if (recordDTO.getIcdCodes() != null && !recordDTO.getIcdCodes().isEmpty()) {
                record.setIcdCodes(objectMapper.writeValueAsString(recordDTO.getIcdCodes()));
            }
            if (recordDTO.getPastMedicalHistory() != null && !recordDTO.getPastMedicalHistory().isEmpty()) {
                record.setPastMedicalHistory(objectMapper.writeValueAsString(recordDTO.getPastMedicalHistory()));
            }
            if (recordDTO.getFamilyHistory() != null && !recordDTO.getFamilyHistory().isEmpty()) {
                record.setFamilyHistory(objectMapper.writeValueAsString(recordDTO.getFamilyHistory()));
            }
            if (recordDTO.getSocialHistory() != null && !recordDTO.getSocialHistory().isEmpty()) {
                record.setSocialHistory(objectMapper.writeValueAsString(recordDTO.getSocialHistory()));
            }
            if (recordDTO.getSystemicExamination() != null && !recordDTO.getSystemicExamination().isEmpty()) {
                record.setSystemicExamination(objectMapper.writeValueAsString(recordDTO.getSystemicExamination()));
            }
            if (recordDTO.getRadiologyReports() != null && !recordDTO.getRadiologyReports().isEmpty()) {
                record.setRadiologyReports(objectMapper.writeValueAsString(recordDTO.getRadiologyReports()));
            }
            if (recordDTO.getOtherDiagnostics() != null && !recordDTO.getOtherDiagnostics().isEmpty()) {
                record.setOtherDiagnostics(objectMapper.writeValueAsString(recordDTO.getOtherDiagnostics()));
            }
            if (recordDTO.getSecondaryDiagnosis() != null && !recordDTO.getSecondaryDiagnosis().isEmpty()) {
                record.setSecondaryDiagnosis(objectMapper.writeValueAsString(recordDTO.getSecondaryDiagnosis()));
            }
            if (recordDTO.getProcedures() != null && !recordDTO.getProcedures().isEmpty()) {
                record.setProcedures(objectMapper.writeValueAsString(recordDTO.getProcedures()));
            }
        } catch (Exception e) {
            log.error("Error converting JSON fields", e);
            throw new RuntimeException("Error processing JSON fields: " + e.getMessage(), e);
        }
    }

    public List<MedicalRecord> getPatientMedicalRecords(Long patientId) {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) tenantId = "HOSP_A";

        if (patientId == null) {
            throw new RuntimeException("Patient ID cannot be null");
        }

        try {
            return medicalRecordRepository.findByPatientIdAndTenantIdOrderByEncounterDateDesc(patientId, tenantId);
        } catch (Exception e) {
            log.error("Error fetching medical records for patient: {}", patientId, e);
            throw new RuntimeException("Failed to fetch medical records: " + e.getMessage(), e);
        }
    }

    public MedicalRecord getMedicalRecord(Long id) {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) tenantId = "HOSP_A";

        if (id == null) {
            throw new RuntimeException("Record ID cannot be null");
        }

        try {
            MedicalRecord record = medicalRecordRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medical record not found with id: " + id));

            if (!record.getTenantId().equals(tenantId)) {
                log.warn("Tenant mismatch: record tenant={}, current tenant={}", record.getTenantId(), tenantId);
                throw new RuntimeException("Access denied: You don't have permission to view this record");
            }

            // Increment access count
            record.setAccessCount(record.getAccessCount() + 1);
            record.setUpdatedAt(LocalDateTime.now());

            return medicalRecordRepository.save(record);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching medical record: {}", id, e);
            throw new RuntimeException("Failed to fetch medical record: " + e.getMessage(), e);
        }
    }

    public List<MedicalRecord> getAllMedicalRecordsForTenant() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) tenantId = "HOSP_A";

        try {
            return medicalRecordRepository.findByTenantId(tenantId);
        } catch (Exception e) {
            log.error("Error fetching all medical records for tenant: {}", tenantId, e);
            throw new RuntimeException("Failed to fetch medical records: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void deleteMedicalRecord(Long id) {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) tenantId = "HOSP_A";

        MedicalRecord record = getMedicalRecord(id);

        try {
            medicalRecordRepository.delete(record);
            log.info("Deleted medical record {} for tenant {}", id, tenantId);
        } catch (Exception e) {
            log.error("Error deleting medical record: {}", id, e);
            throw new RuntimeException("Failed to delete medical record: " + e.getMessage(), e);
        }
    }

    private String generateRecordId() {
        return "MR_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}