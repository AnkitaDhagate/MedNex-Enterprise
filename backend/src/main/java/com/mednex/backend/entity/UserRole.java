package com.mednex.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * UserRole - Explicit join entity for user_roles table.
 *
 * ROOT CAUSE FIX:
 * The `user_roles` table has `tenant_id VARCHAR(50) NOT NULL` (no default value).
 * When JPA's @ManyToMany @JoinTable inserts a row, it only provides user_id + role_id,
 * leaving tenant_id empty → MySQL throws:
 *   "Field 'tenant_id' doesn't have a default value"
 *
 * SOLUTION: Replace the implicit @ManyToMany join with this explicit @Entity
 * so we can populate all three columns (user_id, role_id, tenant_id) on insert.
 */
@Entity
@Table(
        name = "user_roles",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user_id", "role_id", "tenant_id"},
                name = "unique_user_role_tenant"
        )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "role_id", nullable = false)
    private Long roleId;

    /**
     * CRITICAL: This column is NOT NULL in the schema.
     * Must be populated from User.tenantId during registration.
     */
    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "assigned_by")
    private Long assignedBy;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    // Convenience constructor used in AuthService
    public UserRole(Long userId, Long roleId, String tenantId) {
        this.userId = userId;
        this.roleId = roleId;
        this.tenantId = tenantId;
        this.assignedAt = LocalDateTime.now();
    }
}
