package com.college.admission.repository;

import com.college.admission.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.sentAt ASC")
    List<ChatMessage> findConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    List<ChatMessage> findByBroadcastTrueOrderBySentAtDesc();

    @Query("SELECT m FROM ChatMessage m WHERE m.receiver.id = :userId AND m.read = false")
    List<ChatMessage> findUnreadMessages(@Param("userId") Long userId);

    @Query("SELECT DISTINCT m.sender.id FROM ChatMessage m WHERE m.receiver.id = :userId")
    List<Long> findSenders(@Param("userId") Long userId);

    @Query("SELECT DISTINCT m.receiver.id FROM ChatMessage m WHERE m.sender.id = :userId AND m.receiver IS NOT NULL")
    List<Long> findReceivers(@Param("userId") Long userId);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteBySenderId(Long senderId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByReceiverId(Long receiverId);
}
