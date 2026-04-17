package com.college.admission.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatMessageRequest {
    private Long receiverId;

    @NotBlank(message = "Message content is required")
    private String content;

    private boolean broadcast;
}
