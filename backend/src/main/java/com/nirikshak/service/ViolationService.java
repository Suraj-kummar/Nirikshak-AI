package com.nirikshak.service;

import com.nirikshak.dto.AlertDTO;
import com.nirikshak.dto.ViolationReport;
import com.nirikshak.model.ExamSession;
import com.nirikshak.model.Student;
import com.nirikshak.model.Violation;
import com.nirikshak.repository.ExamSessionRepository;
import com.nirikshak.repository.StudentRepository;
import com.nirikshak.repository.ViolationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ViolationService {

    private final ViolationRepository  violationRepository;
    private final ExamSessionRepository sessionRepository;
    private final StudentRepository     studentRepository;
    private final ExamSessionService    sessionService;

    /**
     * Persist a violation (immutable — never updated/deleted after save).
     */
    @Transactional
    public Violation saveViolation(UUID sessionId, AlertDTO alert) {
        Violation v = Violation.builder()
            .sessionId(sessionId)
            .alertType(alert.getAlertType())
            .severity(alert.getSeverity())
            .confidence(alert.getConfidence())
            .description(alert.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        v = violationRepository.save(v);
        sessionService.incrementViolationCount(sessionId);
        log.info("Violation saved: sessionId={} type={} severity={}", sessionId, alert.getAlertType(), alert.getSeverity());
        return v;
    }

    /**
     * Build the full post-exam violation report.
     * Uses a single GROUP BY query to fetch all alert-type counts in one DB round-trip
     * instead of 3 separate COUNT queries (3× cheaper).
     */
    public ViolationReport getReport(UUID sessionId) {
        ExamSession session = sessionService.getSession(sessionId);
        Student student = studentRepository.findById(session.getStudentId())
            .orElse(null);

        List<Violation> violations = violationRepository.findBySessionIdOrderByTimestampAsc(sessionId);

        // Single GROUP BY query — one round-trip for all counts
        List<Object[]> counts = violationRepository.groupedCountsBySessionId(sessionId);
        long gazeAway      = 0;
        long multipleFaces = 0;
        long noFace        = 0;
        for (Object[] row : counts) {
            String type = (String) row[0];
            long   cnt  = (Long)   row[1];
            switch (type) {
                case "GAZE_AWAY"      -> gazeAway      = cnt;
                case "MULTIPLE_FACES" -> multipleFaces = cnt;
                case "NO_FACE"        -> noFace        = cnt;
                default -> {} // CLEAR or future types — ignored
            }
        }

        long durationSec = 0;
        if (session.getEndTime() != null) {
            durationSec = ChronoUnit.SECONDS.between(session.getStartTime(), session.getEndTime());
        }

        return ViolationReport.builder()
            .sessionId(sessionId)
            .studentName(student != null ? student.getName() : "Unknown")
            .examId(session.getExamId())
            .durationSeconds(durationSec)
            .totalViolations(session.getTotalViolations())
            .gazeAwayCount(gazeAway)
            .multipleFacesCount(multipleFaces)
            .noFaceCount(noFace)
            .violations(violations)
            .build();
    }
}
