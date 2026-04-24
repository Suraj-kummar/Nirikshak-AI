package com.nirikshak.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nirikshak.dto.ViolationReport;
import com.nirikshak.model.Violation;
import com.nirikshak.service.ViolationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ViolationController.class)
@Import(com.nirikshak.security.SecurityConfig.class)
class ViolationControllerTest {

    @Autowired MockMvc      mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean ViolationService                 violationService;
    @MockBean com.nirikshak.security.JwtUtil   jwtUtil;
    @MockBean com.nirikshak.security.JwtFilter jwtFilter;

    private static final UUID SESSION_ID = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private ViolationReport sampleReport;

    @BeforeEach
    void setUp() {
        Violation v1 = Violation.builder()
            .id(UUID.randomUUID())
            .sessionId(SESSION_ID)
            .alertType("GAZE_AWAY")
            .severity("MEDIUM")
            .confidence(0.85f)
            .description("Student looked away")
            .timestamp(LocalDateTime.now().minusMinutes(10))
            .build();

        Violation v2 = Violation.builder()
            .id(UUID.randomUUID())
            .sessionId(SESSION_ID)
            .alertType("NO_FACE")
            .severity("HIGH")
            .confidence(0.95f)
            .description("No face detected")
            .timestamp(LocalDateTime.now().minusMinutes(5))
            .build();

        sampleReport = ViolationReport.builder()
            .sessionId(SESSION_ID)
            .studentName("Test Student")
            .examId("EXAM-001")
            .durationSeconds(3600L)
            .totalViolations(2)
            .gazeAwayCount(1L)
            .multipleFacesCount(0L)
            .noFaceCount(1L)
            .violations(List.of(v1, v2))
            .build();
    }

    // ── GET /api/violations/{sessionId} ──────────────────────────────────────

    @Test
    @DisplayName("GET /api/violations/{sessionId} returns 200 with full report")
    @WithMockUser(roles = "STUDENT")
    void getReport_exists_returns200() throws Exception {
        when(violationService.getReport(SESSION_ID)).thenReturn(sampleReport);

        mockMvc.perform(get("/api/violations/{sessionId}", SESSION_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.sessionId").value(SESSION_ID.toString()))
            .andExpect(jsonPath("$.studentName").value("Test Student"))
            .andExpect(jsonPath("$.examId").value("EXAM-001"))
            .andExpect(jsonPath("$.totalViolations").value(2))
            .andExpect(jsonPath("$.gazeAwayCount").value(1))
            .andExpect(jsonPath("$.noFaceCount").value(1))
            .andExpect(jsonPath("$.multipleFacesCount").value(0))
            .andExpect(jsonPath("$.durationSeconds").value(3600));
    }

    @Test
    @DisplayName("GET /api/violations/{sessionId} returns violations list in report")
    @WithMockUser(roles = "STUDENT")
    void getReport_returnsViolationsList() throws Exception {
        when(violationService.getReport(SESSION_ID)).thenReturn(sampleReport);

        mockMvc.perform(get("/api/violations/{sessionId}", SESSION_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.violations").isArray())
            .andExpect(jsonPath("$.violations.length()").value(2))
            .andExpect(jsonPath("$.violations[0].alertType").value("GAZE_AWAY"))
            .andExpect(jsonPath("$.violations[1].alertType").value("NO_FACE"));
    }

    @Test
    @DisplayName("GET /api/violations/{sessionId} returns 400 when session not found")
    @WithMockUser(roles = "STUDENT")
    void getReport_notFound_returns400() throws Exception {
        when(violationService.getReport(SESSION_ID))
            .thenThrow(new IllegalArgumentException("Session not found: " + SESSION_ID));

        mockMvc.perform(get("/api/violations/{sessionId}", SESSION_ID))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.error").value("Bad Request"))
            .andExpect(jsonPath("$.message").value("Session not found: " + SESSION_ID));
    }

    @Test
    @DisplayName("GET /api/violations/{sessionId} returns 401 without authentication")
    void getReport_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/violations/{sessionId}", SESSION_ID))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/violations/{sessionId} report can have zero violations")
    @WithMockUser(roles = "STUDENT")
    void getReport_zeroViolations_returns200() throws Exception {
        ViolationReport emptyReport = ViolationReport.builder()
            .sessionId(SESSION_ID)
            .studentName("Clean Student")
            .examId("EXAM-002")
            .durationSeconds(1800L)
            .totalViolations(0)
            .gazeAwayCount(0L)
            .multipleFacesCount(0L)
            .noFaceCount(0L)
            .violations(List.of())
            .build();

        when(violationService.getReport(SESSION_ID)).thenReturn(emptyReport);

        mockMvc.perform(get("/api/violations/{sessionId}", SESSION_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalViolations").value(0))
            .andExpect(jsonPath("$.violations").isArray())
            .andExpect(jsonPath("$.violations.length()").value(0));
    }
}
