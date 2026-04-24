package com.mednex.backend.service;

import com.mednex.backend.dto.MedicalRecordDTO;
import com.mednex.backend.model.MedicalRecord;
import com.mednex.backend.repository.MedicalRecordRepository;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AuditService auditService;

    private String currentTenant() {
        String t = TenantContext.getCurrentTenant();
        if (t == null || t.isBlank()) throw new RuntimeException("Tenant context not set.");
        return t;
    }

    private String currentUser() {
        try {
            String p = SecurityContextHolder.getContext().getAuthentication().getName();
            return (p != null && p.contains("::")) ? p.split("::")[0] : (p != null ? p : "system");
        } catch (Exception e) { return "system"; }
    }

    @Transactional
    public MedicalRecord createMedicalRecord(MedicalRecordDTO dto) {
        String tenantId = currentTenant();
        MedicalRecord rec = new MedicalRecord();
        mapDtoToRecord(dto, rec);
        rec.setTenantId(tenantId);
        if (rec.getRecordId() == null || rec.getRecordId().isBlank()) {
            rec.setRecordId("REC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        MedicalRecord saved = medicalRecordRepository.save(rec);
        auditService.log(tenantId, currentUser(), "CREATE", "MEDICAL_RECORD",
                String.valueOf(saved.getId()), "Created record for patient: " + dto.getPatientId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<MedicalRecord> getAllRecords() {
        return medicalRecordRepository.findByTenantIdOrderByCreatedAtDesc(currentTenant());
    }

    @Transactional(readOnly = true)
    public List<MedicalRecord> getPatientMedicalRecords(Long patientId) {
        String tenantId = currentTenant();
        return medicalRecordRepository.findByPatientIdAndTenantIdOrderByEncounterDateDesc(patientId, tenantId);
    }

    @Transactional(readOnly = true)
    public MedicalRecord getMedicalRecord(Long id) {
        String tenantId = currentTenant();
        MedicalRecord rec = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical record not found: " + id));
        if (!rec.getTenantId().equals(tenantId)) throw new RuntimeException("Access denied.");
        return rec;
    }

    @Transactional
    public MedicalRecord updateMedicalRecord(Long id, MedicalRecordDTO dto) {
        String tenantId = currentTenant();
        MedicalRecord rec = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical record not found: " + id));
        if (!rec.getTenantId().equals(tenantId)) throw new RuntimeException("Access denied.");
        mapDtoToRecord(dto, rec);
        MedicalRecord saved = medicalRecordRepository.save(rec);
        auditService.log(tenantId, currentUser(), "UPDATE", "MEDICAL_RECORD",
                String.valueOf(id), "Updated record: " + rec.getRecordId());
        return saved;
    }

    @Transactional
    public void deleteMedicalRecord(Long id) {
        String tenantId = currentTenant();
        MedicalRecord rec = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical record not found: " + id));
        if (!rec.getTenantId().equals(tenantId)) throw new RuntimeException("Access denied.");
        medicalRecordRepository.delete(rec);
        auditService.log(tenantId, currentUser(), "DELETE", "MEDICAL_RECORD",
                String.valueOf(id), "Deleted medical record.");
    }

    private void mapDtoToRecord(MedicalRecordDTO dto, MedicalRecord rec) {
        if (dto.getRecordId() != null) rec.setRecordId(dto.getRecordId());
        rec.setPatientId(dto.getPatientId());
        rec.setDoctorId(dto.getDoctorId());
        rec.setAppointmentId(dto.getAppointmentId());
        rec.setEncounterDate(dto.getEncounterDate());
        rec.setEncounterType(dto.getEncounterType());
        rec.setDepartment(dto.getDepartment());
        rec.setChiefComplaint(dto.getChiefComplaint());
        rec.setHistoryOfPresentIllness(dto.getHistoryOfPresentIllness());
        rec.setPastMedicalHistory(dto.getPastMedicalHistory());
        rec.setFamilyHistory(dto.getFamilyHistory());
        rec.setSocialHistory(dto.getSocialHistory());
        rec.setVitalSigns(dto.getVitalSigns());
        rec.setPhysicalExamination(dto.getPhysicalExamination());
        rec.setSystemicExamination(dto.getSystemicExamination());
        rec.setInvestigations(dto.getInvestigations());
        rec.setRadiologyReports(dto.getRadiologyReports());
        rec.setOtherDiagnostics(dto.getOtherDiagnostics());
        rec.setPrimaryDiagnosis(dto.getPrimaryDiagnosis());
        rec.setSecondaryDiagnosis(dto.getSecondaryDiagnosis());
        rec.setIcdCodes(dto.getIcdCodes());
        rec.setTreatmentPlan(dto.getTreatmentPlan());
        rec.setMedicationsPrescribed(dto.getMedicationsPrescribed());
        rec.setProcedures(dto.getProcedures());
        rec.setFollowUpRequired(dto.getFollowUpRequired() != null ? dto.getFollowUpRequired() : false);
        rec.setFollowUpDate(dto.getFollowUpDate());
        rec.setFollowUpInstructions(dto.getFollowUpInstructions());
        rec.setDisposition(dto.getDisposition());
        rec.setReferralNotes(dto.getReferralNotes());
    }
}
