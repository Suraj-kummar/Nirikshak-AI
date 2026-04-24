package com.nirikshak.dto;

import lombok.*;
import java.util.UUID;

/**
 * QuestionDTO — returned to students.
 * NOTE: correctAns is intentionally EXCLUDED to prevent cheating.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDTO {
    private UUID   id;
    private String examId;
    private String content;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String difficulty;
    private Integer marks;
}
