package com.nirikshak.repository;

import com.nirikshak.model.ExamSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExamSessionRepository extends JpaRepository<ExamSession, UUID> {
    Optional<ExamSession> findByIdAndStatus(UUID id, String status);
    List<ExamSession> findByStudentId(UUID studentId);

    /**
     * Atomically increments total_violations by 1 for the given session.
     * Single UPDATE — avoids the previous SELECT + save round-trip (N+1).
     */
    @Modifying
    @Query("UPDATE ExamSession e SET e.totalViolations = e.totalViolations + 1 WHERE e.id = :id")
    void incrementViolations(@Param("id") UUID id);
}
