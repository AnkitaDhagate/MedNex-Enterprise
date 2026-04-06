package com.mednex.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
        System.out.println("\n========================================");
        System.out.println("✅ MedNex Enterprise HMS Started!");
        System.out.println("📍 Port            : http://localhost:8082");
        System.out.println("📍 Health          : http://localhost:8082/api/health");
        System.out.println("📍 Auth Login      : POST /api/auth/login");
        System.out.println("📍 Patients        : GET  /api/patients");
        System.out.println("📍 Medical Records : GET  /api/medical-records");
        System.out.println("📍 Appointments    : GET  /api/appointments");
        System.out.println("📍 Analytics       : GET  /api/analytics/bed-occupancy");
        System.out.println("📍 Audit Logs      : GET  /api/audit-logs");
        System.out.println("📍 Export PDF      : GET  /api/export/patient/{id}/pdf");
        System.out.println("========================================\n");
    }
}
