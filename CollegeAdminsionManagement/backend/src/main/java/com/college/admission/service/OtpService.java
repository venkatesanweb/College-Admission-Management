package com.college.admission.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Random;

@Service
public class OtpService {

    // Simple in-memory cache: Maps email -> OTP string
    // In production, use Redis or DB with an expiration time.
    private final Map<String, String> otpCache = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generateOtp(String email) {
        String otp = String.format("%06d", random.nextInt(999999));
        otpCache.put(email.toLowerCase(), otp);
        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        if (email == null || otp == null) {
            return false;
        }
        String storedOtp = otpCache.get(email.toLowerCase());
        if (storedOtp != null && storedOtp.equals(otp)) {
            otpCache.remove(email.toLowerCase()); // invalidate after successful use
            return true;
        }
        return false;
    }
}
