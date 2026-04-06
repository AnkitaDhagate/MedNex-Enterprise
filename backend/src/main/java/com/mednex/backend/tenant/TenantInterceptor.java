package com.mednex.backend.tenant;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
public class TenantInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {

        // Read tenant from request header
        String tenantId = request.getHeader("X-Tenant-ID");

        if (tenantId != null && !tenantId.isBlank()) {
            TenantContext.setCurrentTenant(tenantId.toLowerCase());
            log.debug("Tenant set to: {}", tenantId);
        } else {
            // Default tenant if header missing
            TenantContext.setCurrentTenant("tenant_a");
            log.debug("No X-Tenant-ID header found, defaulting to tenant_a");
        }

        return true; // continue request
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        // Always clear tenant after request to avoid thread leak
        TenantContext.clear();
        log.debug("Tenant context cleared after request");
    }
}