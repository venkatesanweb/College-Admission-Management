package com.college.admission.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action;

    @Column(length = 2000)
    private String details;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String entityType;

    private Long entityId;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
