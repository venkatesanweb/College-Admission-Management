package com.college.admission.service;

import com.college.admission.dto.request.CourseRequest;
import com.college.admission.dto.response.CourseResponse;
import com.college.admission.entity.Course;
import com.college.admission.exception.BadRequestException;
import com.college.admission.exception.ResourceNotFoundException;
import com.college.admission.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseResponse createCourse(CourseRequest request) {
        if (courseRepository.existsByName(request.getName())) {
            throw new BadRequestException("Course with name '" + request.getName() + "' already exists");
        }

        Course course = Course.builder()
                .name(request.getName())
                .collegeName(request.getCollegeName())
                .description(request.getDescription())
                .totalSeats(request.getTotalSeats())
                .availableSeats(request.getTotalSeats())
                .duration(request.getDuration())
                .fees(request.getFees())
                .department(request.getDepartment())
                .build();

        course = courseRepository.save(course);
        return mapToResponse(course);
    }

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
        return mapToResponse(course);
    }

    public CourseResponse updateCourse(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        int seatDifference = request.getTotalSeats() - course.getTotalSeats();

        course.setName(request.getName());
        course.setCollegeName(request.getCollegeName());
        course.setDescription(request.getDescription());
        course.setTotalSeats(request.getTotalSeats());
        course.setAvailableSeats(course.getAvailableSeats() + seatDifference);
        course.setDuration(request.getDuration());
        course.setFees(request.getFees());
        course.setDepartment(request.getDepartment());

        if (course.getAvailableSeats() < 0) {
            throw new BadRequestException("Cannot reduce seats below currently occupied count");
        }

        course = courseRepository.save(course);
        return mapToResponse(course);
    }

    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course", "id", id);
        }
        courseRepository.deleteById(id);
    }

    private CourseResponse mapToResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .collegeName(course.getCollegeName())
                .description(course.getDescription())
                .totalSeats(course.getTotalSeats())
                .availableSeats(course.getAvailableSeats())
                .duration(course.getDuration())
                .fees(course.getFees())
                .department(course.getDepartment())
                .createdAt(course.getCreatedAt())
                .build();
    }
}
