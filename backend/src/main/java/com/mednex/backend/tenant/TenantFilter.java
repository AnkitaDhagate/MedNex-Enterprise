package com.mednex.backend.tenant;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * FIX 1 (CRITICAL): Original code only accepted "tenant_a" and "tenant_b",
 * but the schema uses "HOSP_A", "HOSP_B", "HOSP_C" as tenant IDs.
 * The frontend sends X-Tenant-ID = "HOSP_A" / "HOSP_B" / "HOSP_C".
 *
 * This filter now:
 *  - Accepts HOSP_A → maps to "tenant_a" (mednex_tenant_a DB)
 *  - Accepts HOSP_B → maps to "tenant_b" (mednex_tenant_b DB)
 *  - Accepts HOSP_C → maps to "tenant_a" (basic plan shares mednex_db)
 *  - Rejects any other value with 403
 */
@Component
@Order(1)
public class TenantFilter implements Filter {

    // Map frontend tenant IDs (from schema) → backend datasource keys
    private static final Map<String, String> TENANT_MAP = Map.of(
            "hosp_a",   "tenant_a",
            "hosp_b",   "tenant_b",
            "hosp_c",   "tenant_a",   // HOSP_C shares mednex_db (Basic plan)
            "tenant_a", "tenant_a",   // also accept direct datasource keys
            "tenant_b", "tenant_b"
    );

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  httpReq = (HttpServletRequest)  req;
        HttpServletResponse httpRes = (HttpServletResponse) res;

        String tenantHeader = httpReq.getHeader("X-Tenant-ID");

        if (tenantHeader != null && !tenantHeader.isBlank()) {
            String normalized = tenantHeader.toLowerCase().trim();
            String resolved   = TENANT_MAP.get(normalized);

            if (resolved == null) {
                // Unknown tenant → reject
                httpRes.setStatus(HttpServletResponse.SC_FORBIDDEN);
                httpRes.setContentType("application/json");
                httpRes.getWriter().write(
                        "{\"error\":\"Invalid tenant ID '" + tenantHeader + "'. Cross-tenant access denied.\"}");
                return;
            }
            TenantContext.setCurrentTenant(resolved);
        } else {
            // No header → default to tenant_a so Hibernate can open EntityManager
            TenantContext.setCurrentTenant("tenant_a");
        }

        try {
            chain.doFilter(req, res);
        } finally {
            TenantContext.clear();
        }
    }
}
