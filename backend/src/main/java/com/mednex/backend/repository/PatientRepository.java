package com.mednex.backend.repository;

import com.mednex.backend.model.Patient;
import com.mednex.backend.model.PatientStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByPatientIdAndTenantId(String patientId, String tenantId);

    List<Patient> findByTenantIdAndPatientStatus(String tenantId, PatientStatus patientStatus);

    @Query("SELECT p FROM Patient p WHERE p.tenantId = :tenantId AND (p.deletedAt IS NULL OR p.deletedAt IS NULL)")
    List<Patient> findAllActiveByTenant(@Param("tenantId") String tenantId);

    @Query("SELECT p FROM Patient p WHERE p.tenantId = :tenantId AND " +
            "(LOWER(p.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "p.patientId LIKE CONCAT('%', :search, '%') OR " +
            "p.mobile LIKE CONCAT('%', :search, '%') OR " +
            "p.email LIKE CONCAT('%', :search, '%'))")
    List<Patient> searchPatients(@Param("tenantId") String tenantId, @Param("search") String search);

    boolean existsByPatientIdAndTenantId(String patientId, String tenantId);

    List<Patient> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    long countByTenantId(String tenantId);
}