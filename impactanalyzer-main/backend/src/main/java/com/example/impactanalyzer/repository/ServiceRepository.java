package com.example.impactanalyzer.repository;

import com.example.impactanalyzer.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {
    boolean existsByName(String name);
    Optional<ServiceEntity> findByName(String name);
}