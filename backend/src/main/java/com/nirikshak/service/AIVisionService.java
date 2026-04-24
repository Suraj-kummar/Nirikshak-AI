package com.nirikshak.service;

import com.nirikshak.dto.AlertDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Service
public class AIVisionService {

    private final WebClient webClient;
    private final int timeoutMs;

    public AIVisionService(
        @Qualifier("aiVisionWebClient") WebClient webClient,
        @Value("${ai.vision.timeout.ms:2000}") int timeoutMs
    ) {
        this.webClient = webClient;
        this.timeoutMs = timeoutMs;
    }

    /**
     * Send a base64 frame to the Python AI service and return a Mono<AlertDTO>.
     * Uses subscribeOn(Schedulers.boundedElastic()) so the HTTP round-trip never blocks an
     * event-loop thread — fixes the "block()/blockFirst() is blocking" runtime error.
     * On timeout or any error, emits a CLEAR alert with confidence=0.0 so the exam
     * session is never interrupted due to AI service issues.
     */
    @SuppressWarnings("unchecked")
    public Mono<AlertDTO> analyzeFrame(String frameBase64) {
        return webClient.post()
            .uri("/analyze")
            .bodyValue(Map.of("frameBase64", frameBase64))
            .retrieve()
            .bodyToMono(Map.class)
            .timeout(Duration.ofMillis(timeoutMs))
            .onErrorResume(ex -> {
                log.warn("AI Vision service error (returning CLEAR): {}", ex.getMessage());
                return Mono.just(Map.of(
                    "alertType",   "CLEAR",
                    "confidence",  0.0,
                    "severity",    "LOW",
                    "description", "AI service unavailable; frame skipped"
                ));
            })
            .map(response -> {
                if (response == null) return clearAlert();
                return AlertDTO.builder()
                    .alertType(String.valueOf(response.getOrDefault("alertType", "CLEAR")))
                    .confidence(toFloat(response.getOrDefault("confidence", 0.0)))
                    .severity(String.valueOf(response.getOrDefault("severity", "LOW")))
                    .message(String.valueOf(response.getOrDefault("description", "")))
                    .timestamp(System.currentTimeMillis())
                    .build();
            })
            .subscribeOn(Schedulers.boundedElastic())
            .onErrorReturn(clearAlert());
    }

    private AlertDTO clearAlert() {
        return AlertDTO.builder()
            .alertType("CLEAR")
            .confidence(0.0f)
            .severity("LOW")
            .message("Frame analysis skipped")
            .timestamp(System.currentTimeMillis())
            .build();
    }

    private Float toFloat(Object obj) {
        if (obj instanceof Number n) return n.floatValue();
        try { return Float.parseFloat(String.valueOf(obj)); }
        catch (NumberFormatException e) { return 0.0f; }
    }
}
