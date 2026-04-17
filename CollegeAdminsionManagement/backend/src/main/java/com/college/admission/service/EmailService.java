package com.college.admission.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String to, String otp) {
        log.info("--- MOCK EMAIL: OTP for {} is {} ---", to, otp);
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Your Registration OTP");
            message.setText("Welcome! Your OTP for registration is: " + otp + "\n\nThis OTP is valid for registration.");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send OTP email to {}: {}. Ensure mail server is running or rely on console log above.", to, e.getMessage());
        }
    }

    public void sendApplicationSubmittedEmail(String to, String studentName, String courseName, String collegeName, String department) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Application Submitted Successfully");
            message.setText("Dear " + studentName + ",\n\n" +
                            "This email is to confirm that you have successfully submitted your application for the " + courseName + 
                            " in the " + department + " department at " + collegeName + ".\n\n" +
                            "We will review your application and keep you updated on its status.\n\n" +
                            "Regards,\nCollege Admissions Team");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send submission email to {}: {}", to, e.getMessage());
        }
    }

    public void sendApplicationStatusEmail(String to, String studentName, String courseName, String collegeName, String department, String status, String remarks) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            if (status.equalsIgnoreCase("ACCEPTED")) {
                message.setSubject("Application Accepted: " + courseName);
                message.setText("Dear " + studentName + ",\n\n" +
                                "Congratulations! Your application for " + courseName + " in the " + department + " department at " + collegeName + " has been accepted.\n\n" + 
                                (remarks != null && !remarks.isBlank() ? "Admin Remarks: " + remarks + "\n\n" : "") +
                                "Regards,\nCollege Admissions Team");
            } else if (status.equalsIgnoreCase("REJECTED")) {
                message.setSubject("Application Update: " + courseName);
                message.setText("Dear " + studentName + ",\n\n" +
                                "We regret to inform you that your submitted application for " + courseName + " at " + collegeName + " has been rejected.\n\n" + 
                                "Reason for rejection: " + (remarks != null && !remarks.isBlank() ? remarks : "Not provided.") + "\n\n" +
                                "Regards,\nCollege Admissions Team");
            }
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send status email to {}: {}", to, e.getMessage());
        }
    }
}
