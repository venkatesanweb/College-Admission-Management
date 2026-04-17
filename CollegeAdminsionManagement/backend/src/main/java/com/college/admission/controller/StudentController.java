package com.college.admission.controller;

import com.college.admission.dto.request.ApplicationRequest;
import com.college.admission.dto.response.ApiResponse;
import com.college.admission.dto.response.ApplicationResponse;
import com.college.admission.dto.response.DocumentResponse;
import com.college.admission.dto.response.SlotResponse;
import com.college.admission.dto.response.NotificationResponse;
import com.college.admission.entity.User;
import com.college.admission.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final ApplicationService applicationService;
    private final DocumentService documentService;
    private final SlotService slotService;
    private final NotificationService notificationService;

    // ==================== Applications ====================

    @PostMapping("/applications")
    public ResponseEntity<ApiResponse<ApplicationResponse>> createApplication(
            @Valid @RequestBody ApplicationRequest request,
            @AuthenticationPrincipal User user) {
        ApplicationResponse response = applicationService.createApplication(request, user);
        return ResponseEntity.ok(ApiResponse.success("Application submitted successfully", response));
    }

    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<Page<ApplicationResponse>>> getMyApplications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ApplicationResponse> applications = applicationService.getStudentApplications(
                user.getId(), PageRequest.of(page, size, Sort.by("submittedAt").descending()));
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
            @AuthenticationPrincipal User user) {
        ApplicationResponse response = applicationService.updateApplication(id, request, user);
        return ResponseEntity.ok(ApiResponse.success("Application updated successfully", response));
    }

    // ==================== Documents ====================

    @PostMapping("/applications/{applicationId}/documents")
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @PathVariable Long applicationId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        DocumentResponse response = documentService.uploadDocument(applicationId, file, user);
        return ResponseEntity.ok(ApiResponse.success("Document uploaded successfully", response));
    }

    @GetMapping("/applications/{applicationId}/documents")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getDocuments(@PathVariable Long applicationId) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getDocumentsByApplication(applicationId)));
    }

    // ==================== Slots ====================

    @GetMapping("/slots")
    public ResponseEntity<ApiResponse<List<SlotResponse>>> getAvailableSlots(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(slotService.getAvailableSlots(user.getId())));
    }

    @PostMapping("/slots/{slotId}/book")
    public ResponseEntity<ApiResponse<SlotResponse>> bookSlot(
            @PathVariable Long slotId,
            @RequestParam LocalDateTime appointmentTime,
            @AuthenticationPrincipal User user) {
        SlotResponse response = slotService.bookSlot(slotId, appointmentTime, user);
        return ResponseEntity.ok(ApiResponse.success("Slot booked successfully", response));
    }

    @PatchMapping("/slots/{slotId}/reschedule")
    public ResponseEntity<ApiResponse<SlotResponse>> rescheduleSlot(
            @PathVariable Long slotId,
            @RequestParam LocalDateTime newTime,
            @AuthenticationPrincipal User user) {
        SlotResponse response = slotService.rescheduleSlot(slotId, newTime, user);
        return ResponseEntity.ok(ApiResponse.success("Slot rescheduled successfully", response));
    }

    @DeleteMapping("/slots/{slotId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelSlot(
            @PathVariable Long slotId,
            @AuthenticationPrincipal User user) {
        slotService.cancelSlot(slotId, user);
        return ResponseEntity.ok(ApiResponse.success("Slot cancellation successful", null));
    }

    @GetMapping("/slots/my-bookings")
    public ResponseEntity<ApiResponse<List<SlotResponse>>> getMyBookings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(slotService.getStudentBookings(user.getId())));
    }

    // ==================== Notifications ====================

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUserNotifications(user.getId())));
    }

    @GetMapping("/notifications/unread")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnread(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadNotifications(user.getId())));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(user.getId())));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }
}
