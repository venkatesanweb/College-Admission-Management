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
public class DocumentResponse {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private LocalDateTime uploadedAt;
}
