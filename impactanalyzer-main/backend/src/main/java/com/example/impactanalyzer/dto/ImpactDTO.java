package com.example.impactanalyzer.dto;

import java.util.List;

public class ImpactDTO {

    private Long failedServiceId;
    private String failedServiceName;

    private List<String> impactedServices;  // noms des services touchés
    private List<String> impactedClients;   // noms des clients touchés
    private int    totalServicesImpacted;
    private int    totalClientsImpacted;
    private double impactScore;
    private List<String> impactPaths;
    private String severity;

    public Long getFailedServiceId() { return failedServiceId; }
    public void setFailedServiceId(Long failedServiceId) { this.failedServiceId = failedServiceId; }

    public String getFailedServiceName() { return failedServiceName; }
    public void setFailedServiceName(String failedServiceName) { this.failedServiceName = failedServiceName; }

    public List<String> getImpactedServices() { return impactedServices; }
    public void setImpactedServices(List<String> impactedServices) { this.impactedServices = impactedServices; }

    public List<String> getImpactedClients() { return impactedClients; }
    public void setImpactedClients(List<String> impactedClients) { this.impactedClients = impactedClients; }

    public int getTotalServicesImpacted() { return totalServicesImpacted; }
    public void setTotalServicesImpacted(int totalServicesImpacted) { this.totalServicesImpacted = totalServicesImpacted; }

    public int getTotalClientsImpacted() { return totalClientsImpacted; }
    public void setTotalClientsImpacted(int totalClientsImpacted) { this.totalClientsImpacted = totalClientsImpacted; }

    public double getImpactScore() { return impactScore; }
    public void setImpactScore(double impactScore) { this.impactScore = impactScore; }

    public List<String> getImpactPaths() { return impactPaths; }
    public void setImpactPaths(List<String> impactPaths) { this.impactPaths = impactPaths; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
}

