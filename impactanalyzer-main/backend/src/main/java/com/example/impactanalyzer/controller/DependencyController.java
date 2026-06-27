package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.DependencyDTO;
import com.example.impactanalyzer.dto.ImportResultDTO;
import com.example.impactanalyzer.entity.Dependency;
import com.example.impactanalyzer.service.DependencyServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/dependencies")
@Tag(name = "Dependencies", description = "Gestion des dépendances entre services")
@SecurityRequirement(name = "bearerAuth")
public class DependencyController {

    private final DependencyServiceImpl dependencyService;

    public DependencyController(DependencyServiceImpl dependencyService) {
        this.dependencyService = dependencyService;
    }

    @GetMapping
    @Operation(summary = "Lister toutes les dépendances")
    public List<Dependency> getAllDependencies() {
        return dependencyService.getAllDependencies();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une dépendance par son identifiant")
    public Dependency getDependencyById(@PathVariable Long id) {
        return dependencyService.getDependencyById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer une nouvelle dépendance entre deux services")
    public Dependency createDependency(@RequestBody DependencyDTO dto) {
        return dependencyService.createDependency(dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer une dépendance")
    public void deleteDependency(@PathVariable Long id) {
        dependencyService.deleteDependency(id);
    }

    @PostMapping("/import/csv")
    public ResponseEntity<ImportResultDTO> importCsv(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(dependencyService.importFromCsv(file));
    }
}