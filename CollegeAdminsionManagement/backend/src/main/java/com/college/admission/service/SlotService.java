package com.college.admission.service;

import com.college.admission.dto.request.SlotRequest;
import com.college.admission.dto.response.SlotBookingResponse;
import com.college.admission.dto.response.SlotResponse;
import com.college.admission.entity.Course;
import com.college.admission.entity.Slot;
import com.college.admission.entity.SlotBooking;
import com.college.admission.entity.User;
import com.college.admission.exception.BadRequestException;
import com.college.admission.exception.ResourceNotFoundException;
import com.college.admission.repository.CourseRepository;
import com.college.admission.repository.SlotBookingRepository;
import com.college.admission.repository.SlotRepository;
import com.college.admission.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlotService {

    private final SlotRepository slotRepository;
    private final SlotBookingRepository slotBookingRepository;
    private final CourseRepository courseRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public SlotResponse createSlot(SlotRequest request) {
        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        Slot slot = Slot.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxCapacity(request.getMaxCapacity() != null ? request.getMaxCapacity() : 9999)
                .bookedCount(0)
                .build();

        if (request.getCourseId() != null) {
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));
            slot.setCourse(course);
        }

        slot = slotRepository.save(slot);
        return mapToResponse(slot, null);
    }

    public List<SlotResponse> getAvailableSlots(Long userId) {
        return slotRepository.findByEndTimeAfterOrderByStartTimeAsc(LocalDateTime.now()).stream()
                .map(slot -> mapToResponse(slot, userId))
                .collect(Collectors.toList());
    }

    public List<SlotResponse> getAllSlots() {
        return slotRepository.findAll().stream()
                .map(slot -> mapToResponse(slot, null))
                .collect(Collectors.toList());
    }

    @Transactional
    public SlotResponse bookSlot(Long slotId, LocalDateTime appointmentTime, User student) {
        validateAppointmentTime(slotId, appointmentTime);

        try {
            Slot slot = slotRepository.findById(slotId)
                    .orElseThrow(() -> new ResourceNotFoundException("Slot", "id", slotId));

            if (slotBookingRepository.existsBySlotIdAndStudentId(slotId, student.getId())) {
                throw new BadRequestException("You have already booked a time in this slot");
            }



            slot.setBookedCount(slot.getBookedCount() + 1);
            slotRepository.save(slot);

            SlotBooking booking = SlotBooking.builder()
                    .slot(slot)
                    .student(student)
                    .appointmentTime(appointmentTime)
                    .build();
            slotBookingRepository.save(booking);

            notificationService.createNotification(student, "Slot Booked",
                    "You have successfully booked your verification for " + appointmentTime.toString().replace("T", " ") + " in slot: " + slot.getTitle(), "SLOT");

            return mapToResponse(slot, student.getId());

        } catch (ObjectOptimisticLockingFailureException e) {
            throw new BadRequestException("Slot booking conflict. Please try again.");
        }
    }

    @Transactional
    public SlotResponse rescheduleSlot(Long slotId, LocalDateTime newTime, User studentPrincipal) {
        User student = userRepository.findById(studentPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentPrincipal.getId()));

        int attempts = student.getSlotActionAttempts() != null ? student.getSlotActionAttempts() : 0;
        if (attempts >= 3) {
            throw new BadRequestException("You have exhausted your 3 attempts for rescheduling/cancellation");
        }

        validateAppointmentTime(slotId, newTime);

        SlotBooking booking = slotBookingRepository.findBySlotIdAndStudentId(slotId, student.getId())
                .orElseThrow(() -> new BadRequestException("No existing booking found for this slot"));



        booking.setAppointmentTime(newTime);
        slotBookingRepository.save(booking);

        student.setSlotActionAttempts(attempts + 1);
        userRepository.save(student);

        notificationService.createNotification(student, "Slot Rescheduled",
                "Your verification has been rescheduled to " + newTime.toString().replace("T", " "), "SLOT");

        return mapToResponse(booking.getSlot(), student.getId());
    }

    @Transactional
    public void cancelSlot(Long slotId, User studentPrincipal) {
        User student = userRepository.findById(studentPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentPrincipal.getId()));

        int attempts = student.getSlotActionAttempts() != null ? student.getSlotActionAttempts() : 0;
        if (attempts >= 3) {
            throw new BadRequestException("You have exhausted your 3 attempts for rescheduling/cancellation");
        }

        SlotBooking booking = slotBookingRepository.findBySlotIdAndStudentId(slotId, student.getId())
                .orElseThrow(() -> new BadRequestException("No existing booking found for this slot"));

        Slot slot = booking.getSlot();
        slot.setBookedCount(slot.getBookedCount() - 1);
        slotRepository.save(slot);

        slotBookingRepository.delete(booking);

        student.setSlotActionAttempts(attempts + 1);
        userRepository.save(student);

        notificationService.createNotification(student, "Slot Cancelled",
                "Your slot booking for " + slot.getTitle() + " has been cancelled.", "SLOT");
    }

    public List<SlotBookingResponse> getSlotBookingsForAdmin(Long slotId) {
        return slotBookingRepository.findBySlotId(slotId).stream()
                .map(b -> SlotBookingResponse.builder()
                        .id(b.getId())
                        .studentId(b.getStudent().getId())
                        .studentName(b.getStudent().getFullName())
                        .studentEmail(b.getStudent().getEmail())
                        .appointmentTime(b.getAppointmentTime())
                        .bookedAt(b.getBookedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private void validateAppointmentTime(Long slotId, LocalDateTime appointmentTime) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot", "id", slotId));

        if (appointmentTime.isBefore(slot.getStartTime()) || appointmentTime.isAfter(slot.getEndTime().minusMinutes(10))) {
            throw new BadRequestException("Appointment time must be within slot range");
        }

        if (appointmentTime.getMinute() % 10 != 0) {
            throw new BadRequestException("Appointments must be in 10-minute intervals (e.g., :00, :10, :20)");
        }
    }

    public List<SlotResponse> getStudentBookings(Long studentId) {
        return slotBookingRepository.findByStudentId(studentId).stream()
                .map(booking -> mapToResponse(booking.getSlot(), studentId))
                .collect(Collectors.toList());
    }

    private SlotResponse mapToResponse(Slot slot, Long userId) {
        boolean booked = userId != null && slotBookingRepository.existsBySlotIdAndStudentId(slot.getId(), userId);
        LocalDateTime bookedTime = null;
        if (booked) {
            bookedTime = slotBookingRepository.findBySlotIdAndStudentId(slot.getId(), userId)
                    .map(SlotBooking::getAppointmentTime)
                    .orElse(null);
        }

        Integer attempts = 0;
        if (userId != null) {
            attempts = userRepository.findById(userId)
                    .map(User::getSlotActionAttempts)
                    .orElse(0);
        }

        return SlotResponse.builder()
                .id(slot.getId())
                .title(slot.getTitle())
                .description(slot.getDescription())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .maxCapacity(slot.getMaxCapacity())
                .bookedCount(slot.getBookedCount())
                .available(slot.isAvailable())
                .courseName(slot.getCourse() != null ? slot.getCourse().getName() : null)
                .courseId(slot.getCourse() != null ? slot.getCourse().getId() : null)
                .bookedByCurrentUser(booked)
                .appointmentTime(bookedTime)
                .slotActionAttempts(attempts)
                .bookedTimes(slotBookingRepository.findBySlotId(slot.getId()).stream()
                        .map(SlotBooking::getAppointmentTime)
                        .collect(Collectors.toList()))
                .build();
    }
}
