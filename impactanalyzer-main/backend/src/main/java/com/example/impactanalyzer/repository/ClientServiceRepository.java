package com.example.impactanalyzer.repository;

import com.example.impactanalyzer.entity.ClientService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClientServiceRepository extends JpaRepository<ClientService, Long> {
    @Query("SELECT cs FROM ClientService cs " +
            "JOIN FETCH cs.client " +
            "JOIN FETCH cs.service")
    List<ClientService> findAllWithDetails();

    @Query("SELECT COUNT(cs) FROM ClientService cs WHERE cs.client.id = :clientId")
    long countByClientId(@Param("clientId") Long clientId);

    @Query("SELECT COUNT(cs) FROM ClientService cs WHERE cs.service.id = :serviceId")
    long countByServiceId(@Param("serviceId") Long serviceId);

    @Modifying
    @Query("DELETE FROM ClientService cs WHERE cs.client.id = :clientId")
    void deleteByClientId(@Param("clientId") Long clientId);

    @Modifying
    @Query("DELETE FROM ClientService cs WHERE cs.service.id = :serviceId")
    void deleteByServiceId(@Param("serviceId") Long serviceId);

}
