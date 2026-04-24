package com.mednex.backend.tenant;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

/**
 * FIX: Two critical fixes here:
 *
 * 1. Store the ORIGINAL tenant ID (HOSP_A / HOSP_B / HOSP_C) in TenantContext.
 *    This is what gets written to patients.tenant_id / appointments.tenant_id.
 *    The DB tenants table has: HOSP_A, HOSP_B, HOSP_C — these must match exactly.
 *    The old code mapped "HOSP_A" → "tenant_a" which caused FK violations on every insert.
 *
 * 2. TenantIdentifierResolver uses a SEPARATE mapping to pick the datasource (tenant_a / tenant_b).
 *    So TenantContext = "HOSP_A" (for DB column) but Hibernate routes to datasource "tenant_a".
 *
 * 3. Default to HOSP_A when no header is sent (allows testing without headers).
 */
@Component
@Order(1)
public class TenantFilter implements Filter {

    private static final Set<String> VALID_TENANTS = Set.of("HOSP_A", "HOSP_B", "HOSP_C");
    private static final String DEFAULT_TENANT = "HOSP_A";

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  httpReq = (HttpServletRequest)  req;
        HttpServletResponse httpRes = (HttpServletResponse) res;

        String tenantHeader = httpReq.getHeader("X-Tenant-ID");

        String tenant;
        if (tenantHeader != null && !tenantHeader.isBlank()) {
            tenant = tenantHeader.trim().toUpperCase();
            if (!VALID_TENANTS.contains(tenant)) {
                // Return 403 with details
                httpRes.setStatus(HttpServletResponse.SC_FORBIDDEN);
                httpRes.setContentType("application/json");
                httpRes.getWriter().write(
                    "{\"error\":\"Invalid tenant: '" + tenantHeader + "'. Valid: HOSP_A, HOSP_B, HOSP_C\"}");
                return;
            }
        } else {
            // No header → default. This allows curl testing without headers.
            tenant = DEFAULT_TENANT;
        }

        // Store the actual tenant ID (HOSP_A), NOT the datasource key (tenant_a)
        TenantContext.setCurrentTenant(tenant);

        try {
            chain.doFilter(req, res);
        } finally {
            TenantContext.clear();
        }
    }
}
