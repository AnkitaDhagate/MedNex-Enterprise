package com.mednex.backend.repository;

import com.mednex.backend.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdAndTenantIdOrderByEncounterDateDesc(Long patientId, String tenantId);

    Optional<MedicalRecord> findByRecordIdAndTenantId(String recordId, String tenantId);

    List<MedicalRecord> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    long countByTenantId(String tenantId);
}
