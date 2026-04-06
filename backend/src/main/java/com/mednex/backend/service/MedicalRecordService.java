package com.mednex.backend.service;

import com.mednex.backend.dto.MedicalRecordDTO;
import com.mednex.backend.model.MedicalRecord;
import com.mednex.backend.repository.MedicalRecordRepository;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AuditService auditService;

    private String currentTenant() {
        String t = TenantContext.getCurrentTenant();
        if (t == null || t.isBlank()) throw new RuntimeException("Tenant context not set.");
        return t;
    }

    private String currentUser() {
        try { return SecurityContextHolder.getContext().getAuthentication().getName(); }
        catch (Exception e) { return "system"; }
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
        auditService.log(currentUser(), "CREATE", "MEDICAL_RECORD",
                String.valueOf(saved.getId()),
                "Created record for patient: " + dto.getPatientId());
        return saved;
    }

    public List<MedicalRecord> getPatientMedicalRecords(Long patientId) {
        String tenantId = currentTenant();
        auditService.log(currentUser(), "READ", "MEDICAL_RECORD",
                String.valueOf(patientId),
                "Fetched medical records for patient: " + patientId);
        return medicalRecordRepository
                .findByPatientIdAndTenantIdOrderByEncounterDateDesc(patientId, tenantId);
    }

    public MedicalRecord getMedicalRecord(Long id) {
        String tenantId = currentTenant();
        MedicalRecord rec = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical record not found: " + id));
        if (!rec.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Cross-tenant access denied.");
        }
        auditService.log(currentUser(), "READ", "MEDICAL_RECORD",
                String.valueOf(id), "Viewed record: " + rec.getRecordId());
        return rec;
    }

    @Transactional
    public MedicalRecord updateMedicalRecord(Long id, MedicalRecordDTO dto) {
        String tenantId = currentTenant();
        MedicalRecord rec = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical record not found: " + id));
        if (!rec.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Cross-tenant access denied.");
        }
        mapDtoToRecord(dto, rec);
        MedicalRecord saved = medicalRecordRepository.save(rec);
        auditService.log(currentUser(), "UPDATE", "MEDICAL_RECORD",
                String.valueOf(id), "Updated record: " + rec.getRecordId());
        return saved;
    }

    public List<MedicalRecord> getAllRecords() {
        return medicalRecordRepository.findByTenantIdOrderByCreatedAtDesc(currentTenant());
    }

    private void mapDtoToRecord(MedicalRecordDTO dto, MedicalRecord rec) {
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
        rec.setFollowUpRequired(dto.getFollowUpRequired());
        rec.setFollowUpDate(dto.getFollowUpDate());
        rec.setFollowUpInstructions(dto.getFollowUpInstructions());
        rec.setDisposition(dto.getDisposition());
        rec.setReferralNotes(dto.getReferralNotes());
    }
}
