package com.college.admission.controller;

import com.college.admission.dto.request.LoginRequest;
import com.college.admission.dto.request.OtpRequest;
import com.college.admission.dto.request.RegisterRequest;
import com.college.admission.dto.response.ApiResponse;
import com.college.admission.dto.response.AuthResponse;
import com.college.admission.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody OtpRequest request) {
        authService.sendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully to " + request.getEmail(), null));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}
