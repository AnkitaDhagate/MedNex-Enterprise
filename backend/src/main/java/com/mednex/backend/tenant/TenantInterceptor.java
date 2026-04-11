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
        // FIX: Only set tenant if TenantFilter hasn't already done so.
        // TenantFilter (Order 1) runs before this interceptor and sets the tenant.
        // We should not overwrite it here, only fill in as a fallback.
        String existing = TenantContext.getCurrentTenant();
        if (existing == null || existing.isBlank()) {
            String tenantId = request.getHeader("X-Tenant-ID");
            String resolved = (tenantId != null && !tenantId.isBlank())
                    ? tenantId.toLowerCase().trim()
                    : "tenant_a";
            TenantContext.setCurrentTenant(resolved);
            log.debug("TenantInterceptor fallback: tenant set to {}", resolved);
        }
        return true;
    }

    // FIX: afterCompletion is intentionally removed.
    // TenantFilter's finally block already calls TenantContext.clear().
    // If afterCompletion also called clear(), it would wipe the context
    // AFTER the filter set it for the next request on a reused thread,
    // causing the next transaction to open with a null tenant identifier.
}
