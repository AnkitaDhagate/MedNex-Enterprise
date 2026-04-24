package com.mednex.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * FIX: Added handlers for the most common errors that made the frontend show
 * "Save failed" without any useful message:
 *
 * 1. DataIntegrityViolationException — duplicate email/phone, FK violations, etc.
 * 2. HttpMessageNotReadableException — bad JSON, wrong date format from frontend.
 * 3. MethodArgumentNotValidException — @Valid failures (missing required fields).
 * 4. Generic RuntimeException — service-layer errors like "Tenant context not set".
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.error("DB constraint violation: {}", ex.getMessage());
        String message = ex.getMessage();
        String userFriendly = "A database constraint was violated.";
        if (message != null) {
            if (message.contains("email"))           userFriendly = "This email is already registered.";
            else if (message.contains("phone"))      userFriendly = "This phone number is already registered.";
            else if (message.contains("tenant_id"))  userFriendly = "Invalid tenant ID. Please check your hospital selection.";
            else if (message.contains("uk_doctor_date_time")) userFriendly = "This time slot is already booked for the selected doctor.";
            else if (message.contains("Duplicate"))  userFriendly = "A record with these details already exists.";
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(error(userFriendly, HttpStatus.CONFLICT.value()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleBadJson(HttpMessageNotReadableException ex) {
        log.warn("Bad request body: {}", ex.getMessage());
        String msg = "Invalid request format. ";
        if (ex.getMessage() != null && ex.getMessage().contains("LocalTime")) {
            msg += "Time must be in HH:mm format (e.g. 09:30).";
        } else if (ex.getMessage() != null && ex.getMessage().contains("LocalDate")) {
            msg += "Date must be in YYYY-MM-DD format.";
        } else {
            msg += "Please check that all fields are correctly formatted.";
        }
        return ResponseEntity.badRequest().body(error(msg, 400));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .findFirst().orElse("Validation failed");
        return ResponseEntity.badRequest().body(error(msg, 400));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        log.error("Runtime error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(error(ex.getMessage(), 400));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(error("An unexpected error occurred: " + ex.getMessage(), 500));
    }

    private Map<String, Object> error(String message, int status) {
        return Map.of(
            "error",     message,
            "status",    status,
            "timestamp", LocalDateTime.now().toString()
        );
    }
}
