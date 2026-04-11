package com.mednex.backend.service;

import com.mednex.backend.model.AuditLog;
import com.mednex.backend.repository.AuditLogRepository;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * FIX — Root cause of "Could not open JPA EntityManager for transaction" at registration:
     *
     * @Async runs on a Spring thread-pool thread. TenantContext uses a ThreadLocal,
     * so it is ALWAYS null on the async thread — the original request's ThreadLocal
     * value never transfers. When auditLogRepository.save() fires, Hibernate calls
     * resolveCurrentTenantIdentifier(), gets null, and throws the EntityManager error.
     *
     * Solution: accept tenantId as an explicit parameter and set it on the async
     * thread's own ThreadLocal BEFORE touching the repository, then clear it after.
     */
    @Async
    @Transactional
    public void log(String username, String action, String resourceType,
                    String resourceId, String description) {
        // tenantId resolved by caller's thread; default to "system" if missing
        log("system", username, action, resourceType, resourceId, description);
    }

    @Async
    @Transactional
    public void log(String tenantId, String username, String action, String resourceType,
                    String resourceId, String description) {
        String resolvedTenant = (tenantId != null && !tenantId.isBlank()) ? tenantId : "tenant_a";
        try {
            // FIX: Explicitly set tenant on THIS async thread's ThreadLocal.
            // Without this, TenantContext.getCurrentTenant() returns null on the
            // async thread, Hibernate cannot resolve the datasource, and throws
            // "Could not open JPA EntityManager for transaction".
            TenantContext.setCurrentTenant(resolvedTenant);

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
            log.error("Failed to write audit log (tenant={}): {}", resolvedTenant, e.getMessage());
        } finally {
            // Always clear the async thread's ThreadLocal after use
            TenantContext.clear();
        }
    }

    public Page<AuditLog> getAuditLogs(String tenantId, int page, int size) {
        return auditLogRepository.findByTenantIdOrderByTimestampDesc(
                tenantId, PageRequest.of(page, size));
    }

    public List<AuditLog> getAccessLogsForRecord(String tenantId,
                                                  String resourceType,
                                                  String resourceId) {
        return auditLogRepository.findByTenantIdAndResourceTypeAndResourceId(
                tenantId, resourceType, resourceId);
    }

    public List<AuditLog> getLogsByUser(String tenantId, String username) {
        return auditLogRepository.findByTenantIdAndUsernameOrderByTimestampDesc(tenantId, username);
    }

    public List<AuditLog> getLogsByDateRange(String tenantId,
                                              LocalDateTime from,
                                              LocalDateTime to) {
        return auditLogRepository.findByTenantIdAndTimestampBetweenOrderByTimestampDesc(
                tenantId, from, to);
    }
}
