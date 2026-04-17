package com.college.admission.controller;

import com.college.admission.dto.response.ApiResponse;
import com.college.admission.dto.response.CourseResponse;
import com.college.admission.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAllCourses() {
        return ResponseEntity.ok(ApiResponse.success(courseService.getAllCourses()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(courseService.getCourseById(id)));
    }
}
