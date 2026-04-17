package com.college.admission.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CourseResponse {
    private Long id;
    private String name;
    private String collegeName;
    private String description;
    private Integer totalSeats;
    private Integer availableSeats;
    private String duration;
    private Double fees;
    private String department;
    private LocalDateTime createdAt;
}
