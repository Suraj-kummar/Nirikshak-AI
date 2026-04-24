package com.nirikshak.service;

import com.nirikshak.dto.AlertDTO;
import com.nirikshak.model.ExamSession;
import com.nirikshak.model.Student;
import com.nirikshak.model.Violation;
import com.nirikshak.dto.ViolationReport;
import com.nirikshak.repository.ExamSessionRepository;
import com.nirikshak.repository.StudentRepository;
import com.nirikshak.repository.ViolationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ViolationServiceTest {

    @Mock ViolationRepository    violationRepository;
    @Mock ExamSessionRepository  sessionRepository;
    @Mock StudentRepository      studentRepository;
    @Mock ExamSessionService     sessionService;

    @InjectMocks ViolationService violationService;

    private UUID sessionId;
    private ExamSession session;
    private Student student;

    @BeforeEach
    void setUp() {
        sessionId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();

        session = ExamSession.builder()
            .id(sessionId)
            .studentId(studentId)
            .examId("TEST-EXAM-001")
            .startTime(LocalDateTime.now().minusMinutes(30))
            .endTime(LocalDateTime.now())
            .status("COMPLETED")
            .totalViolations(2)
            .build();

        student = Student.builder()
            .id(studentId)
            .name("Arjun Sharma")
            .email("arjun@test.com")
            .passwordHash("hashed")
            .role("STUDENT")
            .build();
    }

    @Test
    @DisplayName("saveViolation persists a Violation entity and increments session count")
    void saveViolation_persistsAndIncrements() {
        AlertDTO alert = AlertDTO.builder()
            .alertType("GAZE_AWAY")
            .severity("MEDIUM")
            .confidence(0.88f)
            .message("Student looked away")
            .timestamp(System.currentTimeMillis())
            .build();

        Violation saved = Violation.builder()
            .id(UUID.randomUUID())
            .sessionId(sessionId)
            .alertType("GAZE_AWAY")
            .severity("MEDIUM")
            .confidence(0.88f)
            .description("Student looked away")
            .timestamp(LocalDateTime.now())
            .build();

        when(violationRepository.save(any(Violation.class))).thenReturn(saved);

        Violation result = violationService.saveViolation(sessionId, alert);

        assertThat(result.getAlertType()).isEqualTo("GAZE_AWAY");
        assertThat(result.getSeverity()).isEqualTo("MEDIUM");
        verify(violationRepository).save(any(Violation.class));
        verify(sessionService).incrementViolationCount(sessionId);
    }

    @Test
    @DisplayName("getReport builds complete ViolationReport with correct counts")
    void getReport_buildsCompleteReport() {
        Violation v1 = Violation.builder()
            .id(UUID.randomUUID()).sessionId(sessionId)
            .alertType("GAZE_AWAY").severity("MEDIUM").confidence(0.9f)
            .description("Gaze away").timestamp(LocalDateTime.now().minusMinutes(20))
            .build();
        Violation v2 = Violation.builder()
            .id(UUID.randomUUID()).sessionId(sessionId)
            .alertType("NO_FACE").severity("HIGH").confidence(0.95f)
            .description("No face").timestamp(LocalDateTime.now().minusMinutes(10))
            .build();

        when(sessionService.getSession(sessionId)).thenReturn(session);
        when(studentRepository.findById(session.getStudentId())).thenReturn(Optional.of(student));
        when(violationRepository.findBySessionIdOrderByTimestampAsc(sessionId))
            .thenReturn(List.of(v1, v2));
        when(violationRepository.countBySessionIdAndAlertType(sessionId, "GAZE_AWAY")).thenReturn(1L);
        when(violationRepository.countBySessionIdAndAlertType(sessionId, "MULTIPLE_FACES")).thenReturn(0L);
        when(violationRepository.countBySessionIdAndAlertType(sessionId, "NO_FACE")).thenReturn(1L);

        ViolationReport report = violationService.getReport(sessionId);

        assertThat(report.getSessionId()).isEqualTo(sessionId);
        assertThat(report.getStudentName()).isEqualTo("Arjun Sharma");
        assertThat(report.getExamId()).isEqualTo("TEST-EXAM-001");
        assertThat(report.getTotalViolations()).isEqualTo(2);
        assertThat(report.getGazeAwayCount()).isEqualTo(1L);
        assertThat(report.getNoFaceCount()).isEqualTo(1L);
        assertThat(report.getMultipleFacesCount()).isEqualTo(0L);
        assertThat(report.getViolations()).hasSize(2);
    }

    @Test
    @DisplayName("getReport handles missing student gracefully")
    void getReport_missingStudent_usesUnknown() {
        when(sessionService.getSession(sessionId)).thenReturn(session);
        when(studentRepository.findById(any())).thenReturn(Optional.empty());
        when(violationRepository.findBySessionIdOrderByTimestampAsc(sessionId)).thenReturn(List.of());
        when(violationRepository.countBySessionIdAndAlertType(any(), any())).thenReturn(0L);

        ViolationReport report = violationService.getReport(sessionId);

        assertThat(report.getStudentName()).isEqualTo("Unknown");
    }
}
