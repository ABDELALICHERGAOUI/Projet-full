package com.example.impactanalyzer.controller;


import com.example.impactanalyzer.dto.ImpactDTO;
import com.example.impactanalyzer.service.ImpactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/impact")
@Tag(name = "Simulation d'impact", description = "Simulation de panne et analyse des services et clients impactés")
@SecurityRequirement(name = "bearerAuth")
public class ImpactController {

    private final ImpactService impactService;

    public ImpactController(ImpactService impactService) {
        this.impactService = impactService;
    }

    @PostMapping("/simulate/{id}")
    @Operation(summary = "Simuler l'impact de la panne d'un service")
    public ImpactDTO simulate(@PathVariable Long id) {
        return impactService.simulateImpact(id);
    }
}
