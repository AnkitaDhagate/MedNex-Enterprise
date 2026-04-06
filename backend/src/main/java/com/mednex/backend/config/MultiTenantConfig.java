package com.mednex.backend.config;

import com.mednex.backend.tenant.TenantConnectionProvider;
import com.mednex.backend.tenant.TenantIdentifierResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.orm.jpa.JpaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.JpaVendorAdapter;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class MultiTenantConfig {

    private final TenantConnectionProvider tenantConnectionProvider;
    private final TenantIdentifierResolver  tenantIdentifierResolver;
    private final JpaProperties             jpaProperties;

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.mednex.backend.model");

        JpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> props = new HashMap<>(jpaProperties.getProperties());

        // Hibernate 6 multi-tenancy property keys
        props.put("hibernate.dialect",
                "org.hibernate.dialect.PostgreSQLDialect");
        props.put("hibernate.multi_tenant_connection_provider",
                tenantConnectionProvider);
        props.put("hibernate.tenant_identifier_resolver",
                tenantIdentifierResolver);
        props.put("hibernate.multiTenancy",     "DATABASE");
        props.put("hibernate.hbm2ddl.auto",     "update");
        props.put("hibernate.show_sql",         "true");
        props.put("hibernate.format_sql",       "true");
        // Jackson JSONB support
        props.put("hibernate.type.json_format_mapper",
                "com.fasterxml.jackson.databind.ObjectMapper");

        em.setJpaPropertyMap(props);
        return em;
    }
}
