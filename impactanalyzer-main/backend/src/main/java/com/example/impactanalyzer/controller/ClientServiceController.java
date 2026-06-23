package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.ClientServiceDTO;
import com.example.impactanalyzer.service.ClientServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/client-services")
@Tag(name = "Associations client-service", description = "Gestion des associations entre clients et services")
@SecurityRequirement(name = "bearerAuth")
public class ClientServiceController {

    private final ClientServiceService clientServiceService;

    public ClientServiceController( ClientServiceService clientServiceService) {
        this.clientServiceService = clientServiceService;
    }

    @GetMapping
    @Operation(summary = "Lister toutes les associations client-service")
    public List<ClientServiceDTO> getAll() {

        return clientServiceService.getAll();
    }

    @PostMapping
    @Operation(summary = "Créer une association entre un client et un service")
    public ClientServiceDTO create(@RequestBody ClientServiceDTO dto) {
        return clientServiceService.create(dto);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une association client-service")
    public void delete(@PathVariable Long id) {
        clientServiceService.delete(id);
    }
}