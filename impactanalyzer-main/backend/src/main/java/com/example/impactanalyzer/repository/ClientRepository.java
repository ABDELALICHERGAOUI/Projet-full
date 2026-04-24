package com.example.impactanalyzer.repository;

import com.example.impactanalyzer.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRepository extends JpaRepository<Client, Long> {
}