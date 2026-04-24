package com.mednex.backend.service;

import com.mednex.backend.model.AuditLog;
import com.mednex.backend.repository.AuditLogRepository;
import com.mednex.backend.tenant.TenantContext;
import com.mednex.backend.tenant.TenantIdentifierResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * FIX: Audit logging is @Async and runs in its own thread.
 * That thread has NO TenantContext set, so Hibernate uses the default datasource.
 * We set it explicitly, then clear it in finally so we don't leak state.
 *
 * CRITICAL: Audit failures must NEVER propagate back and rollback patient/appointment saves.
 * All exceptions are swallowed here.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /** Convenience overload (no tenantId) */
    @Async
    public void log(String username, String action, String resourceType,
                    String resourceId, String description) {
        log("HOSP_A", username, action, resourceType, resourceId, description);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String tenantId, String username, String action,
                    String resourceType, String resourceId, String description) {
        String resolvedTenant = (tenantId != null && !tenantId.isBlank()) ? tenantId : "HOSP_A";
        String datasourceKey  = TenantIdentifierResolver.toDataSourceKey(resolvedTenant);
        try {
            TenantContext.setCurrentTenant(datasourceKey);

            AuditLog entry = new AuditLog();
            entry.setTenantId(resolvedTenant);
            entry.setUsername(username);
            entry.setAction(action);
            entry.setResourceType(resourceType);
            entry.setResourceId(resourceId);
            entry.setDescription(description);
            entry.setSuccess(true);
            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Swallow — never let audit failure affect patient/appointment saves
            log.warn("Audit log write failed (data was saved): {}", e.getMessage());
        } finally {
            TenantContext.clear();
        }
    }

    public Page<AuditLog> getAuditLogs(String tenantId, int page, int size) {
        return auditLogRepository.findByTenantIdOrderByTimestampDesc(
                tenantId, PageRequest.of(page, size));
    }

    public List<AuditLog> getAccessLogsForRecord(String tenantId, String resourceType, String resourceId) {
        return auditLogRepository.findByTenantIdAndResourceTypeAndResourceId(
                tenantId, resourceType, resourceId);
    }

    public List<AuditLog> getLogsByUser(String tenantId, String username) {
        return auditLogRepository.findByTenantIdAndUsernameOrderByTimestampDesc(tenantId, username);
    }

    public List<AuditLog> getLogsByDateRange(String tenantId, LocalDateTime from, LocalDateTime to) {
        return auditLogRepository.findByTenantIdAndTimestampBetweenOrderByTimestampDesc(tenantId, from, to);
    }
}
