package com.nirikshak.dto;

import lombok.Data;

@Data
public class FramePayload {
    private String sessionId;
    private String frameBase64;
    private Long timestamp;
}
