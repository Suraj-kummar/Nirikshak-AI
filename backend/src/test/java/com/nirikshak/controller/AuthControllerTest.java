package com.nirikshak.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nirikshak.dto.AuthResponse;
import com.nirikshak.dto.LoginRequest;
import com.nirikshak.dto.RegisterRequest;
import com.nirikshak.service.AuthService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(com.nirikshak.security.SecurityConfig.class)
class AuthControllerTest {

    @Autowired MockMvc     mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean AuthService          authService;
    @MockBean com.nirikshak.security.JwtUtil    jwtUtil;
    @MockBean com.nirikshak.security.JwtFilter  jwtFilter;

    private final AuthResponse MOCK_RESPONSE = AuthResponse.builder()
        .token("test-jwt-token")
        .studentId("uuid-001")
        .name("Test Student")
        .email("test@nirikshak.ai")
        .build();

    /**
     * The mock JwtFilter must pass requests through the chain;
     * otherwise the controller is never invoked and the response body is empty.
     */
    @BeforeEach
    void configureFilterPassThrough() throws Exception {
        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2))
                .doFilter(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(jwtFilter).doFilter(any(), any(), any());
    }

    @Test
    @DisplayName("POST /api/auth/login returns 200 with token")
    void login_returns200() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(MOCK_RESPONSE);

        LoginRequest req = new LoginRequest();
        req.setEmail("test@nirikshak.ai");
        req.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("test-jwt-token"))
            .andExpect(jsonPath("$.email").value("test@nirikshak.ai"))
            .andExpect(jsonPath("$.name").value("Test Student"));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 200 with token")
    void register_returns200() throws Exception {
        when(authService.register(any(RegisterRequest.class))).thenReturn(MOCK_RESPONSE);

        RegisterRequest req = new RegisterRequest();
        req.setName("New Student");
        req.setEmail("new@nirikshak.ai");
        req.setPassword("newpass123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists());
    }
}
