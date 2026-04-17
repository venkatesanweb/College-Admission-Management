package com.college.admission.controller;

import com.college.admission.dto.request.ChatMessageRequest;
import com.college.admission.dto.response.ApiResponse;
import com.college.admission.dto.response.ChatMessageResponse;
import com.college.admission.entity.User;
import com.college.admission.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/api/chat/send")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Valid @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal User user) {
        ChatMessageResponse response = chatService.sendMessage(request, user);
        return ResponseEntity.ok(ApiResponse.success("Message sent", response));
    }

    @GetMapping("/api/chat/conversation/{otherUserId}")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getConversation(
            @PathVariable Long otherUserId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getConversation(user.getId(), otherUserId)));
    }

    @GetMapping("/api/chat/broadcasts")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getBroadcasts() {
        return ResponseEntity.ok(ApiResponse.success(chatService.getBroadcasts()));
    }

    @GetMapping("/api/chat/unread")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getUnread(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getUnreadMessages(user.getId())));
    }

    @GetMapping("/api/chat/contacts")
    public ResponseEntity<ApiResponse<List<User>>> getContacts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getDepartmentContacts(user)));
    }

    @PatchMapping("/api/chat/{messageId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long messageId) {
        chatService.markAsRead(messageId);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read", null));
    }

    // WebSocket endpoint
    @MessageMapping("/chat.send")
    public void handleWebSocketMessage(@Payload ChatMessageRequest request, @AuthenticationPrincipal User user) {
        if (user != null) {
            chatService.sendMessage(request, user);
        }
    }
}
