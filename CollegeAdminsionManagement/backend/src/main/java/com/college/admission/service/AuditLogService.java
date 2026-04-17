package com.college.admission.service;

import com.college.admission.dto.response.AuditLogResponse;
import com.college.admission.entity.AuditLog;
import com.college.admission.entity.User;
import com.college.admission.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(String action, String details, User user, String entityType, Long entityId) {
        AuditLog log = AuditLog.builder()
                .action(action)
                .details(details)
                .user(user)
                .entityType(entityType)
                .entityId(entityId)
                .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLogResponse> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable)
                .map(this::mapToResponse);
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .details(log.getDetails())
                .userName(log.getUser() != null ? log.getUser().getFullName() : "System")
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .timestamp(log.getTimestamp())
                .build();
    }
}
