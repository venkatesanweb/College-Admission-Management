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
public class SlotBookingResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private LocalDateTime appointmentTime;
    private LocalDateTime bookedAt;
}
