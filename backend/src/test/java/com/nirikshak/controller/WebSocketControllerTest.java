package com.nirikshak.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nirikshak.dto.AlertDTO;
import com.nirikshak.dto.FramePayload;
import com.nirikshak.model.ExamSession;
import com.nirikshak.model.Violation;
import com.nirikshak.security.JwtUtil;
import com.nirikshak.service.AIVisionService;
import com.nirikshak.service.ExamSessionService;
import com.nirikshak.service.ViolationService;
import com.nirikshak.service.WebSocketBroadcaster;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * WebSocketControllerTest
 * =======================
 * Unit tests for WebSocketController using plain Mockito (no MockMvc slice).
 * WebSocket handlers are Spring components that extend TextWebSocketHandler,
 * so we test them directly via method invocation with mocked sessions.
 *
 * NOTE: AIVisionService.analyzeFrame() returns Mono<AlertDTO>; stubs use
 * Mono.just(...) accordingly.
 */
@ExtendWith(MockitoExtension.class)
class WebSocketControllerTest {

    @Mock JwtUtil             jwtUtil;
    @Mock AIVisionService     aiVisionService;
    @Mock ViolationService    violationService;
    @Mock ExamSessionService  sessionService;
    @Mock WebSocketBroadcaster broadcaster;
    @Mock WebSocketSession    wsSession;

    @Spy  ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks WebSocketController controller;

    private static final String VALID_TOKEN  = "valid.jwt.token";
    private static final UUID   SESSION_ID   = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static final UUID   STUDENT_ID   = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private ExamSession activeSession;
    /** Mutable attributes map — simulates a real WebSocket session's attribute map. */
    private Map<String, Object> sessionAttributes;

    @BeforeEach
    void setUp() {
        activeSession = ExamSession.builder()
            .id(SESSION_ID)
            .studentId(STUDENT_ID)
            .examId("EXAM-001")
            .startTime(LocalDateTime.now())
            .status("ACTIVE")
            .totalViolations(0)
            .build();

        // Mutable map that the controller can put ATTR_AUTHENTICATED into
        sessionAttributes = new HashMap<>();
        sessionAttributes.put("token",     VALID_TOKEN);
        sessionAttributes.put("studentId", STUDENT_ID.toString());
        sessionAttributes.put("authenticated", true); // pre-authenticated state

        when(wsSession.getAttributes()).thenReturn(sessionAttributes);
        when(wsSession.getId()).thenReturn("ws-session-id-001");
    }

    // ── AUTH handshake — success ───────────────────────────────────────────────

    @Test
    @DisplayName("AUTH message with valid token sets authenticated and sends AUTH_ACK OK")
    void handleAuthMessage_validToken_acksOk() throws Exception {
        // Fresh unauthenticated session
        Map<String, Object> freshAttrs = new HashMap<>();
        when(wsSession.getAttributes()).thenReturn(freshAttrs);
        when(jwtUtil.isValid(VALID_TOKEN)).thenReturn(true);
        when(jwtUtil.extractStudentId(VALID_TOKEN)).thenReturn(STUDENT_ID.toString());

        TextMessage authMsg = new TextMessage(
            objectMapper.writeValueAsString(Map.of("type", "AUTH", "token", VALID_TOKEN))
        );
        controller.handleTextMessage(wsSession, authMsg);

        verify(wsSession).sendMessage(argThat(m -> ((TextMessage) m).getPayload().contains("\"status\":\"OK\"")));
    }

    // ── AUTH handshake — rejection (Gap 3) ────────────────────────────────────

    @Test
    @DisplayName("AUTH message with invalid token sends AUTH_ACK FAIL and closes connection")
    void handleAuthMessage_invalidToken_sendsFailAndCloses() throws Exception {
        Map<String, Object> freshAttrs = new HashMap<>();
        when(wsSession.getAttributes()).thenReturn(freshAttrs);
        when(jwtUtil.isValid("bad.token")).thenReturn(false);

        TextMessage authMsg = new TextMessage(
            objectMapper.writeValueAsString(Map.of("type", "AUTH", "token", "bad.token"))
        );
        controller.handleTextMessage(wsSession, authMsg);

        verify(wsSession).sendMessage(argThat(m -> ((TextMessage) m).getPayload().contains("\"status\":\"FAIL\"")));
        verify(wsSession).close(CloseStatus.POLICY_VIOLATION);
    }

