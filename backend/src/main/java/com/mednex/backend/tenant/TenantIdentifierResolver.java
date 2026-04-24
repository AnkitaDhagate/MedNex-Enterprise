package com.mednex.backend.tenant;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

/**
 * FIX: Maps the tenant ID stored in TenantContext (HOSP_A, HOSP_B, HOSP_C)
 * to the datasource key registered in TenantConnectionProvider (tenant_a, tenant_b).
 *
 * IMPORTANT: resolveCurrentTenantIdentifier() must NEVER return null.
 * Returning null causes "Could not open JPA EntityManager" errors at startup and during requests.
 *
 * validateExistingCurrentSessions() MUST be false.
 * If true, Hibernate tries to validate sessions on async threads that have no tenant set → crash.
 */
@Component
@SuppressWarnings("rawtypes")
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver {

    private static final String DEFAULT_DATASOURCE = "tenant_a";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null || tenant.isBlank()) return DEFAULT_DATASOURCE;
        return toDataSourceKey(tenant);
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        // MUST be false — true causes EntityManager errors on async threads (email, audit)
        return false;
    }

    /**
     * Maps tenant IDs to datasource keys.
     * Public static so AuditService and other @Async components can reuse it.
     */
    public static String toDataSourceKey(String tenantId) {
        if (tenantId == null) return DEFAULT_DATASOURCE;
        return switch (tenantId.toUpperCase()) {
            case "HOSP_B", "TENANT_B" -> "tenant_b";
            default -> "tenant_a";  // HOSP_A, HOSP_C and everything else
        };
    }
}
