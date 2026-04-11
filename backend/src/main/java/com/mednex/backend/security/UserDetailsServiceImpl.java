package com.mednex.backend.security;

import com.mednex.backend.entity.Role;
import com.mednex.backend.entity.User;
import com.mednex.backend.repository.RoleRepository;
import com.mednex.backend.repository.UserRepository;
import com.mednex.backend.repository.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired private UserRepository userRepository;
    @Autowired private UserRoleRepository userRoleRepository;
    @Autowired private RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameWithTenant) throws UsernameNotFoundException {
        String[] parts = usernameWithTenant.split("::");
        if (parts.length != 2) {
            throw new UsernameNotFoundException("Invalid username format. Expected: username::tenantId");
        }

        String username = parts[0];
        String tenantId = parts[1];

        User user = userRepository.findActiveUser(username, tenantId)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found: " + username + " in tenant: " + tenantId));

        // Fix: manually load roles (removed @ManyToMany to fix tenant_id missing error)
        List<Long> roleIds = userRoleRepository.findRoleIdsByUserIdAndTenantId(user.getId(), tenantId);
        Set<Role> roles = new HashSet<>(); // Fixed: properly typed HashSet
        if (!roleIds.isEmpty()) {
            roles.addAll(roleRepository.findAllById(roleIds));
            user.setRoles(roles);
        }

        List<GrantedAuthority> authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleName()))
                .collect(Collectors.toList());

        return org.springframework.security.core.userdetails.User.builder()
                .username(usernameWithTenant)
                .password(user.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(user.getAccountLocked())
                .credentialsExpired(false)
                .disabled(!user.getIsActive())
                .build();
    }
}