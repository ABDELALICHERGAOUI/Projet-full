package com.example.impactanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClientServiceDTO {
    private Long id;
    private Long clientId;
    private Long serviceId;
    private String serviceName;
    private String serviceTier;
    private String serviceStatus;


}
