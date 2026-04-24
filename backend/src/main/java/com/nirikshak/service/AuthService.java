package com.nirikshak.service;

import com.nirikshak.dto.AuthResponse;
import com.nirikshak.dto.LoginRequest;
import com.nirikshak.dto.RegisterRequest;
import com.nirikshak.model.Student;
import com.nirikshak.repository.StudentRepository;
import com.nirikshak.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final StudentRepository studentRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        Student student = studentRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), student.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(
            student.getEmail(),
            student.getId().toString(),
            student.getRole()
        );

        log.info("Student logged in: {}", student.getEmail());
        return AuthResponse.builder()
            .token(token)
            .studentId(student.getId().toString())
            .name(student.getName())
            .email(student.getEmail())
            .build();
    }

    public AuthResponse register(RegisterRequest request) {
        if (studentRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        Student student = Student.builder()
            .name(request.getName())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .role("STUDENT")
            .build();

        student = studentRepository.save(student);

        String token = jwtUtil.generateToken(
            student.getEmail(),
            student.getId().toString(),
            student.getRole()
        );

        log.info("New student registered: {}", student.getEmail());
        return AuthResponse.builder()
            .token(token)
            .studentId(student.getId().toString())
            .name(student.getName())
            .email(student.getEmail())
            .build();
    }
}
