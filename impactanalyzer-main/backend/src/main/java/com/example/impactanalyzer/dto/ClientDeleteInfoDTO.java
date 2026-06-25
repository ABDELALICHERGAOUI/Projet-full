package com.example.impactanalyzer.dto;

public record ClientDeleteInfoDTO (
        boolean hasRelations,
        long serviceAssociations
) {
}