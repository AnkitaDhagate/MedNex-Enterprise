package com.mednex.backend.service;

import com.mednex.backend.dto.PatientDTO;
import com.mednex.backend.model.*;
import com.mednex.backend.repository.PatientRepository;
import com.mednex.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Patient createPatient(PatientDTO patientDTO) {
        String tenantId = TenantContext.getCurrentTenant();

        if (tenantId == null) {
            throw new RuntimeException("Tenant ID not found in context");
        }

        Patient patient = new Patient();
        patient.setPatientId(generatePatientId());
        patient.setTenantId(tenantId);
        patient.setFirstName(patientDTO.getFirstName());
        patient.setLastName(patientDTO.getLastName());
        patient.setMiddleName(patientDTO.getMiddleName());
        patient.setDateOfBirth(patientDTO.getDateOfBirth());
        patient.setGender(Gender.valueOf(patientDTO.getGender()));

        if (patientDTO.getBloodGroup() != null) {
            // BloodGroup DTO sends Java enum name (e.g. "A_POSITIVE"); converter handles DB mapping
            patient.setBloodGroup(BloodGroup.valueOf(patientDTO.getBloodGroup()));
        }

        patient.setEmail(patientDTO.getEmail());
        patient.setPhone(patientDTO.getPhone());
        patient.setMobile(patientDTO.getMobile());
        patient.setAlternatePhone(patientDTO.getAlternatePhone());
        patient.setAddressLine1(patientDTO.getAddressLine1());
        patient.setAddressLine2(patientDTO.getAddressLine2());
        patient.setCity(patientDTO.getCity());
        patient.setState(patientDTO.getState());
        patient.setPostalCode(patientDTO.getPostalCode());
        patient.setCountry(patientDTO.getCountry());
        patient.setNationality(patientDTO.getNationality());
        patient.setOccupation(patientDTO.getOccupation());

        if (patientDTO.getMaritalStatus() != null) {
            patient.setMaritalStatus(MaritalStatus.valueOf(patientDTO.getMaritalStatus()));
        }

        patient.setReligion(patientDTO.getReligion());

        // Convert JSON fields
        try {
            if (patientDTO.getMedicalHistory() != null) {
                patient.setMedicalHistory(objectMapper.writeValueAsString(patientDTO.getMedicalHistory()));
            }
            if (patientDTO.getAllergies() != null) {
                patient.setAllergies(objectMapper.writeValueAsString(patientDTO.getAllergies()));
            }
            if (patientDTO.getChronicConditions() != null) {
                patient.setChronicConditions(objectMapper.writeValueAsString(patientDTO.getChronicConditions()));
            }
            if (patientDTO.getCurrentMedications() != null) {
                patient.setCurrentMedications(objectMapper.writeValueAsString(patientDTO.getCurrentMedications()));
            }
            if (patientDTO.getFamilyHistory() != null) {
                patient.setFamilyHistory(objectMapper.writeValueAsString(patientDTO.getFamilyHistory()));
            }
            if (patientDTO.getImmunizations() != null) {
                patient.setImmunizations(objectMapper.writeValueAsString(patientDTO.getImmunizations()));
            }
            if (patientDTO.getLifestyleFactors() != null) {
                patient.setLifestyleFactors(objectMapper.writeValueAsString(patientDTO.getLifestyleFactors()));
            }
            if (patientDTO.getInsuranceDetails() != null) {
                patient.setInsuranceDetails(objectMapper.writeValueAsString(patientDTO.getInsuranceDetails()));
            }
        } catch (Exception e) {
            throw new RuntimeException("Error processing JSON fields", e);
        }

        patient.setEmergencyContactName(patientDTO.getEmergencyContactName());
        patient.setEmergencyContactRelationship(patientDTO.getEmergencyContactRelationship());
        patient.setEmergencyContactPhone(patientDTO.getEmergencyContactPhone());
        patient.setEmergencyContactAlternate(patientDTO.getEmergencyContactAlternate());

        patient.setInsuranceProvider(patientDTO.getInsuranceProvider());
        patient.setInsurancePolicyNumber(patientDTO.getInsurancePolicyNumber());
        patient.setInsuranceGroupNumber(patientDTO.getInsuranceGroupNumber());
        patient.setInsuranceValidFrom(patientDTO.getInsuranceValidFrom());
        patient.setInsuranceValidTo(patientDTO.getInsuranceValidTo());

        patient.setPrimaryDoctorId(patientDTO.getPrimaryDoctorId());
        patient.setPrimaryDoctorName(patientDTO.getPrimaryDoctorName());

        if (patientDTO.getPatientStatus() != null) {
            patient.setPatientStatus(PatientStatus.valueOf(patientDTO.getPatientStatus()));
        } else {
            patient.setPatientStatus(PatientStatus.ACTIVE);
        }

        patient.setRegistrationDate(patientDTO.getRegistrationDate() != null
                ? patientDTO.getRegistrationDate()
                : LocalDateTime.now().toLocalDate());

        if (patientDTO.getRegistrationType() != null) {
            patient.setRegistrationType(RegistrationType.valueOf(patientDTO.getRegistrationType()));
        } else {
            patient.setRegistrationType(RegistrationType.OPD);
        }

        patient.setNotes(patientDTO.getNotes());
        patient.setCreatedAt(LocalDateTime.now());
        patient.setUpdatedAt(LocalDateTime.now());

        return patientRepository.save(patient);
    }

    public List<Patient> getAllPatients() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            throw new RuntimeException("Tenant ID not found in context");
        }
        return patientRepository.findAllActiveByTenant(tenantId);
    }

    public Patient getPatientById(Long id) {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            throw new RuntimeException("Tenant ID not found in context");
        }
        return patientRepository.findById(id)
                .filter(p -> p.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + id));
    }

    public List<Patient> searchPatients(String searchTerm) {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            throw new RuntimeException("Tenant ID not found in context");
        }
        return patientRepository.searchPatients(tenantId, searchTerm);
    }

    @Transactional
    public Patient updatePatient(Long id, PatientDTO patientDTO) {
        Patient existingPatient = getPatientById(id);

        existingPatient.setFirstName(patientDTO.getFirstName());
        existingPatient.setLastName(patientDTO.getLastName());
        existingPatient.setMiddleName(patientDTO.getMiddleName());
        existingPatient.setDateOfBirth(patientDTO.getDateOfBirth());
        existingPatient.setEmail(patientDTO.getEmail());
        existingPatient.setPhone(patientDTO.getPhone());
        existingPatient.setMobile(patientDTO.getMobile());
        existingPatient.setAddressLine1(patientDTO.getAddressLine1());
        existingPatient.setCity(patientDTO.getCity());
        existingPatient.setState(patientDTO.getState());
        existingPatient.setPostalCode(patientDTO.getPostalCode());
        existingPatient.setUpdatedAt(LocalDateTime.now());

        return patientRepository.save(existingPatient);
    }

    private String generatePatientId() {
        String tenantId = TenantContext.getCurrentTenant();
        String prefix = tenantId.substring(0, Math.min(4, tenantId.length()));
        return prefix + "_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
