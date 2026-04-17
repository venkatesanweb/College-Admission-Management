package com.college.admission.config;

import com.college.admission.entity.User;
import com.college.admission.enums.Role;
import com.college.admission.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String superAdminEmail = "vv6374717300vv@gmail.com";
        
        Optional<User> existingUser = userRepository.findByEmail(superAdminEmail);
        
            if (existingUser.isEmpty()) {
            User superAdmin = User.builder()
                    .fullName("Super Admin")
                    .email(superAdminEmail)
                    .password(passwordEncoder.encode("Deesan@1216"))
                    .phone("1234567890")
                    .role(Role.SUPER_ADMIN)
                    .blocked(false)
                    .build();
            userRepository.save(superAdmin);
            log.info("Super Admin account successfully seeded with email: {}", superAdminEmail);
        } else {
            User superAdmin = existingUser.get();
            boolean updated = false;
            if (superAdmin.getRole() != Role.SUPER_ADMIN) {
                superAdmin.setRole(Role.SUPER_ADMIN);
                updated = true;
            }
            // Temporarily update password on restart to ensure they can login with the requested password
            superAdmin.setPassword(passwordEncoder.encode("Deesan@1216"));
            updated = true;
            
            if (updated) {
                userRepository.save(superAdmin);
                log.info("Super Admin account successfully updated with email: {}", superAdminEmail);
            }
        }
    }
}
