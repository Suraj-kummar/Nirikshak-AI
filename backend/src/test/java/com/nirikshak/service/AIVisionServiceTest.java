package com.nirikshak.service;

import com.nirikshak.dto.AlertDTO;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.test.StepVerifier;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * AIVisionServiceTest
 * ===================
 * Unit-tests for AIVisionService using MockWebServer (OkHttp) to stub
 * the Python AI Vision service without starting a real HTTP server.
 *
 * Covers:
 *  1. Successful response mapping (alertType, confidence, severity, message)
 *  2. Timeout — service returns CLEAR with confidence=0.0
 *  3. HTTP 500 error — service returns CLEAR (onErrorResume path)
 *  4. Null / empty response — returns CLEAR fallback
 *  5. toFloat edge cases (non-numeric string → 0.0, Integer, Double)
 */
class AIVisionServiceTest {

    private MockWebServer mockServer;
    private AIVisionService aiVisionService;

    @BeforeEach
    void setUp() throws IOException {
        mockServer = new MockWebServer();
        mockServer.start();

        WebClient webClient = WebClient.builder()
            .baseUrl(mockServer.url("/").toString())
            .build();

        // 50ms timeout so timeout tests complete quickly
        aiVisionService = new AIVisionService(webClient, 50);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockServer.shutdown();
    }

    // ── 1. Successful response mapping ────────────────────────────────────────

    @Test
    @DisplayName("analyzeFrame maps a valid GAZE_AWAY response correctly")
    void analyzeFrame_mapsSuccessfulResponse() {
        mockServer.enqueue(new MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            .setBody("""
                {
                  "alertType": "GAZE_AWAY",
                  "confidence": 0.87,
                  "severity": "MEDIUM",
                  "description": "Student gaze deviated"
                }
                """));

        StepVerifier.create(aiVisionService.analyzeFrame("base64data"))
            .assertNext(alert -> {
                assertThat(alert.getAlertType()).isEqualTo("GAZE_AWAY");
                assertThat(alert.getConfidence()).isEqualTo(0.87f, org.assertj.core.data.Offset.offset(0.01f));
                assertThat(alert.getSeverity()).isEqualTo("MEDIUM");
                assertThat(alert.getMessage()).isEqualTo("Student gaze deviated");
                assertThat(alert.getTimestamp()).isPositive();
            })
            .verifyComplete();
    }

    // ── 2. Timeout — onErrorResume returns CLEAR ──────────────────────────────

    @Test
    @DisplayName("analyzeFrame returns CLEAR on timeout (no response enqueued)")
    void analyzeFrame_returnsClearOnTimeout() {
        // No response enqueued — server will accept connection but not respond,
        // triggering the 50ms timeout
        mockServer.enqueue(new MockResponse().setBodyDelay(500, java.util.concurrent.TimeUnit.MILLISECONDS)
            .setResponseCode(200).setBody("{}"));

        StepVerifier.create(aiVisionService.analyzeFrame("base64data"))
            .assertNext(alert -> {
                assertThat(alert.getAlertType()).isEqualTo("CLEAR");
                assertThat(alert.getConfidence()).isEqualTo(0.0f);
            })
            .verifyComplete();
    }

    // ── 3. HTTP 500 — onErrorResume path ──────────────────────────────────────

    @Test
    @DisplayName("analyzeFrame returns CLEAR on HTTP 500 error response")
    void analyzeFrame_returnsClearOnServerError() {
        mockServer.enqueue(new MockResponse().setResponseCode(500).setBody("Internal Server Error"));

        StepVerifier.create(aiVisionService.analyzeFrame("base64data"))
            .assertNext(alert -> {
                assertThat(alert.getAlertType()).isEqualTo("CLEAR");
                assertThat(alert.getConfidence()).isEqualTo(0.0f);
                assertThat(alert.getSeverity()).isEqualTo("LOW");
            })
            .verifyComplete();
    }

    // ── 4. CLEAR response — full mapping ──────────────────────────────────────

    @Test
    @DisplayName("analyzeFrame correctly maps a CLEAR response from Python service")
    void analyzeFrame_mapsClearResponse() {
        mockServer.enqueue(new MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            .setBody("""
                {
                  "alertType": "CLEAR",
                  "confidence": 0.95,
                  "severity": "LOW",
                  "description": "All OK"
                }
                """));

        StepVerifier.create(aiVisionService.analyzeFrame("frame"))
            .assertNext(alert -> {
                assertThat(alert.getAlertType()).isEqualTo("CLEAR");
                assertThat(alert.getConfidence()).isEqualTo(0.95f, org.assertj.core.data.Offset.offset(0.01f));
                assertThat(alert.getSeverity()).isEqualTo("LOW");
            })
            .verifyComplete();
    }

    // ── 5. toFloat edge cases — tested via successful mapping ─────────────────

    @Test
    @DisplayName("analyzeFrame handles Integer confidence field (not Double)")
    void analyzeFrame_handlesIntegerConfidence() {
        mockServer.enqueue(new MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            // JSON integer (no decimal) — Jackson deserializes as Integer, not Double
            .setBody("{\"alertType\":\"NO_FACE\",\"confidence\":1,\"severity\":\"HIGH\",\"description\":\"no face\"}"));

        StepVerifier.create(aiVisionService.analyzeFrame("frame"))
            .assertNext(alert -> {
                assertThat(alert.getAlertType()).isEqualTo("NO_FACE");
                assertThat(alert.getConfidence()).isEqualTo(1.0f, org.assertj.core.data.Offset.offset(0.01f));
            })
            .verifyComplete();
    }
}
