package com.mednex.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", unique = true, nullable = false, length = 50)
    private String tenantId;

    @Column(name = "tenant_name", nullable = false, length = 100)
    private String tenantName;

    @Column(name = "schema_name", nullable = false, length = 50)
    private String schemaName;

    @Column(name = "db_host", length = 100)
    private String dbHost = "localhost";

    @Column(name = "db_port")
    private Integer dbPort = 3306;

    @Column(name = "db_name", nullable = false, length = 100)
    private String dbName;

    @Column(name = "db_username", length = 50)
    private String dbUsername;

    @Column(name = "db_password", length = 255)
    private String dbPassword;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_plan")
    private SubscriptionPlan subscriptionPlan = SubscriptionPlan.BASIC;

    @Column(name = "max_users")
    private Integer maxUsers = 100;

    @Column(name = "max_patients")
    private Integer maxPatients = 10000;

    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Status {
        ACTIVE, INACTIVE, SUSPENDED
    }

    public enum SubscriptionPlan {
        BASIC, PREMIUM, ENTERPRISE
    }
}
