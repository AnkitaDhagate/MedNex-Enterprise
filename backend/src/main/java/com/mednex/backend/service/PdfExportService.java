package com.mednex.backend.service;

import com.mednex.backend.model.MedicalRecord;
import com.mednex.backend.model.Patient;
import com.mednex.backend.repository.MedicalRecordRepository;
import com.mednex.backend.repository.PatientRepository;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// PDFBox 2.x imports (package structure changed from 1.x)
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.pdmodel.font.PDType1Font;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Generates an AES-128 encrypted Patient History PDF.
 * Uses Apache PDFBox 2.0.31 via Maven Central — works on Windows/Linux/Mac.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfExportService {

    private final PatientRepository patientRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AuditService auditService;

    @Value("${pdf.encryption.user-password:MedNex@2024}")
    private String userPassword;

    @Value("${pdf.encryption.owner-password:MedNexOwner@2024}")
    private String ownerPassword;

    // Page geometry (A4)
    private static final float PAGE_WIDTH  = PDRectangle.A4.getWidth();   // 595f
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();  // 842f
    private static final float MARGIN      = 50f;
    private static final float LINE_H      = 16f;

    // ── Public entry point ───────────────────────────────────────────────────

    public byte[] generateEncryptedPatientHistoryPdf(Long patientId) {
        String tenantId    = TenantContext.getCurrentTenant();
        String currentUser = getCurrentUser();

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));
        if (!patient.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Cross-tenant access denied.");
        }

        List<MedicalRecord> records = medicalRecordRepository
                .findByPatientIdAndTenantIdOrderByEncounterDateDesc(patientId, tenantId);

        List<String> lines = buildLines(patient, records);

        try (PDDocument doc = new PDDocument()) {  // try-with-resources (PDFBox 2.x supports Closeable)

            renderPages(doc, lines);

            // ── AES-128 Encryption ──
            AccessPermission perms = new AccessPermission();
            perms.setCanPrint(true);
            perms.setCanExtractContent(false);
            perms.setCanModify(false);

            StandardProtectionPolicy policy =
                    new StandardProtectionPolicy(ownerPassword, userPassword, perms);
            policy.setEncryptionKeyLength(128);
            doc.protect(policy);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);

            auditService.log(currentUser, "EXPORT", "PATIENT", String.valueOf(patientId),
                    "Exported encrypted PDF: " + patient.getFirstName() + " " + patient.getLastName());

            return baos.toByteArray();

        } catch (Exception e) {
            log.error("PDF generation error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage());
        }
    }

    // ── Build text lines ─────────────────────────────────────────────────────

    private List<String> buildLines(Patient p, List<MedicalRecord> records) {
        List<String> lines = new ArrayList<>();

        lines.add("=== MEDNEX ENTERPRISE HMS — CONFIDENTIAL PATIENT RECORD ===");
        lines.add("Generated: " + LocalDate.now() + "    Tenant: " + p.getTenantId());
        lines.add("");
        lines.add("--- PATIENT INFORMATION ---");
        lines.add("Patient ID   : " + safe(p.getPatientId()));
        lines.add("Full Name    : " + p.getFirstName() + " " + p.getLastName());
        lines.add("Date of Birth: " + safe(p.getDateOfBirth()));
        lines.add("Gender       : " + safe(p.getGender()));
        lines.add("Blood Group  : " + (p.getBloodGroup() != null ? p.getBloodGroup().getDbValue() : "-"));
        lines.add("Phone        : " + safe(p.getPhone()));
        lines.add("Email        : " + safe(p.getEmail()));
        lines.add("Address      : " + safe(p.getAddressLine1()) + ", " + safe(p.getCity()));
        lines.add("Status       : " + safe(p.getPatientStatus()));
        lines.add("Doctor       : " + safe(p.getPrimaryDoctorName()));
        lines.add("");

        if (p.getInsuranceProvider() != null) {
            lines.add("--- INSURANCE ---");
            lines.add("Provider     : " + safe(p.getInsuranceProvider()));
            lines.add("Policy #     : " + safe(p.getInsurancePolicyNumber()));
            lines.add("Valid To     : " + safe(p.getInsuranceValidTo()));
            lines.add("");
        }

        if (p.getMedicalHistory() != null && !p.getMedicalHistory().isEmpty()) {
            lines.add("--- MEDICAL HISTORY ---");
            for (Map.Entry<String, Object> e : p.getMedicalHistory().entrySet()) {
                lines.add("  " + e.getKey() + ": " + safe(e.getValue()));
            }
            lines.add("");
        }

        if (p.getAllergies() != null && !p.getAllergies().isEmpty()) {
            lines.add("--- KNOWN ALLERGIES ---");
            for (Map.Entry<String, Object> e : p.getAllergies().entrySet()) {
                lines.add("  " + e.getKey() + ": " + safe(e.getValue()));
            }
            lines.add("");
        }

        lines.add("--- ENCOUNTER RECORDS (" + records.size() + ") ---");
        for (MedicalRecord r : records) {
            lines.add("");
            lines.add("Record ID  : " + safe(r.getRecordId())
                    + "   Type: " + safe(r.getEncounterType())
                    + "   Date: " + safe(r.getEncounterDate()));
            lines.add("Department : " + safe(r.getDepartment()));
            if (r.getChiefComplaint()  != null) lines.add("Complaint  : " + wrap(r.getChiefComplaint(), 80));
            if (r.getPrimaryDiagnosis()!= null) lines.add("Diagnosis  : " + wrap(r.getPrimaryDiagnosis(), 80));
            if (r.getTreatmentPlan()   != null) lines.add("Treatment  : " + wrap(r.getTreatmentPlan(), 80));
            lines.add("Follow-up  : " + (Boolean.TRUE.equals(r.getFollowUpRequired())
                    ? "Yes — " + safe(r.getFollowUpDate()) : "No"));
            if (r.getDisposition() != null) lines.add("Disposition: " + r.getDisposition());
            lines.add("---");
        }

        lines.add("");
        lines.add("CONFIDENTIAL — Protected under HIPAA/GDPR regulations.");
        lines.add("Unauthorised disclosure is strictly prohibited.");
        return lines;
    }

    // ── Render lines onto PDF pages ──────────────────────────────────────────

    private void renderPages(PDDocument doc, List<String> lines) throws IOException {
        // USE THESE INSTEAD
        PDType1Font fontBold   = PDType1Font.HELVETICA_BOLD;
        PDType1Font fontNormal = PDType1Font.HELVETICA;

        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);

        float y = PAGE_HEIGHT - MARGIN - LINE_H;

        // PDFBox 2.x: PDPageContentStream constructor signature changed
        PDPageContentStream cs = new PDPageContentStream(
                doc, page, PDPageContentStream.AppendMode.OVERWRITE, true);

        cs.beginText();
        cs.setFont(fontNormal, 9);
        cs.newLineAtOffset(MARGIN, y);  // PDFBox 2.x: newLineAtOffset instead of moveTextPositionByAmount

        for (String line : lines) {
            if (y < MARGIN + LINE_H) {
                cs.endText();
                cs.close();

                page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                y = PAGE_HEIGHT - MARGIN - LINE_H;

                cs = new PDPageContentStream(
                        doc, page, PDPageContentStream.AppendMode.OVERWRITE, true);
                cs.beginText();
                cs.setFont(fontNormal, 9);
                cs.newLineAtOffset(MARGIN, y);
            }

            boolean isHeader = line.startsWith("===") || line.startsWith("---")
                    || line.startsWith("Generated:");
            cs.setFont(isHeader ? fontBold : fontNormal, isHeader ? 10 : 9);

            // Strip non-ASCII to avoid PDType1Font encoding issues
            String safeLine = line.replaceAll("[^\u0020-\u007E]", " ");
            cs.showText(safeLine);          // PDFBox 2.x: showText instead of drawString
            cs.newLineAtOffset(0, -LINE_H); // PDFBox 2.x: newLineAtOffset instead of moveTextPositionByAmount
            y -= LINE_H;
        }

        cs.endText();
        cs.close();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String safe(Object o) { return o != null ? o.toString() : "-"; }

    private String wrap(String text, int maxLen) {
        if (text == null) return "-";
        return text.length() > maxLen ? text.substring(0, maxLen) + "..." : text;
    }

    private String getCurrentUser() {
        try { return SecurityContextHolder.getContext().getAuthentication().getName(); }
        catch (Exception e) { return "system"; }
    }
}