package com.nirikshak.service;

import com.nirikshak.model.ExamSession;
import com.nirikshak.repository.ExamSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamSessionServiceTest {

    @Mock ExamSessionRepository sessionRepository;

    @InjectMocks ExamSessionService sessionService;

    private UUID studentId;
    private UUID sessionId;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
    }

    @Test
    @DisplayName("createSession builds ACTIVE session and persists it")
    void createSession_buildsActiveSession() {
        ExamSession saved = ExamSession.builder()
            .id(sessionId)
            .studentId(studentId)
            .examId("EXAM-001")
            .startTime(LocalDateTime.now())
            .status("ACTIVE")
            .totalViolations(0)
            .build();

        when(sessionRepository.save(any(ExamSession.class))).thenReturn(saved);

        ExamSession result = sessionService.createSession(studentId, "EXAM-001");

        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        assertThat(result.getTotalViolations()).isEqualTo(0);
        assertThat(result.getExamId()).isEqualTo("EXAM-001");
        verify(sessionRepository).save(any(ExamSession.class));
    }

    @Test
    @DisplayName("validateActiveSession throws for non-ACTIVE sessions")
    void validateActiveSession_throwsForCompletedSession() {
        when(sessionRepository.findByIdAndStatus(sessionId, "ACTIVE"))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.validateActiveSession(sessionId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("No active session");
    }

    @Test
    @DisplayName("endSession sets status and endTime")
    void endSession_setsStatusAndEndTime() {
        ExamSession active = ExamSession.builder()
            .id(sessionId).studentId(studentId).examId("EX")
            .startTime(LocalDateTime.now().minusMinutes(60))
            .status("ACTIVE").totalViolations(3).build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(active));
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ExamSession ended = sessionService.endSession(sessionId, "COMPLETED");

        assertThat(ended.getStatus()).isEqualTo("COMPLETED");
        assertThat(ended.getEndTime()).isNotNull();
    }

    @Test
    @DisplayName("getSession throws for unknown ID")
    void getSession_throwsForUnknownId() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.getSession(sessionId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Session not found");
    }

    @Test
    @DisplayName("incrementViolationCount increments and saves")
    void incrementViolationCount_incrementsAndSaves() {
        ExamSession session = ExamSession.builder()
            .id(sessionId).studentId(studentId).examId("EX")
            .startTime(LocalDateTime.now()).status("ACTIVE").totalViolations(4).build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        sessionService.incrementViolationCount(sessionId);

        assertThat(session.getTotalViolations()).isEqualTo(5);
        verify(sessionRepository).save(session);
    }
}
