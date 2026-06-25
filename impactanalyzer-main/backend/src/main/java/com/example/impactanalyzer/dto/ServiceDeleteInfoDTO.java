package com.example.impactanalyzer.dto;

public record ServiceDeleteInfoDTO(
        boolean hasRelations,
        long clientAssociations,
        long dependencies
) {
}