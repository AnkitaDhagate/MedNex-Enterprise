package com.mednex.backend.service;

import com.mednex.backend.dto.LoginRequest;
import com.mednex.backend.dto.LoginResponse;
import com.mednex.backend.dto.UserDTO;
import com.mednex.backend.model.User;
import com.mednex.backend.repository.UserRepository;
import com.mednex.backend.security.JwtUtil;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;

    @Transactional
    public LoginResponse login(LoginRequest req) {
        String tenantId = (req.getTenantId() != null)
                ? req.getTenantId().toLowerCase().trim()
                : TenantContext.getCurrentTenant();

        if (tenantId == null || tenantId.isBlank()) {
            throw new RuntimeException("Tenant ID is required.");
        }
        if (!tenantId.equals("tenant_a") && !tenantId.equals("tenant_b")) {
            throw new RuntimeException("Invalid tenant. Cross-tenant access denied.");
        }

        User user = userRepository.findByUsernameAndTenantId(req.getUsername(), tenantId)
                .orElseThrow(() -> new RuntimeException("Invalid username or password."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password.");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new RuntimeException("Account is disabled. Contact administrator.");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), tenantId, user.getRole());

        auditService.log(user.getUsername(), "LOGIN", "USER",
                String.valueOf(user.getId()), "User logged in from tenant: " + tenantId);

        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .tenantId(tenantId)
                .role(user.getRole())
                .build();
    }

    @Transactional
    public User register(UserDTO dto) {
        String tenantId = dto.getTenantId() != null ? dto.getTenantId().toLowerCase() : "tenant_a";

        if (userRepository.existsByUsernameAndTenantId(dto.getUsername(), tenantId)) {
            throw new RuntimeException("Username already exists in this tenant.");
        }
        if (userRepository.existsByEmailAndTenantId(dto.getEmail(), tenantId)) {
            throw new RuntimeException("Email already registered in this tenant.");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setEmail(dto.getEmail());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setTenantId(tenantId);
        user.setRole(dto.getRole() != null ? dto.getRole() : "RECEPTIONIST");
        user.setIsActive(true);

        return userRepository.save(user);
    }

    public void logout(String token) {
        // JWT is stateless; client should discard. Log the event.
        try {
            String username = jwtUtil.extractUsername(token.replace("Bearer ", ""));
            auditService.log(username, "LOGOUT", "USER", null, "User logged out");
        } catch (Exception ignored) {}
    }

    public User getCurrentUser(String tenantId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsernameAndTenantId(username, tenantId)
                .orElseThrow(() -> new RuntimeException("User not found."));
    }
}
