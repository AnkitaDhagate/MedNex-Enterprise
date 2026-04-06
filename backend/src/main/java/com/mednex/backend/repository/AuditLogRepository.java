package com.mednex.backend.repository;

import com.mednex.backend.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByTenantIdOrderByTimestampDesc(String tenantId, Pageable pageable);

    List<AuditLog> findByTenantIdAndResourceTypeAndResourceId(
            String tenantId, String resourceType, String resourceId);

    List<AuditLog> findByTenantIdAndUsernameOrderByTimestampDesc(String tenantId, String username);

    List<AuditLog> findByTenantIdAndTimestampBetweenOrderByTimestampDesc(
            String tenantId, LocalDateTime from, LocalDateTime to);
}
