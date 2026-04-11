package com.mednex.backend.controller;

import com.mednex.backend.service.PdfExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * FIXED: Added short paths that match the React frontend exportAPI calls:
 *
 *   Frontend exportAPI.exportPatientPDF(id)       → GET /export/patient/{id}
 *   Frontend exportAPI.exportMedicalRecordPDF(id) → GET /export/record/{id}
 *   Frontend exportAPI.exportAppointmentPDF(id)   → GET /export/appointment/{id}
 *
 * Original path /export/patient/{id}/pdf also kept for compatibility.
 */
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final PdfExportService pdfExportService;

    // ── Patient PDF ──────────────────────────────────────────────────────────

    /** Original path */
    @GetMapping("/patient/{id}/pdf")
    public ResponseEntity<?> exportPatientPdfOriginal(@PathVariable Long id) {
        return exportPatientPdf(id);
    }

    /**
     * ADDED: Short path matching frontend: exportAPI.exportPatientPDF(id)
     * GET /api/export/patient/{id}
     */
    @GetMapping("/patient/{id}")
    public ResponseEntity<?> exportPatientPdfShort(@PathVariable Long id) {
        return exportPatientPdf(id);
    }

    private ResponseEntity<?> exportPatientPdf(Long id) {
        try {
            byte[] pdfBytes = pdfExportService.generateEncryptedPatientHistoryPdf(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"patient_history_" + id + ".pdf\"")
                    .header("X-PDF-Encrypted", "true")
                    .header("X-PDF-Algorithm", "AES-128")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Medical Record PDF ───────────────────────────────────────────────────

    /**
     * ADDED: GET /api/export/record/{id}
     * Frontend: exportAPI.exportMedicalRecordPDF(recordId)
     */
    @GetMapping("/record/{id}")
    public ResponseEntity<?> exportMedicalRecordPdf(@PathVariable Long id) {
        try {
            byte[] pdfBytes = pdfExportService.generateMedicalRecordPdf(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"medical_record_" + id + ".pdf\"")
                    .header("X-PDF-Encrypted", "true")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Appointment PDF ──────────────────────────────────────────────────────

    /**
     * ADDED: GET /api/export/appointment/{id}
     * Frontend: exportAPI.exportAppointmentPDF(appointmentId)
     */
    @GetMapping("/appointment/{id}")
    public ResponseEntity<?> exportAppointmentPdf(@PathVariable Long id) {
        try {
            byte[] pdfBytes = pdfExportService.generateAppointmentPdf(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"appointment_" + id + ".pdf\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
