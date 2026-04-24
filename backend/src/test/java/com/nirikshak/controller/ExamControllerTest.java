package com.nirikshak.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nirikshak.model.ExamSession;
import com.nirikshak.service.ExamSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ExamController.class)
@Import(com.nirikshak.security.SecurityConfig.class)
class ExamControllerTest {

    @Autowired MockMvc      mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean ExamSessionService              sessionService;
    @MockBean com.nirikshak.security.JwtUtil  jwtUtil;
    @MockBean com.nirikshak.security.JwtFilter jwtFilter;

    private static final UUID SESSION_ID  = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID STUDENT_ID  = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private ExamSession activeSession;

    @BeforeEach
    void setUp() {
        activeSession = ExamSession.builder()
            .id(SESSION_ID)
            .studentId(STUDENT_ID)
            .examId("EXAM-001")
            .startTime(LocalDateTime.now())
            .status("ACTIVE")
            .totalViolations(0)
            .build();
    }

    // ── GET /api/exam/{id} ────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/exam/{id} returns 200 with session details")
    @WithMockUser(roles = "STUDENT")
    void getSession_exists_returns200() throws Exception {
        when(sessionService.getSession(SESSION_ID)).thenReturn(activeSession);

        mockMvc.perform(get("/api/exam/{id}", SESSION_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(SESSION_ID.toString()))
            .andExpect(jsonPath("$.examId").value("EXAM-001"))
            .andExpect(jsonPath("$.status").value("ACTIVE"))
            .andExpect(jsonPath("$.totalViolations").value(0));
    }

    @Test
    @DisplayName("GET /api/exam/{id} returns 400 when session not found")
    @WithMockUser(roles = "STUDENT")
    void getSession_notFound_returns400() throws Exception {
        when(sessionService.getSession(SESSION_ID))
            .thenThrow(new IllegalArgumentException("Session not found: " + SESSION_ID));

        mockMvc.perform(get("/api/exam/{id}", SESSION_ID))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.message").value("Session not found: " + SESSION_ID));
    }

    @Test
    @DisplayName("GET /api/exam/{id} returns 401 without authentication")
    void getSession_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/exam/{id}", SESSION_ID))
            .andExpect(status().isUnauthorized());
    }

    // ── POST /api/exam/start ───────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/exam/start creates and returns new session")
    @WithMockUser(username = "student@nirikshak.ai", roles = "STUDENT")
    void startExam_validRequest_returns200() throws Exception {
        when(sessionService.createSession(any(UUID.class), anyString()))
            .thenReturn(activeSession);

        mockMvc.perform(post("/api/exam/start")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("examId", "EXAM-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.examId").value("EXAM-001"))
            .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /api/exam/start uses GENERAL as default examId when body is empty")
    @WithMockUser(username = "student@nirikshak.ai", roles = "STUDENT")
    void startExam_emptyBody_usesDefaultExamId() throws Exception {
        ExamSession generalSession = ExamSession.builder()
            .id(SESSION_ID)
            .studentId(STUDENT_ID)
            .examId("GENERAL")
            .startTime(LocalDateTime.now())
            .status("ACTIVE")
            .totalViolations(0)
            .build();

        when(sessionService.createSession(any(UUID.class), eq("GENERAL")))
            .thenReturn(generalSession);

        mockMvc.perform(post("/api/exam/start")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.examId").value("GENERAL"));
    }

    // ── POST /api/exam/{id}/end ───────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/exam/{id}/end with COMPLETED status returns updated session")
    @WithMockUser(roles = "STUDENT")
    void endExam_completed_returns200() throws Exception {
        ExamSession completedSession = ExamSession.builder()
            .id(SESSION_ID)
            .studentId(STUDENT_ID)
            .examId("EXAM-001")
            .startTime(LocalDateTime.now().minusHours(1))
            .endTime(LocalDateTime.now())
            .status("COMPLETED")
            .totalViolations(3)
            .build();

        when(sessionService.endSession(SESSION_ID, "COMPLETED")).thenReturn(completedSession);

        mockMvc.perform(post("/api/exam/{id}/end", SESSION_ID)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "COMPLETED"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("COMPLETED"))
            .andExpect(jsonPath("$.totalViolations").value(3));
    }

    @Test
    @DisplayName("POST /api/exam/{id}/end with no body defaults to COMPLETED")
    @WithMockUser(roles = "STUDENT")
    void endExam_noBody_defaultsToCompleted() throws Exception {
        ExamSession completedSession = ExamSession.builder()
            .id(SESSION_ID)
            .studentId(STUDENT_ID)
            .examId("EXAM-001")
            .startTime(LocalDateTime.now().minusMinutes(30))
            .endTime(LocalDateTime.now())
            .status("COMPLETED")
            .totalViolations(0)
            .build();

        when(sessionService.endSession(SESSION_ID, "COMPLETED")).thenReturn(completedSession);

        mockMvc.perform(post("/api/exam/{id}/end", SESSION_ID)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("POST /api/exam/{id}/end returns 400 when session not found")
    @WithMockUser(roles = "STUDENT")
    void endExam_notFound_returns400() throws Exception {
        when(sessionService.endSession(SESSION_ID, "COMPLETED"))
            .thenThrow(new IllegalArgumentException("Session not found: " + SESSION_ID));

        mockMvc.perform(post("/api/exam/{id}/end", SESSION_ID)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "COMPLETED"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }
}
