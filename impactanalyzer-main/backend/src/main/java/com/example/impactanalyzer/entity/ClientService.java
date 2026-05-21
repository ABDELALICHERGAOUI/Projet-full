package com.example.impactanalyzer.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "client_services")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ClientService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id")
    @JsonIgnoreProperties("services")
    private Client client;

    @ManyToOne
    @JoinColumn(name = "service_id")
    @JsonIgnoreProperties("clients")
    private ServiceEntity service;


}