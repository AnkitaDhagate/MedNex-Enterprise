package com.mednex.backend.tenant;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

/**
 * Hibernate 6.2 fix: CurrentTenantIdentifierResolver<T> — T must be the
 * tenant-id type used by MultiTenantConnectionProvider.getConnection(Object).
 * Since our provider accepts Object, we resolve to String here.
 */
@Component
@SuppressWarnings("rawtypes")
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver {

    private static final String DEFAULT_TENANT = "tenant_a";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenant = TenantContext.getCurrentTenant();
        return (tenant != null && !tenant.isBlank()) ? tenant.toLowerCase() : DEFAULT_TENANT;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
