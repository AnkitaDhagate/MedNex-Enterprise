package com.mednex.backend.service;

import com.mednex.backend.model.Appointment;
import com.mednex.backend.model.Patient;
import com.mednex.backend.repository.AppointmentRepository;
import com.mednex.backend.repository.PatientRepository;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final AnalyticsService analyticsService;

    private String currentTenant() {
        String t = TenantContext.getCurrentTenant();
        if (t == null || t.isBlank()) throw new RuntimeException("Tenant context not set.");
        return t;
    }

    public Map<String, Object> getDashboardStats(String tenantId) {
        return analyticsService.getDashboardStats();
    }

    public List<Patient> getRecentPatients(String tenantId) {
        return patientRepository.findRecentByTenantId(tenantId, LocalDateTime.now().minusDays(7));
    }

    public List<Appointment> getRecentAppointments(String tenantId) {
        return appointmentRepository.findByTenantIdOrderByAppointmentDateDescAppointmentTimeDesc(tenantId)
                .stream().limit(10).toList();
    }

    public List<Map<String, Object>> getBedOccupancy(String tenantId) {
        return analyticsService.getBedOccupancyRates();
    }
}
