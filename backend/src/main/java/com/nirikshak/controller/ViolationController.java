package com.nirikshak.controller;

import com.nirikshak.dto.ViolationReport;
import com.nirikshak.service.ViolationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/violations")
@RequiredArgsConstructor
public class ViolationController {

    private final ViolationService violationService;

    /** GET /api/violations/{sessionId} — full violation report for a session */
    @GetMapping("/{sessionId}")
    public ResponseEntity<ViolationReport> getReport(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(violationService.getReport(sessionId));
    }
}
