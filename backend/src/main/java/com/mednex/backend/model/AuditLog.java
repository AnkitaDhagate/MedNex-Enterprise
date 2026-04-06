package com.mednex.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    private String action; // READ, CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT

    @Column(name = "resource_type")
    private String resourceType; // PATIENT, MEDICAL_RECORD, APPOINTMENT, USER

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

    @PrePersist
    public void prePersist() {
        this.timestamp = LocalDateTime.now();
    }
}
