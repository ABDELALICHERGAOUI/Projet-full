package com.example.impactanalyzer.entity;

import com.example.impactanalyzer.enums.ServiceStatus;
import com.example.impactanalyzer.enums.ServiceTier;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String ownerTeam;
    private String sla;
    @Enumerated(EnumType.STRING)
    private ServiceStatus status = ServiceStatus.UP;

    @Enumerated(EnumType.STRING)
    private ServiceTier tier = ServiceTier.MEDIUM;

    @OneToMany(
            mappedBy = "service",
            cascade = CascadeType.ALL,
            fetch = FetchType.LAZY
    )
    private List<ClientService> clients = new ArrayList<>();


}