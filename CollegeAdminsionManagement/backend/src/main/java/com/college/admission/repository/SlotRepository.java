package com.college.admission.repository;

import com.college.admission.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SlotRepository extends JpaRepository<Slot, Long> {
    List<Slot> findByEndTimeAfterOrderByStartTimeAsc(LocalDateTime time);
    List<Slot> findByCourseId(Long courseId);
}
