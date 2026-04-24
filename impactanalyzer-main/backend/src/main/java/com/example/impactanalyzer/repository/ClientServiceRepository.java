package com.example.impactanalyzer.repository;

import com.example.impactanalyzer.model.ClientService;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientServiceRepository extends JpaRepository<ClientService, Long> {
}