package com.mednex.backend.tenant;

import org.hibernate.engine.jdbc.connections.spi.AbstractDataSourceBasedMultiTenantConnectionProviderImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MultiTenantConnectionProvider extends AbstractDataSourceBasedMultiTenantConnectionProviderImpl {

    private final Map<String, DataSource> dataSourceMap = new ConcurrentHashMap<>();

    @Autowired
    private DataSourceProperties dataSourceProperties;

    @Override
    protected DataSource selectAnyDataSource() {
        return getDataSource("PUBLIC");
    }

    @Override
    protected DataSource selectDataSource(String tenantIdentifier) {
        return getDataSource(tenantIdentifier);
    }

    private DataSource getDataSource(String tenantId) {
        if (tenantId.equals("PUBLIC")) {
            DriverManagerDataSource dataSource = new DriverManagerDataSource();
            dataSource.setUrl(dataSourceProperties.getUrl());
            dataSource.setUsername(dataSourceProperties.getUsername());
            dataSource.setPassword(dataSourceProperties.getPassword());
            dataSource.setDriverClassName(dataSourceProperties.getDriverClassName());
            return dataSource;
        }

        return dataSourceMap.computeIfAbsent(tenantId, id -> {
            DriverManagerDataSource dataSource = new DriverManagerDataSource();
            dataSource.setUrl(dataSourceProperties.getUrl());
            dataSource.setUsername(dataSourceProperties.getUsername());
            dataSource.setPassword(dataSourceProperties.getPassword());
            dataSource.setDriverClassName(dataSourceProperties.getDriverClassName());
            return dataSource;
        });
    }
}
