package com.college.admission.repository;

import com.college.admission.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    List<AuditLog> findByUserId(Long userId);
    List<AuditLog> findByAction(String action);
    List<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    @org.springframework.transaction.annotation.Transactional
    void deleteByUserId(Long userId);
}
