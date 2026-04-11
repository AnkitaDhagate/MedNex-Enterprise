package com.mednex.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * @deprecated Use {@link com.mednex.backend.entity.User} instead.
 * This class is kept for legacy service references only and is NOT a JPA entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private Long id;
    private String username;
    private String password;
    private String email;
    private String firstName;
    private String lastName;
    private String tenantId;
    private String role;
    private Boolean isActive = true;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}
