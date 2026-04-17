package com.college.admission.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "slot_bookings", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"slot_id", "student_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    private Slot slot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "booked_at")
    private LocalDateTime bookedAt;

    @Column(name = "appointment_time")
    private LocalDateTime appointmentTime;

    @PrePersist
    protected void onCreate() {
        bookedAt = LocalDateTime.now();
    }
}
