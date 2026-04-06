package com.mednex.backend.controller;

import com.mednex.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId) {
        try {
            return ResponseEntity.ok(dashboardService.getDashboardStats(tenantId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/recent-patients")
    public ResponseEntity<?> getRecentPatients(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId) {
        try {
            return ResponseEntity.ok(dashboardService.getRecentPatients(tenantId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/recent-appointments")
    public ResponseEntity<?> getRecentAppointments(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId) {
        try {
            return ResponseEntity.ok(dashboardService.getRecentAppointments(tenantId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/bed-occupancy")
    public ResponseEntity<?> getBedOccupancy(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId) {
        try {
            return ResponseEntity.ok(dashboardService.getBedOccupancy(tenantId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
