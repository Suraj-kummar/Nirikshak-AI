package com.nirikshak.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "violations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Violation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    /** GAZE_AWAY | MULTIPLE_FACES | NO_FACE */
    @Column(name = "alert_type", nullable = false)
    private String alertType;

    /** LOW | MEDIUM | HIGH */
    @Column(nullable = false)
    private String severity;

    @Column(nullable = false)
    @Builder.Default
    private Float confidence = 0.0f;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
