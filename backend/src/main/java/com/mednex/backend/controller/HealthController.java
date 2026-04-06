package com.mednex.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, String> health() {
        Map<String, String> status = new LinkedHashMap<>();
        status.put("status",    "UP");
        status.put("service",   "MedNex Enterprise HMS");
        status.put("version",   "1.0.0");
        status.put("timestamp", java.time.LocalDateTime.now().toString());
        return status;
    }
}
