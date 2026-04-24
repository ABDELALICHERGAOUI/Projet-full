package com.example.impactanalyzer.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "dependencies")
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

    private Integer impactWeight = 1;

    public Dependency() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ServiceEntity getService() {
        return service;
    }

    public void setService(ServiceEntity service) {
        this.service = service;
    }

    public ServiceEntity getDependsOn() {
        return dependsOn;
    }

    public void setDependsOn(ServiceEntity dependsOn) {
        this.dependsOn = dependsOn;
    }

    public Integer getImpactWeight() {
        return impactWeight;
    }

    public void setImpactWeight(Integer impactWeight) {
        this.impactWeight = impactWeight;
    }
}