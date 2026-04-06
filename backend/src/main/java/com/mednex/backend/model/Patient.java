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
@Table(name = "patients")
@Data
@NoArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", unique = true)
    private String patientId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    // ---- Personal Info ----
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "middle_name")
    private String middleName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    private String gender;

    @Convert(converter = BloodGroupConverter.class)
    @Column(name = "blood_group")
    private BloodGroup bloodGroup;

    private String email;
    private String phone;
    private String mobile;

    @Column(name = "alternate_phone")
    private String alternatePhone;

    // ---- Address ----
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

    @Column(name = "marital_status")
    private String maritalStatus;

    private String religion;

    // ---- Medical History (JSONB) ----
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "medical_history")
    private Map<String, Object> medicalHistory;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "current_medications")
    private Map<String, Object> currentMedications;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> allergies;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "chronic_conditions")
    private Map<String, Object> chronicConditions;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> immunizations;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "family_history")
    private Map<String, Object> familyHistory;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "lifestyle_factors")
    private Map<String, Object> lifestyleFactors;

    // ---- Emergency Contact ----
    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_relationship")
    private String emergencyContactRelationship;

    @Column(name = "emergency_contact_phone")
    private String emergencyContactPhone;

    // ---- Insurance ----
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

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", name = "insurance_details")
    private Map<String, Object> insuranceDetails;

    // ---- Doctor ----
    @Column(name = "primary_doctor_id")
    private Long primaryDoctorId;

    @Column(name = "primary_doctor_name")
    private String primaryDoctorName;

    // ---- Status ----
    @Column(name = "patient_status")
    private String patientStatus;

    @Column(name = "registration_date")
    private LocalDate registrationDate;

    @Column(name = "registration_type")
    private String registrationType;

    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.registrationDate == null) this.registrationDate = LocalDate.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
