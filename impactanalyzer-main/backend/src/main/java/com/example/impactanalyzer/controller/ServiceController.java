package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.ImportResultDTO;
import com.example.impactanalyzer.entity.ServiceEntity;
import com.example.impactanalyzer.enums.ServiceStatus;
import com.example.impactanalyzer.service.ServiceServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.*;

@RestController
@RequestMapping("/services")
@Tag(name = "Services", description = "Gestion des services")
@SecurityRequirement(name = "bearerAuth")
public class ServiceController {

    private final ServiceServiceImpl serviceService;

    public ServiceController(ServiceServiceImpl serviceService) {
        this.serviceService = serviceService;
    }

    @GetMapping
    public List<ServiceEntity> getAllServices() {
        return serviceService.getAllServices();
    }

    @GetMapping("/{id}")
    public ServiceEntity getServiceById(@PathVariable Long id) {
        return serviceService.getServiceById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceEntity createService(@RequestBody ServiceEntity service) {
        return serviceService.createService(service);
    }

    @PutMapping("/{id}")
    public ServiceEntity updateService(@PathVariable Long id, @RequestBody ServiceEntity service) {
        return serviceService.updateService(id, service);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteService(@PathVariable Long id) {
        serviceService.deleteService(id);
    }

    @PatchMapping("/{id}")
    public void updatestatus(@PathVariable Long id, @RequestBody ServiceStatus status) {
        serviceService.updateStatus(id , status);
    }

    @PostMapping(
            value = "/import/csv",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Operation(summary = "Importer des services depuis un fichier CSV")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Services importés avec succès"),
            @ApiResponse(responseCode = "400", description = "Fichier CSV invalide"),
            @ApiResponse(responseCode = "500", description = "Erreur interne lors de l'import")
    })
    public ResponseEntity<ImportResultDTO> importCsv(
            @RequestParam("file") MultipartFile file) {

        ImportResultDTO result = serviceService.importServicesFromCsv(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}