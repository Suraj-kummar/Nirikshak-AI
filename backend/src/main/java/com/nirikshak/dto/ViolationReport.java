package com.nirikshak.dto;

import com.nirikshak.model.Violation;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViolationReport {
    private UUID           sessionId;
    private String         studentName;
    private String         examId;
    private Long           durationSeconds;
    private Integer        totalViolations;
    private Long           gazeAwayCount;
    private Long           multipleFacesCount;
    private Long           noFaceCount;
    private List<Violation> violations;
}
