package com.mednex.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

/**
 * FIXED:
 * 1. @Column name = "resource_type"  → "entity_type"  (matches Schema.sql)
 * 2. @Column name = "resource_id"    → "entity_id"    (matches Schema.sql)
 * 3. @Column name = "timestamp"      → "created_at"   (matches Schema.sql)
 * 4. user_id is nullable (system/async logs may have no user)
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

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "entity_type")
    private String resourceType;

    @Column(name = "entity_id")
    private String resourceId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "success")
    private Boolean success = true;

    @JsonProperty("entityType")
    public String getEntityType() { return resourceType; }

    @JsonProperty("entityId")
    public String getEntityId() { return resourceId; }

    @JsonProperty("details")
    public String getDetails() { return description; }

    @PrePersist
    public void prePersist() {
        this.timestamp = LocalDateTime.now();
    }
}
