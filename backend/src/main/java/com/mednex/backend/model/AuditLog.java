package com.mednex.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * FIXED: Added @JsonProperty aliases so the React frontend receives the field
 * names it expects: entityType, entityId, details.
 *
 * Backend stores: resourceType, resourceId, description
 * Frontend reads: entityType,  entityId,   details
 *
 * Both names are now serialized — the frontend names as primary, the backend
 * names kept via getters so existing service code compiles unchanged.
 */
@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username")
    private String username;

    /** READ, CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT */
    @Column(name = "action", nullable = false)
    private String action;

    /** PATIENT, MEDICAL_RECORD, APPOINTMENT, USER */
    @Column(name = "resource_type")
    private String resourceType;

    @Column(name = "resource_id")
    private String resourceId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "success")
    private Boolean success = true;

    // ── Frontend-facing aliases ──────────────────────────────────────────────

    /** Alias: frontend reads 'entityType' */
    @JsonProperty("entityType")
    public String getEntityType() {
        return resourceType;
    }

    /** Alias: frontend reads 'entityId' */
    @JsonProperty("entityId")
    public String getEntityId() {
        return resourceId;
    }

    /** Alias: frontend reads 'details' */
    @JsonProperty("details")
    public String getDetails() {
        return description;
    }

    @PrePersist
    public void prePersist() {
        this.timestamp = LocalDateTime.now();
    }
}
