package com.mednex.backend.controller;

import com.mednex.backend.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditService auditService;

    /** HIPAA/GDPR: Paginated audit log — who accessed what and when */
    @GetMapping
    public ResponseEntity<?> getAuditLogs(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            return ResponseEntity.ok(auditService.getAuditLogs(tenantId, page, size));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** Access logs for a specific record */
    @GetMapping("/record/{resourceType}/{resourceId}")
    public ResponseEntity<?> getRecordAccessLogs(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String resourceType,
            @PathVariable String resourceId) {
        try {
            return ResponseEntity.ok(auditService.getAccessLogsForRecord(tenantId, resourceType, resourceId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** All access logs by a specific user */
    @GetMapping("/user/{username}")
    public ResponseEntity<?> getUserLogs(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String username) {
        try {
            return ResponseEntity.ok(auditService.getLogsByUser(tenantId, username));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** Date-range filter for compliance reports */
    @GetMapping("/range")
    public ResponseEntity<?> getLogsByDateRange(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        try {
            return ResponseEntity.ok(auditService.getLogsByDateRange(tenantId, from, to));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
