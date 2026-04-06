package com.mednex.backend.tenant;

import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@Component
@SuppressWarnings({"rawtypes", "unchecked"})
public class TenantConnectionProvider implements MultiTenantConnectionProvider {

    private final Map<String, DataSource> tenantDataSources = new HashMap<>();
    private final DataSource defaultDataSource;

    @Autowired
    public TenantConnectionProvider(DataSource defaultDataSource, Environment env) {
        this.defaultDataSource = defaultDataSource;

        registerTenant("tenant_a",
                env.getProperty("tenant.datasource.tenant_a.url"),
                env.getProperty("tenant.datasource.tenant_a.username"),
                env.getProperty("tenant.datasource.tenant_a.password"));

        registerTenant("tenant_b",
                env.getProperty("tenant.datasource.tenant_b.url"),
                env.getProperty("tenant.datasource.tenant_b.username"),
                env.getProperty("tenant.datasource.tenant_b.password"));
    }

    private void registerTenant(String tenantId, String url,
                                String username, String password) {
        if (url == null || url.isBlank()) return;
        DataSource ds = DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName("org.postgresql.Driver")
                .build();
        tenantDataSources.put(tenantId, ds);
    }

    @Override
    public Connection getAnyConnection() throws SQLException {
        return defaultDataSource.getConnection();
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        connection.close();
    }

    @Override
    public Connection getConnection(String tenantIdentifier) throws SQLException {
        String key = (tenantIdentifier != null)
                ? tenantIdentifier.toLowerCase()
                : "tenant_a";
        DataSource ds = tenantDataSources.getOrDefault(key, defaultDataSource);
        return ds.getConnection();
    }

    @Override
    public void releaseConnection(String tenantIdentifier,
                                  Connection connection) throws SQLException {
        connection.close();
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return false;
    }

    @Override
    public boolean isUnwrappableAs(Class unwrapType) {
        return false;
    }

    @Override
    public <T> T unwrap(Class<T> unwrapType) {
        throw new UnsupportedOperationException(
                "Cannot unwrap as " + unwrapType);
    }
}