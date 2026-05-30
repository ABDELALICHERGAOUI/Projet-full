package com.example.impactanalyzer.dto;

public class DependencyDTO {
    private Long serviceId;
    private Long dependsOnId;
    private String criticality;
    private String dependencyType;

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
    public Long getDependsOnId() { return dependsOnId; }
    public void setDependsOnId(Long dependsOnId) { this.dependsOnId = dependsOnId; }
    public String getCriticality() { return criticality; }
    public void setCriticality(String criticality) { this.criticality = criticality; }
    public String getDependencyType() { return dependencyType; }
    public void setDependencyType(String dependencyType) { this.dependencyType = dependencyType; }
}