    @Test
    @DisplayName("AUTH message with missing token sends AUTH_ACK FAIL and closes connection")
    void handleAuthMessage_missingToken_sendsFailAndCloses() throws Exception {
        Map<String, Object> freshAttrs = new HashMap<>();
        when(wsSession.getAttributes()).thenReturn(freshAttrs);

        TextMessage authMsg = new TextMessage(
            objectMapper.writeValueAsString(Map.of("type", "AUTH"))  // no "token" field
        );
        controller.handleTextMessage(wsSession, authMsg);

        verify(wsSession).sendMessage(argThat(m -> ((TextMessage) m).getPayload().contains("\"status\":\"FAIL\"")));
        verify(wsSession).close(CloseStatus.POLICY_VIOLATION);
    }

    // ── Frame before AUTH ──────────────────────────────────────────────────────

    @Test
    @DisplayName("Frame message before AUTH is silently dropped")
    void handleTextMessage_frameBeforeAuth_isDropped() throws Exception {
        // Unauthenticated session — 'authenticated' key absent
        Map<String, Object> unauthAttrs = new HashMap<>();
        unauthAttrs.put("token", VALID_TOKEN);
        when(wsSession.getAttributes()).thenReturn(unauthAttrs);

        FramePayload payload = buildPayload(SESSION_ID.toString(), "base64==");
        controller.handleTextMessage(wsSession, new TextMessage(objectMapper.writeValueAsString(payload)));

        verify(aiVisionService, never()).analyzeFrame(any());
        verify(broadcaster,     never()).broadcast(any(), any());
    }

    // ── handleTextMessage — CLEAR alert ───────────────────────────────────────

    @Test
    @DisplayName("CLEAR alert is broadcast but NOT persisted as a violation")
    void handleTextMessage_clearAlert_broadcasted_notPersisted() throws Exception {
        FramePayload payload = buildPayload(SESSION_ID.toString(), "base64framedata==");
        TextMessage message  = new TextMessage(objectMapper.writeValueAsString(payload));

        AlertDTO clearAlert = AlertDTO.builder()
            .alertType("CLEAR").confidence(0.95f).severity("LOW")
            .message("All good").timestamp(System.currentTimeMillis())
            .build();

        when(jwtUtil.isValid(VALID_TOKEN)).thenReturn(true);
        when(sessionService.validateActiveSession(SESSION_ID)).thenReturn(activeSession);
        when(aiVisionService.analyzeFrame("base64framedata==")).thenReturn(Mono.just(clearAlert));

        controller.handleTextMessage(wsSession, message);

        // Give Mono time to execute synchronously (boundedElastic subscribes immediately in tests)
        Thread.sleep(100);

        verify(aiVisionService).analyzeFrame("base64framedata==");
        verify(violationService, never()).saveViolation(any(), any());
        verify(broadcaster).broadcast(eq(SESSION_ID.toString()), any(AlertDTO.class));
    }

    // ── handleTextMessage — GAZE_AWAY alert ───────────────────────────────────

    @Test
    @DisplayName("GAZE_AWAY alert is persisted AND broadcast")
    void handleTextMessage_gazeAwayAlert_persistedAndBroadcast() throws Exception {
        FramePayload payload = buildPayload(SESSION_ID.toString(), "frame==");
        TextMessage  message = new TextMessage(objectMapper.writeValueAsString(payload));

        AlertDTO gazeAlert = AlertDTO.builder()
            .alertType("GAZE_AWAY").confidence(0.88f).severity("MEDIUM")
            .message("Looking away").timestamp(System.currentTimeMillis())
            .build();

        when(jwtUtil.isValid(VALID_TOKEN)).thenReturn(true);
        when(sessionService.validateActiveSession(SESSION_ID)).thenReturn(activeSession);
        when(aiVisionService.analyzeFrame("frame==")).thenReturn(Mono.just(gazeAlert));
        when(violationService.saveViolation(eq(SESSION_ID), any(AlertDTO.class)))
            .thenReturn(mock(Violation.class));

        controller.handleTextMessage(wsSession, message);
        Thread.sleep(100);

        verify(violationService).saveViolation(eq(SESSION_ID), any(AlertDTO.class));
        verify(broadcaster).broadcast(eq(SESSION_ID.toString()), any(AlertDTO.class));
    }

