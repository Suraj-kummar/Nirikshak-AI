package com.nirikshak.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertDTO {
    private String alertType;    // CLEAR | GAZE_AWAY | MULTIPLE_FACES | NO_FACE
    private Float  confidence;
    private String severity;     // LOW | MEDIUM | HIGH
    private String message;
    private Long   timestamp;
}
