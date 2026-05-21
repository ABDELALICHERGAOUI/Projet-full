package com.example.impactanalyzer.repository;

import com.example.impactanalyzer.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {
}