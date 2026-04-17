package com.college.admission.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String collegeName;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Integer totalSeats;

    @Column(nullable = false)
    private Integer availableSeats;

    private String duration;

    private Double fees;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    private String department;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<Application> applications = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (availableSeats == null) {
            availableSeats = totalSeats;
        }
    }
}
