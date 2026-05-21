package com.example.impactanalyzer.entity;

import com.example.impactanalyzer.enums.DependencyCriticality;
import com.example.impactanalyzer.enums.DependencyType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "dependencies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Dependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "service_id")
    @JsonIgnoreProperties({"clients", "dependencies"})
    private ServiceEntity service;

    @ManyToOne
    @JoinColumn(name = "depends_on_id")
    @JsonIgnoreProperties({"clients", "dependencies"})
    private ServiceEntity dependsOn;

    //private Integer impactWeight = 1;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DependencyCriticality criticality = DependencyCriticality.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DependencyType dependencyType = DependencyType.SYNC_API;


}