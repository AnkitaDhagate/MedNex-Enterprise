package com.mednex.backend.tenant;

public class TenantContext {
    private static final ThreadLocal<String> currentTenant = new ThreadLocal<>();

    public static void setCurrentTenant(String tenantId) {
        if (tenantId != null && !tenantId.trim().isEmpty()) {
            currentTenant.set(tenantId.trim());
        } else {
            currentTenant.set("HOSP_A"); // Default tenant
        }
    }

    public static String getCurrentTenant() {
        String tenant = currentTenant.get();
        return (tenant != null && !tenant.isEmpty()) ? tenant : "HOSP_A";
    }

    public static void clear() {
        currentTenant.remove();
    }

    public static boolean isValidTenant() {
        String tenant = getCurrentTenant();
        return tenant != null && !tenant.isEmpty() && !tenant.equals("PUBLIC");
    }
}