package com.mednex.backend.repository;

import com.mednex.backend.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    List<Patient> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    Optional<Patient> findByPatientIdAndTenantId(String patientId, String tenantId);

    @Query("SELECT p FROM Patient p WHERE p.tenantId = :tenantId AND " +
            "(LOWER(p.firstName) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
            " LOWER(p.lastName)  LIKE LOWER(CONCAT('%', :term, '%')) OR " +
            " LOWER(p.email)     LIKE LOWER(CONCAT('%', :term, '%')) OR " +
            " LOWER(p.phone)     LIKE LOWER(CONCAT('%', :term, '%')) OR " +
            " LOWER(p.patientId) LIKE LOWER(CONCAT('%', :term, '%')))")
    List<Patient> searchPatients(@Param("tenantId") String tenantId, @Param("term") String term);

    @Query("SELECT p FROM Patient p WHERE p.tenantId = :tenantId AND p.createdAt >= :since ORDER BY p.createdAt DESC")
    List<Patient> findRecentByTenantId(@Param("tenantId") String tenantId, @Param("since") LocalDateTime since);

    long countByTenantId(String tenantId);
}
