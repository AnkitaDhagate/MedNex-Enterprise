package com.mednex.backend.controller;

import com.mednex.backend.model.AuditLog;
import com.mednex.backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * FIX 3 (CRITICAL): Frontend Audit.js does:
 *   auditAPI.getLogs().then(r => { setLogs(r.data || []); })
 * So r.data must be a JSON array — NOT a Spring Page<> object.
 *
 * The original controller returned Page<AuditLog> which has the shape:
 *   { content: [...], totalPages: N, ... }
 * so r.data was an object, not an array → logs state was always set to {}, not [].
 *
 * FIX: Return Page.getContent() (List) for the /audit/logs endpoint.
 * Kept the original /audit-logs path returning Page for any pagination consumers.
 */
@RestController
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditService auditService;

    // ── /api/audit/logs/** — React frontend paths ────────────────────────────

    /**
     * GET /api/audit/logs
     * FIX: Returns List<AuditLog> (array), not Page<AuditLog> (object).
     * Frontend: auditAPI.getLogs() → r.data must be an array.
     */
    @GetMapping("/api/audit/logs")
    public ResponseEntity<?> getAuditLogsFrontend(
            @RequestHeader(value = "X-Tenant-ID", defaultValue = "tenant_a") String tenantId,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "200") int size) {
        try {
            Page<AuditLog> pageResult = auditService.getAuditLogs(tenantId, page, size);
            // Return content list so frontend array access works
            return ResponseEntity.ok(pageResult.getContent());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/audit/logs/user/{userId}
     * Frontend: auditAPI.getLogsByUser(userId)
     */
    @GetMapping("/api/audit/logs/user/{userId}")
    public ResponseEntity<?> getUserLogsFrontend(
            @RequestHeader(value = "X-Tenant-ID", defaultValue = "tenant_a") String tenantId,
            @PathVariable String userId) {
        try {
            return ResponseEntity.ok(auditService.getLogsByUser(tenantId, userId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/audit/logs/entity/{entityType}/{entityId}
     * Frontend: auditAPI.getLogsByEntity(entityType, entityId)
     */
    @GetMapping("/api/audit/logs/entity/{entityType}/{entityId}")
    public ResponseEntity<?> getEntityLogsFrontend(
            @RequestHeader(value = "X-Tenant-ID", defaultValue = "tenant_a") String tenantId,
            @PathVariable String entityType,
            @PathVariable String entityId) {
        try {
            return ResponseEntity.ok(auditService.getAccessLogsForRecord(tenantId, entityType, entityId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── /api/audit-logs/** — original paths kept for compatibility ────────────

    @GetMapping("/api/audit-logs")
    public ResponseEntity<?> getAuditLogs(
            @RequestHeader(value = "X-Tenant-ID", defaultValue = "tenant_a") String tenantId,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "200") int size) {
        try {
            // Returns Page<AuditLog> for pagination-aware clients
            return ResponseEntity.ok(auditService.getAuditLogs(tenantId, page, size));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/audit-logs/record/{resourceType}/{resourceId}")
    public ResponseEntity<?> getRecordAccessLogs(
            @RequestHeader(value = "X-Tenant-ID", defaultValue = "tenant_a") String tenantId,
            @PathVariable String resourceType,
            @PathVariable String resourceId) {
        try {
            return ResponseEntity.ok(auditService.getAccessLogsForRecord(tenantId, resourceType, resourceId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/audit-logs/user/{username}")
    public ResponseEntity<?> getUserLogs(
            @RequestHeader(value = "X-Tenant-ID", defaultValue = "tenant_a") String tenantId,
            @PathVariable String username) {
        try {
            return ResponseEntity.ok(auditService.getLogsByUser(tenantId, username));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/audit-logs/range")
    public ResponseEntity<?> getLogsByDateRange(
            @RequestHeader(value = "X-Tenant-ID", defaultValue = "tenant_a") String tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        try {
            return ResponseEntity.ok(auditService.getLogsByDateRange(tenantId, from, to));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
