package com.nirikshak.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtUtil(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiration}") long expirationMs
    ) {
        // Ensure key is at least 256 bits
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT secret must be ≥ 32 characters (256 bits)");
        }
        this.secretKey   = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    /** Generate a JWT token for the given email/subject. */
    public String generateToken(String email, String studentId, String role) {
        return Jwts.builder()
            .subject(email)
            .claim("studentId", studentId)
            .claim("role", role)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(secretKey, Jwts.SIG.HS256)
            .compact();
    }

    /** Extract email (subject) from token. */
    public String extractEmail(String token) {
        return parseClaims(token).getPayload().getSubject();
    }

    /** Extract studentId claim. */
    public String extractStudentId(String token) {
        return parseClaims(token).getPayload().get("studentId", String.class);
    }

    /** Validate token signature and expiry. Returns false (not throws) on invalid. */
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    private Jws<Claims> parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token);
    }
}