    // ── handleTextMessage — NO_FACE alert ─────────────────────────────────────

    @Test
    @DisplayName("NO_FACE alert (HIGH severity) is persisted AND broadcast")
    void handleTextMessage_noFaceAlert_persistedAndBroadcast() throws Exception {
        FramePayload payload = buildPayload(SESSION_ID.toString(), "emptyframe==");
        TextMessage  message = new TextMessage(objectMapper.writeValueAsString(payload));

        AlertDTO noFaceAlert = AlertDTO.builder()
            .alertType("NO_FACE").confidence(0.95f).severity("HIGH")
            .message("No face detected").timestamp(System.currentTimeMillis())
            .build();

        when(jwtUtil.isValid(VALID_TOKEN)).thenReturn(true);
        when(sessionService.validateActiveSession(SESSION_ID)).thenReturn(activeSession);
        when(aiVisionService.analyzeFrame("emptyframe==")).thenReturn(Mono.just(noFaceAlert));
        when(violationService.saveViolation(any(), any())).thenReturn(mock(Violation.class));

        controller.handleTextMessage(wsSession, message);
        Thread.sleep(100);

        verify(violationService).saveViolation(eq(SESSION_ID), argThat(a ->
            "NO_FACE".equals(a.getAlertType()) && "HIGH".equals(a.getSeverity())
        ));
        verify(broadcaster).broadcast(eq(SESSION_ID.toString()), any(AlertDTO.class));
    }

    // ── handleTextMessage — expired JWT ───────────────────────────────────────

    @Test
    @DisplayName("Expired JWT closes the WebSocket session with POLICY_VIOLATION")
    void handleTextMessage_expiredJwt_closesSession() throws Exception {
        FramePayload payload = buildPayload(SESSION_ID.toString(), "frame==");
        TextMessage  message = new TextMessage(objectMapper.writeValueAsString(payload));

        when(jwtUtil.isValid(VALID_TOKEN)).thenReturn(false);

        controller.handleTextMessage(wsSession, message);

        verify(wsSession).close(CloseStatus.POLICY_VIOLATION);
        verify(aiVisionService, never()).analyzeFrame(any());
        verify(broadcaster,     never()).broadcast(any(), any());
    }

    // ── handleTextMessage — inactive session ──────────────────────────────────

    @Test
    @DisplayName("Frame for a TERMINATED session is rejected gracefully")
    void handleTextMessage_terminatedSession_noViolationSaved() throws Exception {
        FramePayload payload = buildPayload(SESSION_ID.toString(), "frame==");
        TextMessage  message = new TextMessage(objectMapper.writeValueAsString(payload));

        when(jwtUtil.isValid(VALID_TOKEN)).thenReturn(true);
        when(sessionService.validateActiveSession(SESSION_ID))
            .thenThrow(new IllegalArgumentException("No active session found: " + SESSION_ID));

        controller.handleTextMessage(wsSession, message);

        verify(violationService, never()).saveViolation(any(), any());
        verify(broadcaster,      never()).broadcast(any(), any());
    }

    // ── afterConnectionClosed / transport error ───────────────────────────────

    @Test
    @DisplayName("afterConnectionClosed completes without throwing")
    void afterConnectionClosed_doesNotThrow() {
        controller.afterConnectionClosed(wsSession, CloseStatus.NORMAL);
        verify(violationService, never()).saveViolation(any(), any());
    }

    @Test
    @DisplayName("Transport errors are logged without re-throwing")
    void handleTransportError_logsWithoutThrowing() {
        controller.handleTransportError(wsSession, new RuntimeException("Network error"));
    }

    @Test
    @DisplayName("supportsPartialMessages returns false")
    void supportsPartialMessages_returnsFalse() {
        assert !controller.supportsPartialMessages();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private FramePayload buildPayload(String sessionId, String frameBase64) {
        FramePayload p = new FramePayload();
        p.setSessionId(sessionId);
        p.setFrameBase64(frameBase64);
        p.setTimestamp(System.currentTimeMillis());
        return p;
    }
}
