package com.mednex.backend.config;

import com.mednex.backend.tenant.TenantConnectionProvider;
import com.mednex.backend.tenant.TenantIdentifierResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.orm.jpa.JpaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.JpaVendorAdapter;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableTransactionManagement
@RequiredArgsConstructor
public class MultiTenantConfig {

    private final TenantConnectionProvider tenantConnectionProvider;
    private final TenantIdentifierResolver  tenantIdentifierResolver;
    private final JpaProperties             jpaProperties;

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.mednex.backend.model", "com.mednex.backend.entity");

        JpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> props = new HashMap<>(jpaProperties.getProperties());

        // FIX: Use MySQLDialect to match the actual database
        props.put("hibernate.dialect",                         "org.hibernate.dialect.MySQLDialect");
        props.put("hibernate.multi_tenant_connection_provider", tenantConnectionProvider);
        props.put("hibernate.tenant_identifier_resolver",       tenantIdentifierResolver);
        props.put("hibernate.multiTenancy",                    "DATABASE");
        props.put("hibernate.hbm2ddl.auto",                    "update");
        props.put("hibernate.show_sql",                        "true");
        props.put("hibernate.format_sql",                      "true");
        props.put("hibernate.jdbc.time_zone",                  "UTC");

        em.setJpaPropertyMap(props);
        return em;
    }

    @Bean
    public PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
        JpaTransactionManager tm = new JpaTransactionManager();
        tm.setEntityManagerFactory(emf);
        return tm;
    }
}
