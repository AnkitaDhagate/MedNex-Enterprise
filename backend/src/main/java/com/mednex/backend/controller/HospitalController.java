package com.mednex.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/hospital")
public class HospitalController {

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getHospitalInfo() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("name",        "City Central Hospital");
        info.put("established", "1985");
        info.put("type",        "Multi-Speciality Hospital");
        info.put("beds",        500);
        info.put("doctors",     150);
        info.put("staff",       450);
        info.put("rating",      "4.8");
        info.put("address",     "123 Healthcare Avenue, Medical District, City - 400001");
        info.put("phone",       "+91 22 1234 5678");
        info.put("email",       "info@citycentralhospital.com");
        info.put("emergency",   "+91 22 1234 9999");
        return ResponseEntity.ok(info);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getHospitalStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPatients",       15234);
        stats.put("totalDoctors",        156);
        stats.put("totalStaff",          458);
        stats.put("bedsAvailable",       85);
        stats.put("todayAppointments",   124);
        stats.put("emergencyCases",      12);
        stats.put("surgeriesToday",      8);
        stats.put("satisfactionRate",    "94%");
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Map<String, Object>>> getDepartments() {
        List<Map<String, Object>> depts = new ArrayList<>();
        depts.add(dept("Cardiology",   "Heart Care",       25, "3rd Floor"));
        depts.add(dept("Neurology",    "Brain & Spine",    15, "4th Floor"));
        depts.add(dept("Pediatrics",   "Child Care",       20, "2nd Floor"));
        depts.add(dept("Orthopedics",  "Bone & Joint",     18, "3rd Floor"));
        depts.add(dept("Gynecology",   "Women's Health",   12, "2nd Floor"));
        depts.add(dept("Emergency",    "24/7 Emergency",   30, "Ground Floor"));
        depts.add(dept("Oncology",     "Cancer Care",      14, "5th Floor"));
        depts.add(dept("ICU",          "Intensive Care",   10, "Ground Floor"));
        return ResponseEntity.ok(depts);
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, Object>>> getDoctors() {
        List<Map<String, Object>> docs = new ArrayList<>();
        docs.add(doctor(1L, "Dr. John Smith",    "Cardiologist",      15));
        docs.add(doctor(2L, "Dr. Sarah Johnson", "Neurologist",       12));
        docs.add(doctor(3L, "Dr. Michael Brown", "Pediatrician",      10));
        docs.add(doctor(4L, "Dr. Emily Davis",   "Orthopedic",         8));
        docs.add(doctor(5L, "Dr. Robert Wilson", "General Physician",  20));
        docs.add(doctor(6L, "Dr. Lisa Anderson", "Gynecologist",       12));
        docs.add(doctor(7L, "Dr. Raj Kumar",     "Oncologist",         17));
        return ResponseEntity.ok(docs);
    }

    private Map<String, Object> dept(String name, String desc, int doctors, String location) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name); m.put("description", desc);
        m.put("doctors", doctors); m.put("location", location);
        return m;
    }

    private Map<String, Object> doctor(Long id, String name, String spec, int exp) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id); m.put("name", name);
        m.put("specialization", spec);
        m.put("experience", exp + " years");
        m.put("available", true);
        return m;
    }
}
