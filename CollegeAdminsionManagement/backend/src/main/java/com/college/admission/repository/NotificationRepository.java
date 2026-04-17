package com.college.admission.repository;

import com.college.admission.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndReadFalse(Long userId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByUserId(Long userId);
}
