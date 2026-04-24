package com.nirikshak.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        // Secret must be >= 32 chars (256 bits)
        jwtUtil = new JwtUtil("nirikshak_test_secret_32chars_min!!", 28800000L);
    }

    @Test
    @DisplayName("generateToken returns a non-blank JWT")
    void generateToken_returnsNonBlankJwt() {
        String token = jwtUtil.generateToken("test@example.com", "uuid-123", "STUDENT");
        assertThat(token).isNotBlank();
        // JWT has 3 parts separated by dots
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("extractEmail returns correct subject")
    void extractEmail_returnsCorrectSubject() {
        String token = jwtUtil.generateToken("student@nirikshak.ai", "uuid-456", "STUDENT");
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("student@nirikshak.ai");
    }

    @Test
    @DisplayName("extractStudentId returns correct claim")
    void extractStudentId_returnsCorrectClaim() {
        String token = jwtUtil.generateToken("a@b.com", "student-uuid-789", "STUDENT");
        assertThat(jwtUtil.extractStudentId(token)).isEqualTo("student-uuid-789");
    }

    @Test
    @DisplayName("isValid returns true for a freshly generated token")
    void isValid_trueForFreshToken() {
        String token = jwtUtil.generateToken("x@y.com", "id-1", "STUDENT");
        assertThat(jwtUtil.isValid(token)).isTrue();
    }

    @Test
    @DisplayName("isValid returns false for a tampered token")
    void isValid_falseForTamperedToken() {
        String token = jwtUtil.generateToken("x@y.com", "id-1", "STUDENT");
        // Corrupt the signature part
        String tampered = token.substring(0, token.length() - 4) + "XXXX";
        assertThat(jwtUtil.isValid(tampered)).isFalse();
    }

    @Test
    @DisplayName("isValid returns false for blank string")
    void isValid_falseForBlankString() {
        assertThat(jwtUtil.isValid("")).isFalse();
    }

    @Test
    @DisplayName("isValid returns false for random garbage")
    void isValid_falseForGarbage() {
        assertThat(jwtUtil.isValid("not.a.jwt")).isFalse();
    }

    @Test
    @DisplayName("Short secret (< 32 chars) throws IllegalArgumentException")
    void constructor_throwsOnShortSecret() {
        assertThatThrownBy(() -> new JwtUtil("tooshort", 3600000L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("256 bits");
    }

    @Test
    @DisplayName("Expired token is invalid")
    void expiredToken_isInvalid() throws InterruptedException {
        JwtUtil shortLived = new JwtUtil("nirikshak_test_secret_32chars_min!!", 1L); // 1ms expiry
        String token = shortLived.generateToken("a@b.com", "id", "STUDENT");
        Thread.sleep(50);
        assertThat(shortLived.isValid(token)).isFalse();
    }
}
