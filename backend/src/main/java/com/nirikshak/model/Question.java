package com.nirikshak.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "exam_id", nullable = false)
    private String examId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "option_a", nullable = false, columnDefinition = "TEXT")
    private String optionA;

    @Column(name = "option_b", nullable = false, columnDefinition = "TEXT")
    private String optionB;

    @Column(name = "option_c", nullable = false, columnDefinition = "TEXT")
    private String optionC;

    @Column(name = "option_d", nullable = false, columnDefinition = "TEXT")
    private String optionD;

    /** A | B | C | D */
    @Column(name = "correct_ans", nullable = false, length = 1)
    private String correctAns;

    /** EASY | MEDIUM | HARD */
    @Column(nullable = false)
    @Builder.Default
    private String difficulty = "MEDIUM";

    @Column(nullable = false)
    @Builder.Default
    private Integer marks = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
