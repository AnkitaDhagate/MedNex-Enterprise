package com.mednex.backend.tenant;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
@SuppressWarnings("rawtypes")
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver {

    private static final String DEFAULT_TENANT = "tenant_a";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenant = TenantContext.getCurrentTenant();
        // FIX: Never return null — always return a valid tenant string.
        // Returning null causes Hibernate to throw "Could not open JPA EntityManager
        // for transaction" because it cannot resolve which datasource to open.
        return (tenant != null && !tenant.isBlank()) ? tenant.toLowerCase() : DEFAULT_TENANT;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        // FIX: MUST be false.
        // true = Hibernate validates that the current session's tenant matches the
        // resolved tenant on every transaction open. When the async thread or a new
        // request has a different (or null) tenant, this throws the EntityManager error.
        return false;
    }
}
