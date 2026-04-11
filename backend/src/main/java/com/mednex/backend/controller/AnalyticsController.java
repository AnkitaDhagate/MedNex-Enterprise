package com.mednex.backend.controller;

import com.mednex.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * FIXED: Added missing endpoints to match React frontend analyticsAPI calls:
 *   GET /analytics/trend        → analyticsAPI.getTrend()
 *   GET /analytics/summary      → analyticsAPI.getSummary()
 *   GET /analytics/departments  → analyticsAPI.getDepartmentStats()
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /** GET /api/analytics/bed-occupancy — bed occupancy rates */
    @GetMapping("/bed-occupancy")
    public ResponseEntity<?> getBedOccupancy() {
        try {
            return ResponseEntity.ok(analyticsService.getBedOccupancyRates());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/analytics/trend
     * Frontend: analyticsAPI.getTrend()
     * Maps to 7-day occupancy trend data.
     */
    @GetMapping("/trend")
    public ResponseEntity<?> getTrend() {
        try {
            return ResponseEntity.ok(analyticsService.getOccupancyTrend());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/analytics/bed-occupancy/trend — original path kept for compatibility */
    @GetMapping("/bed-occupancy/trend")
    public ResponseEntity<?> getOccupancyTrend() {
        try {
            return ResponseEntity.ok(analyticsService.getOccupancyTrend());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/analytics/summary
     * Frontend: analyticsAPI.getSummary()
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getDashboardSummary() {
        try {
            return ResponseEntity.ok(analyticsService.getDashboardStats());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/analytics/departments
     * Frontend: analyticsAPI.getDepartmentStats()
     */
    @GetMapping("/departments")
    public ResponseEntity<?> getDepartmentStats() {
        try {
            return ResponseEntity.ok(analyticsService.getDepartmentStats());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** POST /api/analytics/bed-occupancy — upsert bed occupancy data */
    @PostMapping("/bed-occupancy")
    public ResponseEntity<?> updateBedOccupancy(@RequestBody Map<String, Object> body) {
        try {
            String dept     = (String)  body.get("department");
            int    total    = ((Number) body.get("totalBeds")).intValue();
            int    occupied = ((Number) body.get("occupiedBeds")).intValue();
            return ResponseEntity.ok(analyticsService.upsertBedOccupancy(dept, total, occupied));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
