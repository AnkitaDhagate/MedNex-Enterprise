package com.mednex.backend.repository;

import com.mednex.backend.model.BedOccupancy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BedOccupancyRepository extends JpaRepository<BedOccupancy, Long> {

    List<BedOccupancy> findByTenantIdAndRecordDateOrderByDepartmentAsc(String tenantId, LocalDate date);

    List<BedOccupancy> findByTenantIdOrderByRecordDateDescDepartmentAsc(String tenantId);

    @Query("SELECT b FROM BedOccupancy b WHERE b.tenantId = :tenantId " +
            "AND b.recordDate BETWEEN :from AND :to ORDER BY b.recordDate, b.department")
    List<BedOccupancy> findByTenantIdAndDateRange(@Param("tenantId") String tenantId,
                                                  @Param("from") LocalDate from,
                                                  @Param("to") LocalDate to);
}
