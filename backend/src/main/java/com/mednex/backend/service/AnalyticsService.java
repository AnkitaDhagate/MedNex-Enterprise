package com.mednex.backend.service;

import com.mednex.backend.model.BedOccupancy;
import com.mednex.backend.repository.AppointmentRepository;
import com.mednex.backend.repository.BedOccupancyRepository;
import com.mednex.backend.repository.MedicalRecordRepository;
import com.mednex.backend.repository.PatientRepository;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final BedOccupancyRepository bedOccupancyRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    private String currentTenant() {
        String t = TenantContext.getCurrentTenant();
        if (t == null || t.isBlank()) throw new RuntimeException("Tenant context not set.");
        return t;
    }

    /** Week 4: Bed Occupancy Rates for Angular Charts dashboard */
    public List<Map<String, Object>> getBedOccupancyRates() {
        String tenantId = currentTenant();
        List<BedOccupancy> records = bedOccupancyRepository
                .findByTenantIdAndRecordDateOrderByDepartmentAsc(tenantId, LocalDate.now());

        if (records.isEmpty()) {
            return getDefaultBedOccupancy(tenantId);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (BedOccupancy b : records) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("department",    b.getDepartment());
            entry.put("totalBeds",     b.getTotalBeds());
            entry.put("occupiedBeds",  b.getOccupiedBeds());
            entry.put("availableBeds", b.getAvailableBeds());
            entry.put("occupancyRate", b.getOccupancyRate());
            entry.put("recordDate",    b.getRecordDate().toString());
            result.add(entry);
        }
        return result;
    }

    /** Weekly trend – last 7 days occupancy data for line charts */
    public List<Map<String, Object>> getOccupancyTrend() {
        String tenantId = currentTenant();
        LocalDate to   = LocalDate.now();
        LocalDate from = to.minusDays(6);
        List<BedOccupancy> records = bedOccupancyRepository.findByTenantIdAndDateRange(tenantId, from, to);

        List<Map<String, Object>> result = new ArrayList<>();
        for (BedOccupancy b : records) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date",          b.getRecordDate().toString());
            entry.put("department",    b.getDepartment());
            entry.put("occupancyRate", b.getOccupancyRate());
            result.add(entry);
        }
        return result;
    }

    @Transactional
    public BedOccupancy upsertBedOccupancy(String department, int total, int occupied) {
        String tenantId = currentTenant();
        BedOccupancy b = new BedOccupancy();
        b.setTenantId(tenantId);
        b.setDepartment(department);
        b.setTotalBeds(total);
        b.setOccupiedBeds(occupied);
        b.setAvailableBeds(total - occupied);
        b.setOccupancyRate((occupied * 100.0) / total);
        b.setRecordDate(LocalDate.now());
        return bedOccupancyRepository.save(b);
    }

    /** Dashboard summary stats */
    public Map<String, Object> getDashboardStats() {
        String tenantId = currentTenant();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPatients",     patientRepository.countByTenantId(tenantId));
        stats.put("totalAppointments", appointmentRepository.countByTenantId(tenantId));
        stats.put("totalRecords",      medicalRecordRepository.countByTenantId(tenantId));
        stats.put("scheduledToday",    appointmentRepository.countByTenantIdAndStatus(tenantId, "SCHEDULED"));
        stats.put("completedToday",    appointmentRepository.countByTenantIdAndStatus(tenantId, "COMPLETED"));
        stats.put("cancelledTotal",    appointmentRepository.countByTenantIdAndStatus(tenantId, "CANCELLED"));
        stats.put("generatedAt",       java.time.LocalDateTime.now().toString());
        return stats;
    }

    /** Fallback synthetic data for demo when no DB records yet */
    private List<Map<String, Object>> getDefaultBedOccupancy(String tenantId) {
        String[][] depts = {
                {"ICU",            "20",  "18"},
                {"General Ward",   "80",  "62"},
                {"Pediatrics",     "30",  "21"},
                {"Cardiology",     "25",  "20"},
                {"Orthopedics",    "20",  "13"},
                {"Maternity",      "15",  "11"},
                {"Neurology",      "18",  "14"},
                {"Oncology",       "22",  "17"},
        };
        List<Map<String, Object>> result = new ArrayList<>();
        for (String[] d : depts) {
            int total    = Integer.parseInt(d[1]);
            int occupied = Integer.parseInt(d[2]);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("department",    d[0]);
            entry.put("totalBeds",     total);
            entry.put("occupiedBeds",  occupied);
            entry.put("availableBeds", total - occupied);
            entry.put("occupancyRate", Math.round((occupied * 100.0) / total * 10) / 10.0);
            entry.put("recordDate",    LocalDate.now().toString());
            result.add(entry);
        }
        return result;
    }
}
