package com.nirikshak.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nirikshak.dto.AlertDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Maintains a registry of active WebSocket sessions and broadcasts AlertDTOs.
 * Thread-safe: sessions map is ConcurrentHashMap.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketBroadcaster {

    private final ObjectMapper objectMapper;

    /**
     * sessionId (exam session UUID) → WebSocket connection
     */
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public void register(String examSessionId, WebSocketSession wsSession) {
        sessions.put(examSessionId, wsSession);
        log.info("WS registered: examSessionId={} wsSessionId={}", examSessionId, wsSession.getId());
    }

    public void deregister(String examSessionId) {
        sessions.remove(examSessionId);
        log.info("WS deregistered: examSessionId={}", examSessionId);
    }

    public void broadcast(String examSessionId, AlertDTO alert) {
        WebSocketSession session = sessions.get(examSessionId);
        if (session == null || !session.isOpen()) {
            log.debug("No open WS session for examSessionId={}", examSessionId);
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(alert);
            synchronized (session) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException e) {
            log.error("Failed to send WS message: {}", e.getMessage());
        }
    }
}
