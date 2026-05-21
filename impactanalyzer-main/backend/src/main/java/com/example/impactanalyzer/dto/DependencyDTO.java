package com.example.impactanalyzer.dto;

public class DependencyDTO {
    private Long serviceId;
    private Long dependsOnId;
    private double impactWeight;

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
    public Long getDependsOnId() { return dependsOnId; }
    public void setDependsOnId(Long dependsOnId) { this.dependsOnId = dependsOnId; }
    public double getImpactWeight() { return impactWeight; }
    public void setImpactWeight(double impactWeight) { this.impactWeight = impactWeight; }
}