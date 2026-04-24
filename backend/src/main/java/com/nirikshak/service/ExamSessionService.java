package com.nirikshak.service;

import com.nirikshak.model.ExamSession;
import com.nirikshak.repository.ExamSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamSessionService {

    private final ExamSessionRepository sessionRepository;

    @Transactional
    public ExamSession createSession(UUID studentId, String examId) {
        ExamSession session = ExamSession.builder()
            .studentId(studentId)
            .examId(examId)
            .startTime(LocalDateTime.now())
            .status("ACTIVE")
            .totalViolations(0)
            .build();
        session = sessionRepository.save(session);
        log.info("Exam session created: sessionId={} studentId={}", session.getId(), studentId);
        return session;
    }

    public ExamSession getSession(UUID sessionId) {
        return sessionRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
    }

    public ExamSession validateActiveSession(UUID sessionId) {
        return sessionRepository.findByIdAndStatus(sessionId, "ACTIVE")
            .orElseThrow(() -> new IllegalArgumentException("No active session found: " + sessionId));
    }

    @Transactional
    public ExamSession endSession(UUID sessionId, String status) {
        ExamSession session = getSession(sessionId);
        session.setStatus(status);
        session.setEndTime(LocalDateTime.now());
        session = sessionRepository.save(session);
        long durationSec = ChronoUnit.SECONDS.between(session.getStartTime(), session.getEndTime());
        log.info("Session ended: sessionId={} status={} duration={}s", sessionId, status, durationSec);
        return session;
    }

    @Transactional
    public void incrementViolationCount(UUID sessionId) {
        // Single atomic UPDATE — no SELECT round-trip
        sessionRepository.incrementViolations(sessionId);
        log.debug("Violation count incremented for session={}", sessionId);
    }
}
