package com.mednex.backend.controller;

import com.mednex.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /** Week 4: Bed Occupancy Rates – used by Angular Charts dashboard */
    @GetMapping("/bed-occupancy")
    public ResponseEntity<?> getBedOccupancy() {
        try {
            return ResponseEntity.ok(analyticsService.getBedOccupancyRates());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** 7-day occupancy trend for line charts */
    @GetMapping("/bed-occupancy/trend")
    public ResponseEntity<?> getOccupancyTrend() {
        try {
            return ResponseEntity.ok(analyticsService.getOccupancyTrend());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** Update or seed bed occupancy data */
    @PostMapping("/bed-occupancy")
    public ResponseEntity<?> updateBedOccupancy(@RequestBody Map<String, Object> body) {
        try {
            String dept    = (String)  body.get("department");
            int    total   = ((Number) body.get("totalBeds")).intValue();
            int    occupied = ((Number) body.get("occupiedBeds")).intValue();
            return ResponseEntity.ok(analyticsService.upsertBedOccupancy(dept, total, occupied));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Overall dashboard summary stats */
    @GetMapping("/summary")
    public ResponseEntity<?> getDashboardSummary() {
        try {
            return ResponseEntity.ok(analyticsService.getDashboardStats());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
