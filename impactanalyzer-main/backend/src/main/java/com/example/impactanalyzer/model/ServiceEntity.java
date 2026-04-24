package com.example.impactanalyzer.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "services")
public class ServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    @Enumerated(EnumType.STRING)
    private ServiceStatus status = ServiceStatus.UP;

    @OneToMany(mappedBy = "service")
    private List<ClientService> clients = new ArrayList<>();

    public ServiceEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ServiceStatus getStatus() { return status; }
    public void setStatus(ServiceStatus status) { this.status = status; }

    public List<ClientService> getClients() { return clients; }
    public void setClients(List<ClientService> clients) { this.clients = clients; }
}