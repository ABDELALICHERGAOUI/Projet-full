package com.example.impactanalyzer.config;

import com.example.impactanalyzer.model.Admin;
import com.example.impactanalyzer.repository.AdminRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {

    private final AdminRepository adminRepository;

    public PasswordConfig(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            Admin admin = adminRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("Admin non trouvé : " + username));
            return User.builder()
                    .username(admin.getUsername())
                    .password(admin.getPassword())
                    .roles("ADMIN")
                    .build();
        };
    }
}