package com.mednex.backend.service;

import com.mednex.backend.dto.PatientDTO;
import com.mednex.backend.model.BloodGroup;
import com.mednex.backend.model.Patient;
import com.mednex.backend.repository.PatientRepository;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final AuditService auditService;

    private String currentTenant() {
        String t = TenantContext.getCurrentTenant();
        if (t == null || t.isBlank()) throw new RuntimeException("Tenant context not set.");
        return t;
    }

    private String currentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }

    @Transactional
    public Patient createPatient(PatientDTO dto) {
        String tenantId = currentTenant();
        Patient p = new Patient();
        mapDtoToPatient(dto, p);
        p.setTenantId(tenantId);
        if (p.getPatientId() == null || p.getPatientId().isBlank()) {
            p.setPatientId("PAT-" + tenantId.toUpperCase().replace("_", "") + "-"
                    + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        Patient saved = patientRepository.save(p);
        // FIX: Pass tenantId explicitly — @Async thread has no TenantContext
        auditService.log(tenantId, currentUser(), "CREATE", "PATIENT",
                String.valueOf(saved.getId()), "Created patient: " + saved.getFirstName() + " " + saved.getLastName());
        return saved;
    }

    public List<Patient> getAllPatients() {
        String tenantId = currentTenant();
        auditService.log(tenantId, currentUser(), "READ", "PATIENT", "ALL",
                "Fetched all patients for tenant: " + tenantId);
        return patientRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public Patient getPatientById(Long id) {
        String tenantId = currentTenant();
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + id));
        if (!p.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Cross-tenant access denied.");
        }
        auditService.log(tenantId, currentUser(), "READ", "PATIENT", String.valueOf(id),
                "Viewed patient: " + p.getFirstName() + " " + p.getLastName());
        return p;
    }

    public List<Patient> searchPatients(String term) {
        String tenantId = currentTenant();
        return patientRepository.searchPatients(tenantId, term);
    }

    @Transactional
    public Patient updatePatient(Long id, PatientDTO dto) {
        String tenantId = currentTenant();
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + id));
        if (!p.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Cross-tenant access denied.");
        }
        mapDtoToPatient(dto, p);
        Patient saved = patientRepository.save(p);
        auditService.log(tenantId, currentUser(), "UPDATE", "PATIENT", String.valueOf(id),
                "Updated patient: " + saved.getFirstName() + " " + saved.getLastName());
        return saved;
    }

    @Transactional
    public void deletePatient(Long id) {
        String tenantId = currentTenant();
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + id));
        if (!p.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Cross-tenant access denied.");
        }
        patientRepository.delete(p);
        auditService.log(tenantId, currentUser(), "DELETE", "PATIENT", String.valueOf(id), "Deleted patient.");
    }

    public List<Patient> getRecentPatients() {
        String tenantId = currentTenant();
        return patientRepository.findRecentByTenantId(tenantId, LocalDateTime.now().minusDays(7));
    }

    private void mapDtoToPatient(PatientDTO dto, Patient p) {
        p.setFirstName(dto.getFirstName());
        p.setLastName(dto.getLastName());
        p.setMiddleName(dto.getMiddleName());
        p.setDateOfBirth(dto.getDateOfBirth());
        p.setGender(dto.getGender());
        if (dto.getBloodGroup() != null) {
            p.setBloodGroup(BloodGroup.fromDbValue(dto.getBloodGroup()));
        }
        p.setEmail(dto.getEmail());
        p.setPhone(dto.getPhone());
        p.setMobile(dto.getMobile());
        p.setAlternatePhone(dto.getAlternatePhone());
        p.setAddressLine1(dto.getAddressLine1());
        p.setAddressLine2(dto.getAddressLine2());
        p.setCity(dto.getCity());
        p.setState(dto.getState());
        p.setPostalCode(dto.getPostalCode());
        p.setCountry(dto.getCountry());
        p.setNationality(dto.getNationality());
        p.setOccupation(dto.getOccupation());
        p.setMaritalStatus(dto.getMaritalStatus());
        p.setReligion(dto.getReligion());
        p.setMedicalHistory(dto.getMedicalHistory());
        p.setCurrentMedications(dto.getCurrentMedications());
        p.setAllergies(dto.getAllergies());
        p.setChronicConditions(dto.getChronicConditions());
        p.setImmunizations(dto.getImmunizations());
        p.setFamilyHistory(dto.getFamilyHistory());
        p.setLifestyleFactors(dto.getLifestyleFactors());
        p.setEmergencyContactName(dto.getEmergencyContactName());
        p.setEmergencyContactRelationship(dto.getEmergencyContactRelationship());
        p.setEmergencyContactPhone(dto.getEmergencyContactPhone());
        p.setInsuranceProvider(dto.getInsuranceProvider());
        p.setInsurancePolicyNumber(dto.getInsurancePolicyNumber());
        p.setInsuranceGroupNumber(dto.getInsuranceGroupNumber());
        p.setInsuranceValidFrom(dto.getInsuranceValidFrom());
        p.setInsuranceValidTo(dto.getInsuranceValidTo());
        p.setInsuranceDetails(dto.getInsuranceDetails());
        p.setPrimaryDoctorId(dto.getPrimaryDoctorId());
        p.setPrimaryDoctorName(dto.getPrimaryDoctorName());
        p.setPatientStatus(dto.getPatientStatus() != null ? dto.getPatientStatus() : "ACTIVE");
        p.setRegistrationDate(dto.getRegistrationDate());
        p.setRegistrationType(dto.getRegistrationType());
        p.setNotes(dto.getNotes());
    }
}
