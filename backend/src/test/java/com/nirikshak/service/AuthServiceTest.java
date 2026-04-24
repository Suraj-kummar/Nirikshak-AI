package com.nirikshak.service;

import com.nirikshak.dto.AuthResponse;
import com.nirikshak.dto.LoginRequest;
import com.nirikshak.dto.RegisterRequest;
import com.nirikshak.model.Student;
import com.nirikshak.repository.StudentRepository;
import com.nirikshak.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock  StudentRepository studentRepository;
    @Mock  JwtUtil           jwtUtil;
    @Spy   PasswordEncoder   passwordEncoder = new BCryptPasswordEncoder();

    @InjectMocks AuthService authService;

    private Student demoStudent;
    private final String RAW_PASSWORD = "demo1234";

    @BeforeEach
    void setUp() {
        demoStudent = Student.builder()
            .id(UUID.randomUUID())
            .name("Demo Student")
            .email("demo@nirikshak.ai")
            .passwordHash(new BCryptPasswordEncoder().encode(RAW_PASSWORD))
            .role("STUDENT")
            .build();
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login with valid credentials returns AuthResponse with token")
    void login_validCredentials_returnsToken() {
        when(studentRepository.findByEmail("demo@nirikshak.ai")).thenReturn(Optional.of(demoStudent));
        when(jwtUtil.generateToken(any(), any(), any())).thenReturn("mock-jwt-token");

        LoginRequest req = new LoginRequest();
        req.setEmail("demo@nirikshak.ai");
        req.setPassword(RAW_PASSWORD);

        AuthResponse response = authService.login(req);

        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        assertThat(response.getEmail()).isEqualTo("demo@nirikshak.ai");
        assertThat(response.getName()).isEqualTo("Demo Student");
        verify(jwtUtil).generateToken(eq("demo@nirikshak.ai"), any(), eq("STUDENT"));
    }

    @Test
    @DisplayName("login with unknown email throws IllegalArgumentException")
    void login_unknownEmail_throws() {
        when(studentRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        LoginRequest req = new LoginRequest();
        req.setEmail("unknown@test.com");
        req.setPassword("whatever");

        assertThatThrownBy(() -> authService.login(req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("login with wrong password throws IllegalArgumentException")
    void login_wrongPassword_throws() {
        when(studentRepository.findByEmail("demo@nirikshak.ai")).thenReturn(Optional.of(demoStudent));

        LoginRequest req = new LoginRequest();
        req.setEmail("demo@nirikshak.ai");
        req.setPassword("wrongpassword");

        assertThatThrownBy(() -> authService.login(req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid email or password");
    }

    // ── Register ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("register new student saves and returns token")
    void register_newStudent_savesAndReturnsToken() {
        when(studentRepository.existsByEmail("new@nirikshak.ai")).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenReturn(demoStudent);
        when(jwtUtil.generateToken(any(), any(), any())).thenReturn("new-jwt-token");

        RegisterRequest req = new RegisterRequest();
        req.setName("New Student");
        req.setEmail("new@nirikshak.ai");
        req.setPassword("secure123");

        AuthResponse response = authService.register(req);

        assertThat(response.getToken()).isEqualTo("new-jwt-token");
        verify(studentRepository).save(any(Student.class));
    }

    @Test
    @DisplayName("register with duplicate email throws IllegalArgumentException")
    void register_duplicateEmail_throws() {
        when(studentRepository.existsByEmail("demo@nirikshak.ai")).thenReturn(true);

        RegisterRequest req = new RegisterRequest();
        req.setName("Duplicate");
        req.setEmail("demo@nirikshak.ai");
        req.setPassword("pass1234");

        assertThatThrownBy(() -> authService.register(req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already registered");

        verify(studentRepository, never()).save(any());
    }
}
