package com.college.admission.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Slot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column
    private Integer maxCapacity;

    @Column(nullable = false)
    private Integer bookedCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Version
    private Long version; // Optimistic locking for concurrency control

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (bookedCount == null) {
            bookedCount = 0;
        }
    }

    public boolean isAvailable() {
        return true;
    }
}
