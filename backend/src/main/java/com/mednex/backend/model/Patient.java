package com.mednex.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patients")
@Data
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private String patientId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "middle_name")
    private String middleName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false)
    private Gender gender;

    @Convert(converter = BloodGroupConverter.class)
    @Column(name = "blood_group")
    private BloodGroup bloodGroup;

    private String email;
    private String phone;
    private String mobile;

    @Column(name = "alternate_phone")
    private String alternatePhone;

    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    private String city;
    private String state;

    @Column(name = "postal_code")
    private String postalCode;

    private String country;
    private String nationality;
    private String occupation;

    @Enumerated(EnumType.STRING)
    @Column(name = "marital_status")
    private MaritalStatus maritalStatus;

    private String religion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "medical_history", columnDefinition = "json")
    private String medicalHistory;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "current_medications", columnDefinition = "json")
    private String currentMedications;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private String allergies;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "chronic_conditions", columnDefinition = "json")
    private String chronicConditions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private String immunizations;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "family_history", columnDefinition = "json")
    private String familyHistory;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "lifestyle_factors", columnDefinition = "json")
    private String lifestyleFactors;

    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_relationship")
    private String emergencyContactRelationship;

    @Column(name = "emergency_contact_phone")
    private String emergencyContactPhone;

    @Column(name = "emergency_contact_alternate")
    private String emergencyContactAlternate;

    @Column(name = "insurance_provider")
    private String insuranceProvider;

    @Column(name = "insurance_policy_number")
    private String insurancePolicyNumber;

    @Column(name = "insurance_group_number")
    private String insuranceGroupNumber;

    @Column(name = "insurance_valid_from")
    private LocalDate insuranceValidFrom;

    @Column(name = "insurance_valid_to")
    private LocalDate insuranceValidTo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "insurance_details", columnDefinition = "json")
    private String insuranceDetails;

    @Column(name = "primary_doctor_id")
    private Long primaryDoctorId;

    @Column(name = "primary_doctor_name")
    private String primaryDoctorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "patient_status")
    private PatientStatus patientStatus;

    @Column(name = "registration_date", nullable = false)
    private LocalDate registrationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "registration_type")
    private RegistrationType registrationType;

    private String notes;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}