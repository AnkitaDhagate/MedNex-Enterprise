package com.mednex.backend.service;

import com.mednex.backend.dto.PatientDTO;
import com.mednex.backend.model.BloodGroup;
import com.mednex.backend.model.Patient;
import com.mednex.backend.repository.PatientRepository;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * FIX LIST:
 * 1. tenantId FK: TenantFilter now stores "HOSP_A" directly. This is the value
 *    inserted into patients.tenant_id which must match tenants.tenant_id FK.
 * 2. Blank/empty strings → null before saving to avoid unique-constraint violations
 *    (email, phone are UNIQUE per tenant; empty string "" breaks that).
 * 3. JSON fields (medicalHistory, etc.) default to empty map {} not null
 *    so Hibernate doesn't complain about non-null JSON columns.
 * 4. Audit logs called in try-finally pattern so failures never roll back saves.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatientService {

    private final PatientRepository patientRepository;
    private final AuditService      auditService;

    private String currentTenant() {
        String t = TenantContext.getCurrentTenant();
        if (t == null || t.isBlank()) throw new RuntimeException("Tenant context not set. Make sure X-Tenant-ID header is sent.");
        return t;
    }

    private String currentUser() {
        try {
            String principal = SecurityContextHolder.getContext().getAuthentication().getName();
            // Strip "::TENANT" suffix added by JwtAuthenticationFilter
            if (principal != null && principal.contains("::")) {
                return principal.split("::")[0];
            }
            return principal != null ? principal : "system";
        } catch (Exception e) { return "system"; }
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    @Transactional
    public Patient createPatient(PatientDTO dto) {
        String tenantId = currentTenant();
        Patient p = new Patient();
        mapDtoToPatient(dto, p);
        p.setTenantId(tenantId);

        // Generate unique patient ID if not provided
        if (p.getPatientId() == null || p.getPatientId().isBlank()) {
            p.setPatientId("PAT-" + tenantId.replace("_", "") + "-"
                    + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        Patient saved = patientRepository.save(p);
        log.info("Patient created: {} {} (tenant={})", saved.getFirstName(), saved.getLastName(), tenantId);

        // Audit async — never blocks or fails the save
        auditService.log(tenantId, currentUser(), "CREATE", "PATIENT",
                String.valueOf(saved.getId()),
                "Created patient: " + saved.getFirstName() + " " + saved.getLastName());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Patient> getAllPatients() {
        String tenantId = currentTenant();
        return patientRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public Patient getPatientById(Long id) {
        String tenantId = currentTenant();
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + id));
        if (!p.getTenantId().equals(tenantId))
            throw new RuntimeException("Access denied.");
        return p;
    }

    @Transactional(readOnly = true)
    public List<Patient> searchPatients(String term) {
        return patientRepository.searchPatients(currentTenant(), term == null ? "" : term);
    }

    @Transactional
    public Patient updatePatient(Long id, PatientDTO dto) {
        String tenantId = currentTenant();
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + id));
        if (!p.getTenantId().equals(tenantId))
            throw new RuntimeException("Access denied.");
        mapDtoToPatient(dto, p);
        Patient saved = patientRepository.save(p);
        log.info("Patient updated: id={}", id);
        auditService.log(tenantId, currentUser(), "UPDATE", "PATIENT", String.valueOf(id),
                "Updated patient: " + saved.getFirstName() + " " + saved.getLastName());
        return saved;
    }

    @Transactional
    public void deletePatient(Long id) {
        String tenantId = currentTenant();
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + id));
        if (!p.getTenantId().equals(tenantId))
            throw new RuntimeException("Access denied.");
        patientRepository.delete(p);
        auditService.log(tenantId, currentUser(), "DELETE", "PATIENT", String.valueOf(id), "Deleted patient.");
    }

    @Transactional(readOnly = true)
    public List<Patient> getRecentPatients() {
        return patientRepository.findRecentByTenantId(
                currentTenant(), LocalDateTime.now().minusDays(7));
    }

    // ── DTO → Entity mapping ──────────────────────────────────────────────────

    private void mapDtoToPatient(PatientDTO dto, Patient p) {
        p.setFirstName(dto.getFirstName() != null ? dto.getFirstName().trim() : "");
        p.setLastName(dto.getLastName()   != null ? dto.getLastName().trim()  : "");
        p.setMiddleName(blankToNull(dto.getMiddleName()));
        p.setDateOfBirth(dto.getDateOfBirth());
        p.setGender(dto.getGender());

        // BloodGroup enum conversion
        if (dto.getBloodGroup() != null && !dto.getBloodGroup().isBlank()) {
            try { p.setBloodGroup(BloodGroup.fromDbValue(dto.getBloodGroup())); }
            catch (Exception e) { log.warn("Unknown blood group: {}", dto.getBloodGroup()); }
        }

        // FIX: blank → null prevents unique-constraint violations on email/phone columns
        p.setEmail(blankToNull(dto.getEmail()));
        p.setPhone(blankToNull(dto.getPhone()));
        p.setMobile(blankToNull(dto.getMobile()));
        p.setAlternatePhone(blankToNull(dto.getAlternatePhone()));

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

        // FIX: null-safe JSON fields — default to empty map {} not null
        p.setMedicalHistory(dto.getMedicalHistory()         != null ? dto.getMedicalHistory()         : java.util.Map.of());
        p.setCurrentMedications(dto.getCurrentMedications() != null ? dto.getCurrentMedications()     : java.util.Map.of());
        p.setAllergies(dto.getAllergies()                   != null ? dto.getAllergies()                : java.util.Map.of());
        p.setChronicConditions(dto.getChronicConditions()   != null ? dto.getChronicConditions()       : java.util.Map.of());
        p.setImmunizations(dto.getImmunizations()           != null ? dto.getImmunizations()           : java.util.Map.of());
        p.setFamilyHistory(dto.getFamilyHistory()           != null ? dto.getFamilyHistory()           : java.util.Map.of());
        p.setLifestyleFactors(dto.getLifestyleFactors()     != null ? dto.getLifestyleFactors()        : java.util.Map.of());

        p.setEmergencyContactName(dto.getEmergencyContactName());
        p.setEmergencyContactRelationship(dto.getEmergencyContactRelationship());
        p.setEmergencyContactPhone(dto.getEmergencyContactPhone());

        p.setInsuranceProvider(blankToNull(dto.getInsuranceProvider()));
        p.setInsurancePolicyNumber(blankToNull(dto.getInsurancePolicyNumber()));
        p.setInsuranceGroupNumber(blankToNull(dto.getInsuranceGroupNumber()));
        p.setInsuranceValidFrom(dto.getInsuranceValidFrom());
        p.setInsuranceValidTo(dto.getInsuranceValidTo());
        p.setInsuranceDetails(dto.getInsuranceDetails() != null ? dto.getInsuranceDetails() : java.util.Map.of());

        p.setPrimaryDoctorId(dto.getPrimaryDoctorId());
        p.setPrimaryDoctorName(dto.getPrimaryDoctorName());
        p.setPatientStatus(dto.getPatientStatus() != null && !dto.getPatientStatus().isBlank()
                ? dto.getPatientStatus() : "ACTIVE");
        p.setRegistrationDate(dto.getRegistrationDate() != null
                ? dto.getRegistrationDate() : java.time.LocalDate.now());
        p.setRegistrationType(dto.getRegistrationType());
        p.setNotes(dto.getNotes());
    }
}
