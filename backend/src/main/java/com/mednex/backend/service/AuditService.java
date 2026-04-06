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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(String username, String action, String resourceType,
                    String resourceId, String description) {
        try {
            String tenant = TenantContext.getCurrentTenant();
            AuditLog entry = new AuditLog();
            entry.setTenantId(tenant != null ? tenant : "system");
            entry.setUsername(username);
            entry.setAction(action);
            entry.setResourceType(resourceType);
            entry.setResourceId(resourceId);
            entry.setDescription(description);
            entry.setSuccess(true);
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage());
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
