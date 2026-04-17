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
public class AuditLogResponse {
    private Long id;
    private String action;
    private String details;
    private String userName;
    private Long userId;
    private String entityType;
    private Long entityId;
    private LocalDateTime timestamp;
}
