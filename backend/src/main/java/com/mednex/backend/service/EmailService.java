package com.mednex.backend.service;

import com.mednex.backend.model.Appointment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendAppointmentConfirmation(Appointment appointment) {
        if (appointment.getPatientEmail() == null || appointment.getPatientEmail().isBlank()) {
            log.warn("No email for appointment {}, skipping confirmation.", appointment.getAppointmentId());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(appointment.getPatientEmail());
            helper.setSubject("Appointment Confirmed – " + appointment.getAppointmentId());
            helper.setText(buildConfirmationHtml(appointment), true);
            mailSender.send(message);
            log.info("Confirmation sent to {}", appointment.getPatientEmail());
        } catch (MessagingException e) {
            log.error("Failed to send confirmation: {}", e.getMessage());
        }
    }

    @Async
    public void sendAppointmentReminder(Appointment appointment) {
        if (appointment.getPatientEmail() == null || appointment.getPatientEmail().isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(appointment.getPatientEmail());
            helper.setSubject("Reminder: Appointment Tomorrow – " + appointment.getAppointmentId());
            helper.setText(buildReminderHtml(appointment), true);
            mailSender.send(message);
            log.info("Reminder sent to {}", appointment.getPatientEmail());
        } catch (MessagingException e) {
            log.error("Failed to send reminder: {}", e.getMessage());
        }
    }

    private String buildConfirmationHtml(Appointment a) {
        return "<html><body style='font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto'>"
                + "<div style='background:#1a73e8;padding:20px;border-radius:8px 8px 0 0'>"
                + "<h2 style='color:#fff;margin:0'>&#10003; Appointment Confirmed</h2></div>"
                + "<div style='border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px'>"
                + "<p>Dear <strong>" + safe(a.getPatientName()) + "</strong>,</p>"
                + "<p>Your appointment has been confirmed:</p>"
                + "<table style='width:100%;border-collapse:collapse;margin:16px 0'>"
                + row("Appointment ID", safe(a.getAppointmentId()), true)
                + row("Doctor",         safe(a.getDoctorName()), false)
                + row("Department",     safe(a.getDepartment()), true)
                + row("Date",           safe(a.getAppointmentDate()), false)
                + row("Time",           safe(a.getAppointmentTime()), true)
                + "</table>"
                + "<p>Please arrive 10 minutes early with valid ID and insurance card.</p>"
                + "<hr style='border:none;border-top:1px solid #eee;margin:20px 0'>"
                + "<p style='font-size:12px;color:#999'>MedNex Enterprise Hospital Management System</p>"
                + "</div></body></html>";
    }

    private String buildReminderHtml(Appointment a) {
        return "<html><body style='font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto'>"
                + "<div style='background:#f57c00;padding:20px;border-radius:8px 8px 0 0'>"
                + "<h2 style='color:#fff;margin:0'>&#128276; Appointment Reminder</h2></div>"
                + "<div style='border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px'>"
                + "<p>Dear <strong>" + safe(a.getPatientName()) + "</strong>,</p>"
                + "<p>Reminder: you have an appointment <strong>tomorrow</strong>:</p>"
                + "<table style='width:100%;border-collapse:collapse;margin:16px 0'>"
                + row("Doctor", safe(a.getDoctorName()), true)
                + row("Date",   safe(a.getAppointmentDate()), false)
                + row("Time",   safe(a.getAppointmentTime()), true)
                + "</table>"
                + "<p>Bring all relevant medical reports and insurance documents.</p>"
                + "<hr style='border:none;border-top:1px solid #eee;margin:20px 0'>"
                + "<p style='font-size:12px;color:#999'>MedNex Enterprise Hospital Management System</p>"
                + "</div></body></html>";
    }

    private String row(String label, String value, boolean shaded) {
        String bg = shaded ? "background:#f5f5f5;" : "";
        return "<tr style='" + bg + "'>"
                + "<td style='padding:10px;font-weight:bold'>" + label + "</td>"
                + "<td style='padding:10px'>" + value + "</td></tr>";
    }

    private String safe(Object o) { return o != null ? o.toString() : "-"; }
}
