package com.college.admission.service;

import com.college.admission.dto.request.LoginRequest;
import com.college.admission.dto.request.RegisterRequest;
import com.college.admission.dto.response.AuthResponse;
import com.college.admission.config.JwtService;
import com.college.admission.entity.User;
import com.college.admission.enums.Role;
import com.college.admission.exception.BadRequestException;
import com.college.admission.repository.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       @Lazy AuthenticationManager authenticationManager,
                       OtpService otpService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.otpService = otpService;
        this.emailService = emailService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
    }

    public void sendOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }
        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        if (!otpService.validateOtp(request.getEmail(), request.getOtp())) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        Role role = Role.STUDENT; // Enforce STUDENT role for public registration

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(role)
                .blocked(false)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        if (user.isBlocked()) {
            throw new BadRequestException("Your account has been blocked. Contact administrator.");
        }

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }
}
