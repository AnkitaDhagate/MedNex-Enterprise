package com.mednex.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
        System.out.println("\n========================================");
        System.out.println("✅ MedNex Backend Started Successfully!");
        System.out.println("📍 Server running at: http://localhost:8082");
        System.out.println("📍 API Base URL: http://localhost:8082/api");
        System.out.println("📍 Health Check: http://localhost:8082/api/health");
        System.out.println("========================================\n");
    }
}