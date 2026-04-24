package com.example.impactanalyzer.repository;

import com.example.impactanalyzer.model.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {
}