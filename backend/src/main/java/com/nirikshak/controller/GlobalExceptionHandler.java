package com.nirikshak.controller;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.Instant;
import java.util.stream.Collectors;

/**
 * GlobalExceptionHandler
 * ======================
 * Converts all exceptions into a consistent JSON error envelope.
 * Prevents Spring's default HTML error pages from leaking to clients.
 *
 * Response shape:
 * {
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "Invalid email or password",
 *   "path": "/api/auth/login",
 *   "timestamp": "2024-04-19T11:30:00Z"
 * }
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Business logic errors (400) ────────────────────────────────────────────
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
        IllegalArgumentException ex, WebRequest request
    ) {
        log.warn("Business error [{}]: {}", path(request), ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), path(request));
    }

    // ── Bean validation errors (422) ──────────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
        MethodArgumentNotValidException ex, WebRequest request
    ) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .sorted()
            .collect(Collectors.joining("; "));
        log.warn("Validation error [{}]: {}", path(request), message);
        return build(HttpStatus.UNPROCESSABLE_ENTITY, message, path(request));
    }

    // ── Security / access denied (403) ───────────────────────────────────────
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
        Exception ex, WebRequest request
    ) {
        log.warn("Access denied [{}]", path(request));
        return build(HttpStatus.FORBIDDEN, "Access denied", path(request));
    }

    // ── Rate limit exceeded (429) — thrown by RateLimitFilter ────────────────
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimit(
        RateLimitExceededException ex, WebRequest request
    ) {
        log.warn("Rate limit exceeded [{}]: {}", path(request), ex.getMessage());
        return build(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage(), path(request));
    }

    // ── Catch-all (500) ───────────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
        Exception ex, WebRequest request
    ) {
        log.error("Unexpected error [{}]: {}", path(request), ex.getMessage(), ex);
        // Never expose internal details in production
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", path(request));
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, String path) {
        return ResponseEntity.status(status).body(
            ErrorResponse.builder()
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(path)
                .timestamp(Instant.now().toString())
                .build()
        );
    }

    private String path(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }

    // ── Error response DTO (inner class) ──────────────────────────────────────
    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorResponse {
        private int    status;
        private String error;
        private String message;
        private String path;
        private String timestamp;
    }

    // ── Custom exception for rate limiting ────────────────────────────────────
    public static class RateLimitExceededException extends RuntimeException {
        public RateLimitExceededException(String message) { super(message); }
    }
}
