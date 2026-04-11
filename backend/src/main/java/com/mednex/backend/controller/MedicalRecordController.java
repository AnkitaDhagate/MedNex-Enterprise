package com.mednex.backend.controller;

import com.mednex.backend.dto.MedicalRecordDTO;
import com.mednex.backend.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * FIXED: Added DELETE /api/medical-records/{id}
 * Frontend: medicalRecordAPI.delete(id)
 */
@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping
    public ResponseEntity<?> createMedicalRecord(@RequestBody MedicalRecordDTO dto) {
        try {
            return ResponseEntity.ok(medicalRecordService.createMedicalRecord(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllRecords() {
        try {
            return ResponseEntity.ok(medicalRecordService.getAllRecords());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMedicalRecord(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(medicalRecordService.getMedicalRecord(id));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getPatientRecords(@PathVariable Long patientId) {
        try {
            return ResponseEntity.ok(medicalRecordService.getPatientMedicalRecords(patientId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMedicalRecord(@PathVariable Long id,
                                                 @RequestBody MedicalRecordDTO dto) {
        try {
            return ResponseEntity.ok(medicalRecordService.updateMedicalRecord(id, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * ADDED: DELETE /api/medical-records/{id}
     * Frontend: medicalRecordAPI.delete(id)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMedicalRecord(@PathVariable Long id) {
        try {
            medicalRecordService.deleteMedicalRecord(id);
            return ResponseEntity.ok(Map.of("message", "Medical record deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
