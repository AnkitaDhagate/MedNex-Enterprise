package com.mednex.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.mednex.backend.dto.*;
import com.mednex.backend.entity.*;
import com.mednex.backend.repository.*;
import com.mednex.backend.security.JwtUtils;
import com.mednex.backend.repository.UserRepository;        // ← This import
import com.mednex.backend.repository.UserRoleRepository;     // ← This import

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final int MAX_FAILED_ATTEMPTS = 5;

    // IMPORTANT: Make sure these are the correct types!
    @Autowired
    private UserRepository userRepository;  // ← This should be UserRepository, NOT UserRoleRepository

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;  // ← This is for UserRole entity

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private AuthenticationManager authenticationManager;

    // ============================================================
    // LOGIN
    // ============================================================
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Tenant tenant = tenantRepository.findByTenantId(request.getTenantId())
                .orElseThrow(() -> new RuntimeException("Invalid Tenant ID: " + request.getTenantId()));

        if (tenant.getStatus() != Tenant.Status.ACTIVE) {
            throw new RuntimeException("Tenant account is " + tenant.getStatus() + ". Please contact support.");
        }

        User user = userRepository.findByUsernameAndTenantId(request.getUsername(), request.getTenantId())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!user.getIsActive()) {
            throw new DisabledException("Your account has been deactivated. Contact administrator.");
        }

        if (user.getAccountLocked()) {
            throw new LockedException("Account is locked due to too many failed attempts. Contact administrator.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            userRepository.incrementFailedAttempts(user.getId());
            int attempts = user.getFailedLoginAttempts() + 1;
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                userRepository.lockAccount(user.getId());
                throw new LockedException("Account locked after " + MAX_FAILED_ATTEMPTS + " failed attempts.");
            }
            int remaining = MAX_FAILED_ATTEMPTS - attempts;
            throw new BadCredentialsException("Invalid password. " + remaining + " attempts remaining.");
        }

        userRepository.updateLastLogin(user.getId(), LocalDateTime.now());

        // Load roles from DB (since @ManyToMany was removed)
        loadRolesIntoUser(user);

        String accessToken  = jwtUtils.generateToken(user.getUsername(), user.getTenantId(), user.getId());
        String refreshToken = jwtUtils.generateRefreshToken(user.getUsername(), user.getTenantId());

        logger.info("User {} logged in successfully for tenant {}", user.getUsername(), user.getTenantId());
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    // ============================================================
    // REGISTER
    // ============================================================
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Validate tenant
        Tenant tenant = tenantRepository.findByTenantId(request.getTenantId())
                .orElseThrow(() -> new RuntimeException("Invalid Tenant ID: " + request.getTenantId()));

        if (tenant.getStatus() != Tenant.Status.ACTIVE) {
            throw new RuntimeException("Tenant account is inactive.");
        }

        // 2. Check uniqueness
        if (userRepository.existsByUsernameAndTenantId(request.getUsername(), request.getTenantId())) {
            throw new RuntimeException("Username '" + request.getUsername() + "' already exists in this organization.");
        }
        if (userRepository.existsByEmailAndTenantId(request.getEmail(), request.getTenantId())) {
            throw new RuntimeException("Email '" + request.getEmail() + "' is already registered in this organization.");
        }

        // 3. User limit
        long currentUserCount = userRepository.count();
        if (currentUserCount >= tenant.getMaxUsers()) {
            throw new RuntimeException("Maximum user limit reached for this organization.");
        }

        // 4. Resolve role
        String roleName = (request.getRoleName() != null) ? request.getRoleName() : "NURSE";
        Role role = roleRepository.findByRoleName(roleName)
                .orElseGet(() -> roleRepository.findByRoleName("NURSE")
                        .orElseThrow(() -> new RuntimeException("Default role not found. Please run schema SQL.")));

        // 5. Create & save user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setTenantId(request.getTenantId());
        user.setPhone(request.getPhone());
        user.setDepartment(request.getDepartment());
        user.setDesignation(request.getDesignation());
        user.setIsActive(true);
        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);

        User savedUser = userRepository.save(user);  // This should work now

        // 6. Insert into user_roles WITH tenant_id
        UserRole userRole = new UserRole(savedUser.getId(), role.getId(), savedUser.getTenantId());
        userRoleRepository.save(userRole);

        // 7. Populate transient roles field for response building
        savedUser.setRoles(new HashSet<>(Set.of(role)));

        logger.info("New user registered: {} in tenant {}", savedUser.getUsername(), savedUser.getTenantId());

        String accessToken  = jwtUtils.generateToken(savedUser.getUsername(), savedUser.getTenantId(), savedUser.getId());
        String refreshToken = jwtUtils.generateRefreshToken(savedUser.getUsername(), savedUser.getTenantId());

        return buildAuthResponse(savedUser, accessToken, refreshToken);
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private void loadRolesIntoUser(User user) {
        List<Long> roleIds = userRoleRepository.findRoleIdsByUserIdAndTenantId(user.getId(), user.getTenantId());
        if (!roleIds.isEmpty()) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(roleIds));
            user.setRoles(roles);
        }
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setUsername(user.getUsername());
        userInfo.setEmail(user.getEmail());
        userInfo.setFirstName(user.getFirstName());
        userInfo.setLastName(user.getLastName());
        userInfo.setTenantId(user.getTenantId());
        userInfo.setDepartment(user.getDepartment());
        userInfo.setDesignation(user.getDesignation());
        userInfo.setProfilePicUrl(user.getProfilePicUrl());
        userInfo.setIsActive(user.getIsActive());

        List<String> roles = user.getRoles().stream()
                .map(Role::getRoleName)
                .collect(Collectors.toList());
        userInfo.setRoles(roles);

        AuthResponse response = new AuthResponse();
        response.setToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(jwtUtils.getJwtExpiration());
        response.setUser(userInfo);

        return response;
    }
}