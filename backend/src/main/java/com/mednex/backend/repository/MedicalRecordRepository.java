package com.mednex.backend.repository;

import com.mednex.backend.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdAndTenantIdOrderByEncounterDateDesc(Long patientId, String tenantId);

    List<MedicalRecord> findByDoctorIdAndTenantIdOrderByEncounterDateDesc(Long doctorId, String tenantId);

    List<MedicalRecord> findByTenantId(String tenantId);

    @Query("SELECT m FROM MedicalRecord m WHERE m.tenantId = :tenantId AND " +
            "m.encounterDate BETWEEN :startDate AND :endDate ORDER BY m.encounterDate DESC")
    List<MedicalRecord> findByEncounterDateRange(@Param("tenantId") String tenantId,
                                                 @Param("startDate") LocalDateTime startDate,
                                                 @Param("endDate") LocalDateTime endDate);

    @Query("SELECT m FROM MedicalRecord m WHERE m.tenantId = :tenantId AND " +
            "m.patientId = :patientId AND m.encounterDate >= :startDate")
    List<MedicalRecord> findRecentPatientRecords(@Param("tenantId") String tenantId,
                                                 @Param("patientId") Long patientId,
                                                 @Param("startDate") LocalDateTime startDate);
}