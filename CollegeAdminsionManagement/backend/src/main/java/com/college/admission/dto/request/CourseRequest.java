package com.college.admission.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CourseRequest {
    @NotBlank(message = "Course name is required")
    private String name;

    @NotBlank(message = "College name is required")
    private String collegeName;

    private String description;

    @NotNull(message = "Total seats is required")
    @Positive(message = "Total seats must be positive")
    private Integer totalSeats;

    private String duration;
    private Double fees;
    private String department;
}
