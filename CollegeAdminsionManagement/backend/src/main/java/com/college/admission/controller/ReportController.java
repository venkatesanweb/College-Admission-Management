package com.college.admission.controller;

import com.college.admission.dto.response.ApiResponse;
import com.college.admission.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/per-course")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getApplicationsPerCourse() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getApplicationsPerCourse()));
    }

    @GetMapping("/status-distribution")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatusDistribution() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getStatusDistribution()));
    }

    @GetMapping("/daily-trends")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDailyTrends(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDailyTrends(start, end)));
    }

    @GetMapping("/monthly-trends")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMonthlyTrends() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getMonthlyTrends()));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getSummaryStats()));
    }

    @GetMapping("/course-breakdown")
    public ResponseEntity<ApiResponse<Map<String, Map<String, Long>>>> getCourseBreakdown() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getCourseStatusBreakdown()));
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv() throws Exception {
        byte[] data = reportService.generateCsvReport();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=admission_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf() throws Exception {
        byte[] data = reportService.generatePdfReport();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=admission_report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
