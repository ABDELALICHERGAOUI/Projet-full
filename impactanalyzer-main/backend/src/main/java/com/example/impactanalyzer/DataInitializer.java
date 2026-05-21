package com.example.impactanalyzer;

import com.example.impactanalyzer.repository.AdminRepository;
import com.example.impactanalyzer.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private AdminService adminService;

    @Override
    public void run(String... args) {
        if (adminRepository.count() == 0) {
            adminService.createAdmin("admin", "admin@sdia.com", "Admin123!");
            System.out.println("======================================");
            System.out.println(" Admin créé — username: admin / password: Admin123!");
            System.out.println("======================================");
        }
    }
}