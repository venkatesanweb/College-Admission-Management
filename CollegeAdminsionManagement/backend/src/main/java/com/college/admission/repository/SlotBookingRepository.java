package com.college.admission.repository;

import com.college.admission.entity.SlotBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SlotBookingRepository extends JpaRepository<SlotBooking, Long> {
    List<SlotBooking> findByStudentId(Long studentId);
    List<SlotBooking> findBySlotId(Long slotId);
    Optional<SlotBooking> findBySlotIdAndStudentId(Long slotId, Long studentId);
    boolean existsBySlotIdAndStudentId(Long slotId, Long studentId);
    boolean existsBySlotIdAndAppointmentTime(Long slotId, LocalDateTime appointmentTime);
}
