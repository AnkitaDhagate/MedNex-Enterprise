package com.mednex.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.Map;

@Data
public class PatientDTO {
    private String patientId;
    private String firstName;
    private String lastName;
    private String middleName;
    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String email;
    private String phone;
    private String mobile;
    private String alternatePhone;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String nationality;
    private String occupation;
    private String maritalStatus;
    private String religion;
    private Map<String, Object> medicalHistory;
    private Map<String, Object> currentMedications;
    private Map<String, Object> allergies;
    private Map<String, Object> chronicConditions;
    private Map<String, Object> immunizations;
    private Map<String, Object> familyHistory;
    private Map<String, Object> lifestyleFactors;
    private String emergencyContactName;
    private String emergencyContactRelationship;
    private String emergencyContactPhone;
    private String emergencyContactAlternate;
    private String insuranceProvider;
    private String insurancePolicyNumber;
    private String insuranceGroupNumber;
    private LocalDate insuranceValidFrom;
    private LocalDate insuranceValidTo;
    private Map<String, Object> insuranceDetails;
    private Long primaryDoctorId;
    private String primaryDoctorName;
    private String patientStatus;
    private LocalDate registrationDate;
    private String registrationType;
    private String notes;
}
