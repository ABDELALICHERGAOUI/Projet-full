package com.example.impactanalyzer.repository;

import com.example.impactanalyzer.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {
    boolean existsByEmail(String email);
    boolean existsByName(String name);
    Optional<Client> findByName(String name);


}