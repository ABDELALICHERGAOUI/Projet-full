package com.example.impactanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRiskDTO {
    private Long   id;
    private String name;
    private String tier;
    private String status;
    private String ownerTeam;
    private int    dependencyCount;   // nb de services qui dépendent de lui
    private int    dependsOnCount;    // nb de services dont il dépend
    private double riskScore;         // score de risque calculé (0-100)
    private String riskLevel;         // CRITICAL / HIGH / MEDIUM / LOW
}