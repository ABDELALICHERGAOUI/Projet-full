package com.example.impactanalyzer.repository;

import com.example.impactanalyzer.entity.ClientService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ClientServiceRepository extends JpaRepository<ClientService, Long> {
    @Query("SELECT cs FROM ClientService cs " +
            "JOIN FETCH cs.client " +
            "JOIN FETCH cs.service")
    List<ClientService> findAllWithDetails();

}
