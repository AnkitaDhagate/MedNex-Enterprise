package com.mednex.backend.service;

import com.mednex.backend.model.Appointment;
import com.mednex.backend.model.MedicalRecord;
import com.mednex.backend.model.Patient;
import com.mednex.backend.repository.AppointmentRepository;
import com.mednex.backend.repository.MedicalRecordRepository;
import com.mednex.backend.repository.PatientRepository;
import com.mednex.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
 * FIXED/ADDED:
 *   - generateMedicalRecordPdf(Long id)  — for frontend exportAPI.exportMedicalRecordPDF
 *   - generateAppointmentPdf(Long id)    — for frontend exportAPI.exportAppointmentPDF
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfExportService {

    private final PatientRepository patientRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuditService auditService;

    @Value("${pdf.encryption.user-password:MedNex@2024}")
    private String userPassword;

    @Value("${pdf.encryption.owner-password:MedNexOwner@2024}")
    private String ownerPassword;

    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final float MARGIN      = 50f;
    private static final float LINE_H      = 16f;

    // ── Patient History PDF ──────────────────────────────────────────────────

    public byte[] generateEncryptedPatientHistoryPdf(Long patientId) {
        String tenantId    = TenantContext.getCurrentTenant();
        String currentUser = getCurrentUser();

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));
        if (!patient.getTenantId().equals(tenantId))
            throw new RuntimeException("Cross-tenant access denied.");

        List<MedicalRecord> records = medicalRecordRepository
                .findByPatientIdAndTenantIdOrderByEncounterDateDesc(patientId, tenantId);

        List<String> lines = buildPatientLines(patient, records);

        try (PDDocument doc = new PDDocument()) {
            renderPages(doc, lines);
            applyEncryption(doc);
            byte[] bytes = toBytes(doc);
            auditService.log(currentUser, "EXPORT", "PATIENT", String.valueOf(patientId),
                    "Exported encrypted PDF: " + patient.getFirstName() + " " + patient.getLastName());
            return bytes;
        } catch (Exception e) {
            log.error("PDF generation error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage());
        }
    }

    // ── Medical Record PDF ───────────────────────────────────────────────────

    /**
     * ADDED: Generate PDF for a single medical record.
     * Frontend: exportAPI.exportMedicalRecordPDF(recordId)
     */
    public byte[] generateMedicalRecordPdf(Long recordId) {
        String tenantId    = TenantContext.getCurrentTenant();
        String currentUser = getCurrentUser();

        MedicalRecord rec = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Medical record not found: " + recordId));
        if (!rec.getTenantId().equals(tenantId))
            throw new RuntimeException("Cross-tenant access denied.");

        List<String> lines = buildMedicalRecordLines(rec);

        try (PDDocument doc = new PDDocument()) {
            renderPages(doc, lines);
            applyEncryption(doc);
            byte[] bytes = toBytes(doc);
            auditService.log(currentUser, "EXPORT", "MEDICAL_RECORD", String.valueOf(recordId),
                    "Exported medical record PDF: " + rec.getRecordId());
            return bytes;
        } catch (Exception e) {
            log.error("Medical record PDF error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate medical record PDF: " + e.getMessage());
        }
    }

    // ── Appointment PDF ──────────────────────────────────────────────────────

    /**
     * ADDED: Generate PDF for a single appointment.
     * Frontend: exportAPI.exportAppointmentPDF(appointmentId)
     */
    public byte[] generateAppointmentPdf(Long appointmentId) {
        String tenantId    = TenantContext.getCurrentTenant();
        String currentUser = getCurrentUser();

        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));
        if (!appt.getTenantId().equals(tenantId))
            throw new RuntimeException("Cross-tenant access denied.");

        List<String> lines = buildAppointmentLines(appt);

        try (PDDocument doc = new PDDocument()) {
            renderPages(doc, lines);
            // Appointment PDFs: read-only but not encrypted by default
            byte[] bytes = toBytes(doc);
            auditService.log(currentUser, "EXPORT", "APPOINTMENT", String.valueOf(appointmentId),
                    "Exported appointment PDF: " + appt.getAppointmentId());
            return bytes;
        } catch (Exception e) {
            log.error("Appointment PDF error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate appointment PDF: " + e.getMessage());
        }
    }

    // ── Line builders ────────────────────────────────────────────────────────

    private List<String> buildPatientLines(Patient p, List<MedicalRecord> records) {
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
        lines.add("Address      : " + safe(p.getAddressLine1()) + ", " + safe(p.getCity()) + ", " + safe(p.getState()));
        lines.add("Postal Code  : " + safe(p.getPostalCode()));
        lines.add("Status       : " + safe(p.getPatientStatus()));
        lines.add("Doctor       : " + safe(p.getPrimaryDoctorName()));
        lines.add("Registered   : " + safe(p.getRegistrationDate()));
        lines.add("Occupation   : " + safe(p.getOccupation()));
        lines.add("Marital Stat : " + safe(p.getMaritalStatus()));
        lines.add("");

        lines.add("--- EMERGENCY CONTACT ---");
        lines.add("Name         : " + safe(p.getEmergencyContactName()));
        lines.add("Relationship : " + safe(p.getEmergencyContactRelationship()));
        lines.add("Phone        : " + safe(p.getEmergencyContactPhone()));
        lines.add("");

        if (p.getInsuranceProvider() != null) {
            lines.add("--- INSURANCE ---");
            lines.add("Provider     : " + safe(p.getInsuranceProvider()));
            lines.add("Policy #     : " + safe(p.getInsurancePolicyNumber()));
            lines.add("Group #      : " + safe(p.getInsuranceGroupNumber()));
            lines.add("Valid From   : " + safe(p.getInsuranceValidFrom()));
            lines.add("Valid To     : " + safe(p.getInsuranceValidTo()));
            lines.add("");
        }

        if (p.getMedicalHistory() != null && !p.getMedicalHistory().isEmpty()) {
            lines.add("--- MEDICAL HISTORY ---");
            for (Map.Entry<String, Object> e : p.getMedicalHistory().entrySet())
                lines.add("  " + e.getKey() + ": " + safe(e.getValue()));
            lines.add("");
        }

        if (p.getAllergies() != null && !p.getAllergies().isEmpty()) {
            lines.add("--- KNOWN ALLERGIES ---");
            for (Map.Entry<String, Object> e : p.getAllergies().entrySet())
                lines.add("  " + e.getKey() + ": " + safe(e.getValue()));
            lines.add("");
        }

        if (p.getCurrentMedications() != null && !p.getCurrentMedications().isEmpty()) {
            lines.add("--- CURRENT MEDICATIONS ---");
            for (Map.Entry<String, Object> e : p.getCurrentMedications().entrySet())
                lines.add("  " + e.getKey() + ": " + safe(e.getValue()));
            lines.add("");
        }

        lines.add("--- ENCOUNTER RECORDS (" + records.size() + ") ---");
        for (MedicalRecord r : records) {
            lines.add("");
            lines.add("Record ID  : " + safe(r.getRecordId())
                    + "   Type: " + safe(r.getEncounterType())
                    + "   Date: " + safe(r.getEncounterDate()));
            lines.add("Department : " + safe(r.getDepartment()));
            if (r.getChiefComplaint()   != null) lines.add("Complaint  : " + wrap(r.getChiefComplaint(), 90));
            if (r.getPrimaryDiagnosis() != null) lines.add("Diagnosis  : " + wrap(r.getPrimaryDiagnosis(), 90));
            if (r.getTreatmentPlan()    != null) lines.add("Treatment  : " + wrap(r.getTreatmentPlan(), 90));
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

    private List<String> buildMedicalRecordLines(MedicalRecord r) {
        List<String> lines = new ArrayList<>();
        lines.add("=== MEDNEX HMS — MEDICAL RECORD ===");
        lines.add("Generated: " + LocalDate.now());
        lines.add("");
        lines.add("--- ENCOUNTER DETAILS ---");
        lines.add("Record ID    : " + safe(r.getRecordId()));
        lines.add("Patient ID   : " + safe(r.getPatientId()));
        lines.add("Doctor ID    : " + safe(r.getDoctorId()));
        lines.add("Encounter Date: " + safe(r.getEncounterDate()));
        lines.add("Type         : " + safe(r.getEncounterType()));
        lines.add("Department   : " + safe(r.getDepartment()));
        lines.add("");
        lines.add("--- CLINICAL NOTES ---");
        lines.add("Chief Complaint: " + safe(r.getChiefComplaint()));
        lines.add("History       : " + wrap(safe(r.getHistoryOfPresentIllness()), 90));
        lines.add("Physical Exam : " + wrap(safe(r.getPhysicalExamination()), 90));
        lines.add("Primary Dx    : " + safe(r.getPrimaryDiagnosis()));
        lines.add("Treatment Plan: " + wrap(safe(r.getTreatmentPlan()), 90));
        lines.add("Follow-up     : " + (Boolean.TRUE.equals(r.getFollowUpRequired())
                ? "Required — " + safe(r.getFollowUpDate()) + " — " + safe(r.getFollowUpInstructions())
                : "Not required"));
        lines.add("Disposition   : " + safe(r.getDisposition()));
        if (r.getReferralNotes() != null) lines.add("Referral Notes: " + wrap(r.getReferralNotes(), 90));
        lines.add("");
        lines.add("CONFIDENTIAL — Protected under HIPAA/GDPR regulations.");
        return lines;
    }

    private List<String> buildAppointmentLines(Appointment a) {
        List<String> lines = new ArrayList<>();
        lines.add("=== MEDNEX HMS — APPOINTMENT CONFIRMATION ===");
        lines.add("Generated: " + LocalDate.now());
        lines.add("");
        lines.add("--- APPOINTMENT DETAILS ---");
        lines.add("Appointment ID : " + safe(a.getAppointmentId()));
        lines.add("Patient Name   : " + safe(a.getPatientName()));
        lines.add("Doctor         : " + safe(a.getDoctorName()));
        lines.add("Department     : " + safe(a.getDepartment()));
        lines.add("Date           : " + safe(a.getAppointmentDate()));
        lines.add("Time           : " + safe(a.getAppointmentTime()));
        lines.add("Duration       : " + safe(a.getDurationMinutes()) + " minutes");
        lines.add("Type           : " + safe(a.getAppointmentType()));
        lines.add("Status         : " + safe(a.getStatus()));
        lines.add("Reason         : " + safe(a.getReasonForVisit()));
        if (a.getNotes() != null) lines.add("Notes          : " + wrap(a.getNotes(), 90));
        lines.add("");
        lines.add("Please arrive 10 minutes early with valid ID and insurance card.");
        lines.add("MedNex Enterprise Hospital Management System");
        return lines;
    }

    // ── PDF utilities ────────────────────────────────────────────────────────

    private void renderPages(PDDocument doc, List<String> lines) throws IOException {
        PDType1Font fontBold   = PDType1Font.HELVETICA_BOLD;
        PDType1Font fontNormal = PDType1Font.HELVETICA;

        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);
        float y = PAGE_HEIGHT - MARGIN - LINE_H;

        PDPageContentStream cs = new PDPageContentStream(
                doc, page, PDPageContentStream.AppendMode.OVERWRITE, true);
        cs.beginText();
        cs.setFont(fontNormal, 9);
        cs.newLineAtOffset(MARGIN, y);

        for (String line : lines) {
            if (y < MARGIN + LINE_H) {
                cs.endText(); cs.close();
                page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                y = PAGE_HEIGHT - MARGIN - LINE_H;
                cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.OVERWRITE, true);
                cs.beginText();
                cs.setFont(fontNormal, 9);
                cs.newLineAtOffset(MARGIN, y);
            }
            boolean isHeader = line.startsWith("===") || line.startsWith("---");
            cs.setFont(isHeader ? fontBold : fontNormal, isHeader ? 10 : 9);
            String safeLine = line.replaceAll("[^\u0020-\u007E]", " ");
            cs.showText(safeLine);
            cs.newLineAtOffset(0, -LINE_H);
            y -= LINE_H;
        }
        cs.endText(); cs.close();
    }

    private void applyEncryption(PDDocument doc) throws Exception {
        AccessPermission perms = new AccessPermission();
        perms.setCanPrint(true);
        perms.setCanExtractContent(false);
        perms.setCanModify(false);
        StandardProtectionPolicy policy = new StandardProtectionPolicy(ownerPassword, userPassword, perms);
        policy.setEncryptionKeyLength(128);
        doc.protect(policy);
    }

    private byte[] toBytes(PDDocument doc) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        doc.save(baos);
        return baos.toByteArray();
    }

    private String safe(Object o)              { return o != null ? o.toString() : "-"; }
    private String wrap(String text, int maxLen) {
        if (text == null) return "-";
        return text.length() > maxLen ? text.substring(0, maxLen) + "..." : text;
    }
    private String getCurrentUser() {
        try { return SecurityContextHolder.getContext().getAuthentication().getName(); }
        catch (Exception e) { return "system"; }
    }
}
