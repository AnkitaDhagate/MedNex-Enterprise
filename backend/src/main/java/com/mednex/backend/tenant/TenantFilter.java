package com.mednex.backend.tenant;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1)
public class TenantFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpReq = (HttpServletRequest) req;
        HttpServletResponse httpRes = (HttpServletResponse) res;

        String tenantId = httpReq.getHeader("X-Tenant-ID");

        // Enforce tenant on secured endpoints
        if (tenantId != null && !tenantId.isBlank()) {
            String normalized = tenantId.toLowerCase().trim();
            if (!normalized.equals("tenant_a") && !normalized.equals("tenant_b")) {
                httpRes.setStatus(HttpServletResponse.SC_FORBIDDEN);
                httpRes.getWriter().write("{\"error\":\"Invalid tenant. Cross-tenant access denied.\"}");
                return;
            }
            TenantContext.setCurrentTenant(normalized);
        }

        try {
            chain.doFilter(req, res);
        } finally {
            TenantContext.clear();
        }
    }
}
