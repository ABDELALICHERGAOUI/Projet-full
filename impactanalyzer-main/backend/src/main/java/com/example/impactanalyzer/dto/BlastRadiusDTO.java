package com.example.impactanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class BlastRadiusDTO {
    private Long   serviceId;
    private String serviceName;
    private String tier;
    private String status;
    private int    impactedServicesCount;
    private int    impactedClientsCount;
    private double blastRadiusScore;    // % d'impact
    private String severity;            // NONE/LOW/MEDIUM/HIGH/CRITICAL
}