package com.nirikshak.config;

import com.nirikshak.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final com.nirikshak.controller.WebSocketController webSocketController;
    private final JwtUtil jwtUtil;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketController, "/ws/exam")
            .addInterceptors(openHandshakeInterceptor())
            .setAllowedOriginPatterns("*");
    }

    /**
     * Security model: JWT is NOT passed in the URL query-param (those are
     * visible in server access logs and browser network inspector).
     *
     * Instead we allow all WS handshakes but the connection is treated as
     * UNAUTHENTICATED. The first message the client must send is:
     *   { "type": "AUTH", "token": "<jwt>" }
     *
     * The WebSocketController validates the token on that first message and
     * stores studentId in the session attributes. Any frame received before
     * the AUTH ack is silently dropped.
     */
    private HandshakeInterceptor openHandshakeInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(
                ServerHttpRequest request,
                ServerHttpResponse response,
                WebSocketHandler wsHandler,
                Map<String, Object> attributes
            ) {
                // Mark as unauthenticated — real auth happens on first message
                attributes.put("authenticated", false);
                log.debug("WebSocket handshake accepted — awaiting AUTH message");
                return true;
            }

            @Override
            public void afterHandshake(ServerHttpRequest req, ServerHttpResponse res,
                                       WebSocketHandler handler, Exception ex) {}
        };
    }
}
