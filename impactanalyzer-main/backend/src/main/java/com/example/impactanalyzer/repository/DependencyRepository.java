package com.example.impactanalyzer.repository;

import com.example.impactanalyzer.model.Dependency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DependencyRepository extends JpaRepository<Dependency, Long> {

    List<Dependency> findByDependsOnId(Long serviceId);

}