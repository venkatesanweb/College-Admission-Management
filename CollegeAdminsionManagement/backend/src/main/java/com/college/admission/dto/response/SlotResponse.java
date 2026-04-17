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
public class SlotResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxCapacity;
    private Integer bookedCount;
    private boolean available;
    private String courseName;
    private Long courseId;
    private boolean bookedByCurrentUser;
    private LocalDateTime appointmentTime;
    private Integer slotActionAttempts;
    private java.util.List<LocalDateTime> bookedTimes;
}
