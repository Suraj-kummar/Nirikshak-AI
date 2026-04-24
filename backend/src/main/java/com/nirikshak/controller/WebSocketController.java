package com.nirikshak.controller;

import com.nirikshak.dto.AlertDTO;
import com.nirikshak.dto.FramePayload;
import com.nirikshak.security.JwtUtil;
import com.nirikshak.service.AIVisionService;
import com.nirikshak.service.ExamSessionService;
import com.nirikshak.service.ViolationService;
import com.nirikshak.service.WebSocketBroadcaster;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.UUID;

/**
 * WebSocket handler for /ws/exam
 *
 * Security model (post-handshake auth):
 *   1. All WS connections are accepted at handshake time (no token in URL —
 *      URL params appear in server access logs and browser network inspector).
 *   2. Client MUST send an AUTH frame as the VERY FIRST message:
 *        { "type": "AUTH", "token": "<jwt>" }
 *      The handler validates the JWT, stores studentId in session attributes,
 *      and replies with { "type": "AUTH_ACK", "status": "OK" }.
 *   3. Any subsequent message is treated as a frame payload and follows
 *      the normal proctoring pipeline only if the session is authenticated.
 *   4. JWT is re-validated on every frame message (token expiry check).
 *
 * Frame pipeline (post-auth):
 *   1. Parse FramePayload JSON
 *   2. Re-validate JWT — close session on expiry
 *   3. Validate exam session is ACTIVE
 *   4. Forward base64 frame to Python AI Vision service
 *   5. Persist violation if alertType != CLEAR
 *   6. Broadcast AlertDTO back to React client
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketController extends TextWebSocketHandler {

    private static final String ATTR_AUTHENTICATED = "authenticated";
    private static final String ATTR_TOKEN         = "token";
    private static final String ATTR_STUDENT_ID    = "studentId";

    private final JwtUtil             jwtUtil;
    private final AIVisionService     aiVisionService;
    private final ViolationService    violationService;
    private final ExamSessionService  sessionService;
    private final WebSocketBroadcaster broadcaster;
    private final ObjectMapper        objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WS connection accepted (unauthenticated): wsId={}", session.getId());
        // No studentId yet — must arrive via AUTH message
    }

    @Override
    protected void handleTextMessage(WebSocketSession wsSession, TextMessage message) {
        try {
            JsonNode root = objectMapper.readTree(message.getPayload());
            String msgType = root.path("type").asText("");

            // ── AUTH handshake ──────────────────────────────────────────────
            if ("AUTH".equalsIgnoreCase(msgType)) {
                handleAuthMessage(wsSession, root);
                return;
            }

            // ── Guard: reject un-authed frames silently ─────────────────────
            Boolean authenticated = (Boolean) wsSession.getAttributes().get(ATTR_AUTHENTICATED);
            if (!Boolean.TRUE.equals(authenticated)) {
                log.warn("Frame received before AUTH on wsId={} — dropping", wsSession.getId());
                return;
            }

            // ── Re-validate token on every frame (expiry check) ────────────
            String token = (String) wsSession.getAttributes().get(ATTR_TOKEN);
            if (token == null || !jwtUtil.isValid(token)) {
                log.warn("JWT expired or invalid on wsId={} — closing", wsSession.getId());
                wsSession.close(CloseStatus.POLICY_VIOLATION);
                return;
            }

            // ── Parse frame payload ─────────────────────────────────────────
            FramePayload payload = objectMapper.treeToValue(root, FramePayload.class);

            // ── Validate exam session is still ACTIVE ───────────────────────
            UUID sessionId = UUID.fromString(payload.getSessionId());
            sessionService.validateActiveSession(sessionId);

            // ── Forward frame to Python AI (non-blocking Mono) ──────────────
            aiVisionService.analyzeFrame(payload.getFrameBase64())
                .subscribe(alert -> {
                    try {
                        alert.setTimestamp(System.currentTimeMillis());

                        // ── Persist violation if not CLEAR ──────────────────
                        if (!"CLEAR".equals(alert.getAlertType())) {
                            violationService.saveViolation(sessionId, alert);
                        }

                        // ── Broadcast alert to React client ─────────────────
                        broadcaster.broadcast(sessionId.toString(), alert);

                    } catch (Exception e) {
                        log.error("Error processing AI alert: {}", e.getMessage(), e);
                    }
                }, err -> log.error("AI vision Mono error: {}", err.getMessage()));

        } catch (IllegalArgumentException e) {
            log.warn("WS frame rejected: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected WS error: {}", e.getMessage(), e);
        }
    }


    /**
     * Handles the AUTH handshake message.
     * Expected: { "type": "AUTH", "token": "<jwt>" }
     * Reply:    { "type": "AUTH_ACK", "status": "OK" }  on success
     *           { "type": "AUTH_ACK", "status": "FAIL" } and close on failure
     */
    private void handleAuthMessage(WebSocketSession wsSession, JsonNode root) throws Exception {
        String token = root.path("token").asText(null);

        if (token == null || !jwtUtil.isValid(token)) {
            log.warn("WS AUTH failed on wsId={} — invalid or missing token", wsSession.getId());
            wsSession.sendMessage(new TextMessage(
                objectMapper.writeValueAsString(Map.of("type", "AUTH_ACK", "status", "FAIL"))
            ));
            wsSession.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        String studentId = jwtUtil.extractStudentId(token);
        wsSession.getAttributes().put(ATTR_AUTHENTICATED, true);
        wsSession.getAttributes().put(ATTR_TOKEN, token);
        wsSession.getAttributes().put(ATTR_STUDENT_ID, studentId);

        log.info("WS AUTH success: wsId={} studentId={}", wsSession.getId(), studentId);
        wsSession.sendMessage(new TextMessage(
            objectMapper.writeValueAsString(Map.of("type", "AUTH_ACK", "status", "OK"))
        ));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WS connection closed: wsId={} status={}", session.getId(), status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WS transport error on wsId={}: {}", session.getId(), exception.getMessage());
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
}
