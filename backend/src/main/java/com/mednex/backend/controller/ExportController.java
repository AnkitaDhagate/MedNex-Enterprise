package com.mednex.backend.controller;

import com.mednex.backend.service.PdfExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final PdfExportService pdfExportService;

    /**
     * Week 4: Download AES-256 encrypted Patient History PDF.
     * Password: configured in application.properties (pdf.encryption.user-password)
     */
    @GetMapping("/patient/{id}/pdf")
    public ResponseEntity<?> exportPatientPdf(@PathVariable Long id) {
        try {
            byte[] pdfBytes = pdfExportService.generateEncryptedPatientHistoryPdf(id);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"patient_history_" + id + ".pdf\"")
                    .header("X-PDF-Encrypted", "true")
                    .header("X-PDF-Algorithm", "AES-256")
                    .body(pdfBytes);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
