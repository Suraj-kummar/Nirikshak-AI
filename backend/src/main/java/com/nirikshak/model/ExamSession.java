package com.nirikshak.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exam_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "exam_id", nullable = false)
    private String examId;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    /** ACTIVE | COMPLETED | TERMINATED */
    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "total_violations", nullable = false)
    @Builder.Default
    private Integer totalViolations = 0;
}
