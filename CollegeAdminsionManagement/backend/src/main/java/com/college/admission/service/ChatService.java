package com.college.admission.service;

import com.college.admission.dto.request.ChatMessageRequest;
import com.college.admission.dto.response.ChatMessageResponse;
import com.college.admission.entity.ChatMessage;
import com.college.admission.entity.User;
import com.college.admission.exception.ResourceNotFoundException;
import com.college.admission.repository.ChatMessageRepository;
import com.college.admission.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatMessageResponse sendMessage(ChatMessageRequest request, User sender) {
        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .content(request.getContent())
                .broadcast(request.isBroadcast())
                .read(false)
                .build();

        if (!request.isBroadcast()) {
            User receiver = userRepository.findById(request.getReceiverId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getReceiverId()));
                    
            if (sender.getRole() == com.college.admission.enums.Role.STUDENT && receiver.getRole() == com.college.admission.enums.Role.SUPER_ADMIN) {
                throw new IllegalStateException("Students cannot message Super Admins directly. This is a broadcast channel only.");
            }
            
            message.setReceiver(receiver);
        }

        message = chatMessageRepository.save(message);
        ChatMessageResponse response = mapToResponse(message);

        if (request.isBroadcast()) {
            messagingTemplate.convertAndSend("/topic/broadcast", response);
        } else {
            messagingTemplate.convertAndSend("/topic/user/" + request.getReceiverId() + "/messages", response);
        }

        return response;
    }

    public List<ChatMessageResponse> getConversation(Long userId1, Long userId2) {
        return chatMessageRepository.findConversation(userId1, userId2).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ChatMessageResponse> getBroadcasts() {
        return chatMessageRepository.findByBroadcastTrueOrderBySentAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ChatMessageResponse> getUnreadMessages(Long userId) {
        return chatMessageRepository.findUnreadMessages(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void markAsRead(Long messageId) {
        chatMessageRepository.findById(messageId).ifPresent(m -> {
            m.setRead(true);
            chatMessageRepository.save(m);
        });
    }

    public List<User> getChatPartners(Long userId) {
        java.util.Set<Long> partnerIds = new java.util.HashSet<>();
        partnerIds.addAll(chatMessageRepository.findSenders(userId));
        partnerIds.addAll(chatMessageRepository.findReceivers(userId));
        return partnerIds.isEmpty() ? java.util.List.of() : userRepository.findAllById(partnerIds);
    }

    public List<User> getDepartmentContacts(User currentUser) {
        java.util.Set<User> contacts = new java.util.HashSet<>(getChatPartners(currentUser.getId()));
        
        if (currentUser.getRole() == com.college.admission.enums.Role.SUPER_ADMIN || 
            currentUser.getRole() == com.college.admission.enums.Role.ADMIN) {
            // Admins and Super Admins can see everyone (including all registered students)
            contacts.addAll(userRepository.findAll());
        } else if (currentUser.getRole() == com.college.admission.enums.Role.STUDENT) {
            // Students can see Admins
            contacts.addAll(userRepository.findByRole(com.college.admission.enums.Role.ADMIN));
        }
        
        contacts.removeIf(u -> u.getId().equals(currentUser.getId()));
        return new java.util.ArrayList<>(contacts);
    }

    private ChatMessageResponse mapToResponse(ChatMessage msg) {
        return ChatMessageResponse.builder()
                .id(msg.getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getFullName())
                .receiverId(msg.getReceiver() != null ? msg.getReceiver().getId() : null)
                .receiverName(msg.getReceiver() != null ? msg.getReceiver().getFullName() : null)
                .content(msg.getContent())
                .broadcast(msg.isBroadcast())
                .read(msg.isRead())
                .sentAt(msg.getSentAt())
                .build();
    }
}
