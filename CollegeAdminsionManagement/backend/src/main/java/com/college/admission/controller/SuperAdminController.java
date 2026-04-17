package com.college.admission.controller;

import com.college.admission.dto.request.CourseRequest;
import com.college.admission.dto.response.ApiResponse;
import com.college.admission.dto.response.AuditLogResponse;
import com.college.admission.dto.response.CourseResponse;
import com.college.admission.entity.User;
import com.college.admission.exception.ResourceNotFoundException;
import com.college.admission.repository.UserRepository;
import com.college.admission.service.AuditLogService;
import com.college.admission.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final CourseService courseService;
    private final com.college.admission.repository.ChatMessageRepository chatMessageRepository;
    private final com.college.admission.repository.AuditLogRepository auditLogRepository;
    private final com.college.admission.repository.NotificationRepository notificationRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.college.admission.service.OtpService otpService;

    @PostMapping("/users/admin")
    public ResponseEntity<ApiResponse<User>> addAdmin(@RequestBody com.college.admission.dto.request.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new com.college.admission.exception.BadRequestException("Email already registered");
        }
        if (!otpService.validateOtp(request.getEmail(), request.getOtp())) {
            throw new com.college.admission.exception.BadRequestException("Invalid or expired OTP");
        }
        User admin = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(com.college.admission.enums.Role.ADMIN)
                .blocked(false)
                .department(request.getDepartment())
                .build();
        userRepository.save(admin);
        return ResponseEntity.ok(ApiResponse.success("Admin created successfully", admin));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AuditLogResponse> logs = auditLogService.getAllLogs(
                PageRequest.of(page, size, Sort.by("timestamp").descending()));
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @PatchMapping("/users/{userId}/block")
    public ResponseEntity<ApiResponse<Void>> blockUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setBlocked(true);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("User blocked", null));
    }

    @PatchMapping("/users/{userId}/unblock")
    public ResponseEntity<ApiResponse<Void>> unblockUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setBlocked(false);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("User unblocked", null));
    }

    @DeleteMapping("/users/{userId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        chatMessageRepository.deleteBySenderId(userId);
        chatMessageRepository.deleteByReceiverId(userId);
        auditLogRepository.deleteByUserId(userId);
        notificationRepository.deleteByUserId(userId);
        
        userRepository.deleteById(userId);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userRepository.findAll()));
    }

    // ==================== Course Management (Super Admin Only) ====================

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAllCourses() {
        return ResponseEntity.ok(ApiResponse.success(courseService.getAllCourses()));
    }

    @PostMapping("/courses")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(@Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Course created", courseService.createCourse(request)));
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Long id, @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Course updated", courseService.updateCourse(id, request)));
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course deleted", null));
    }
}
