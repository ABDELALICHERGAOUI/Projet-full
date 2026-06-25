package com.example.impactanalyzer.repository;

import com.example.impactanalyzer.entity.Dependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


import java.util.List;

public interface DependencyRepository extends JpaRepository<Dependency, Long> {

    List<Dependency> findByDependsOnId(Long serviceId);
    @Query("""
           SELECT COUNT(d)
           FROM Dependency d
           WHERE d.service.id = :serviceId
              OR d.dependsOn.id = :serviceId
           """)
    long countByServiceInDependencies(@Param("serviceId") Long serviceId);

    @Modifying
    @Query("""
           DELETE FROM Dependency d
           WHERE d.service.id = :serviceId
              OR d.dependsOn.id = :serviceId
           """)
    void deleteByServiceInDependencies(@Param("serviceId") Long serviceId);

}