package com.college.admission.controller;

import com.college.admission.dto.request.ApplicationRequest;
import com.college.admission.dto.request.SlotRequest;
import com.college.admission.dto.response.*;
import com.college.admission.entity.User;
import com.college.admission.enums.ApplicationStatus;
import com.college.admission.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ApplicationService applicationService;
    private final CourseService courseService;
    private final SlotService slotService;

    // ==================== Application Management ====================

    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<Page<ApplicationResponse>>> getAllApplications(
            @RequestParam(required = false) String studentName,
            @RequestParam(required = false) Double minMarks,
            @RequestParam(required = false) Double maxMarks,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String collegeName,
            @RequestParam(required = false) String admissionCategory,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "submittedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<ApplicationResponse> applications = applicationService.getFilteredApplications(
                studentName, minMarks, maxMarks, courseId, status, startDate, endDate, search, collegeName, admissionCategory,
                PageRequest.of(page, size, sort));

        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getApplication(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getApplicationById(id)));
    }

    @PutMapping("/applications/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationRequest request,
            @AuthenticationPrincipal User admin) {
        ApplicationResponse response = applicationService.updateApplicationByAdmin(id, request, admin);
        return ResponseEntity.ok(ApiResponse.success("Application updated successfully", response));
    }

    @PatchMapping("/applications/{id}/approve")
    public ResponseEntity<ApiResponse<ApplicationResponse>> approveApplication(
            @PathVariable Long id,
            @RequestParam(required = false) String remarks,
            @AuthenticationPrincipal User admin) {
        ApplicationResponse response = applicationService.updateApplicationStatus(
                id, ApplicationStatus.ACCEPTED, remarks, admin);
        return ResponseEntity.ok(ApiResponse.success("Application approved", response));
    }

    @PatchMapping("/applications/{id}/reject")
    public ResponseEntity<ApiResponse<ApplicationResponse>> rejectApplication(
            @PathVariable Long id,
            @RequestParam(required = false) String remarks,
            @AuthenticationPrincipal User admin) {
        ApplicationResponse response = applicationService.updateApplicationStatus(
                id, ApplicationStatus.REJECTED, remarks, admin);
        return ResponseEntity.ok(ApiResponse.success("Application rejected", response));
    }

    @PatchMapping("/applications/{id}/review")
    public ResponseEntity<ApiResponse<ApplicationResponse>> markUnderReview(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        ApplicationResponse response = applicationService.updateApplicationStatus(
                id, ApplicationStatus.UNDER_REVIEW, null, admin);
        return ResponseEntity.ok(ApiResponse.success("Application marked for review", response));
    }

    // ==================== Course Management (View Only for Admin) ====================

    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<java.util.List<CourseResponse>>> getAllCoursesForAdmin() {
        return ResponseEntity.ok(ApiResponse.success(courseService.getAllCourses()));
    }

    // ==================== Slot Management ====================

    @PostMapping("/slots")
    public ResponseEntity<ApiResponse<SlotResponse>> createSlot(@Valid @RequestBody SlotRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Slot created", slotService.createSlot(request)));
    }

    @GetMapping("/slots")
    public ResponseEntity<ApiResponse<List<SlotResponse>>> getAllSlots() {
        return ResponseEntity.ok(ApiResponse.success(slotService.getAllSlots()));
    }

    @GetMapping("/slots/{id}/bookings")
    public ResponseEntity<ApiResponse<List<SlotBookingResponse>>> getSlotBookings(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(slotService.getSlotBookingsForAdmin(id)));
    }
}
