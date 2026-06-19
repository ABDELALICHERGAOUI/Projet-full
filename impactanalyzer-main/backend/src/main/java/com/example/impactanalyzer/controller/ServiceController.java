package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.ImportResultDTO;
import com.example.impactanalyzer.entity.ServiceEntity;
import com.example.impactanalyzer.enums.ServiceStatus;
import com.example.impactanalyzer.enums.ServiceTier;
import com.example.impactanalyzer.service.ServiceServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

import java.util.*;

@RestController
@RequestMapping("/services")
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

    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> importServices(
            @RequestBody List<Map<String, String>> rows) {

        int success = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        for (Map<String, String> row : rows) {
            try {
                ServiceEntity svc = new ServiceEntity();
                svc.setName(row.get("name"));
                svc.setDescription(row.getOrDefault("description", ""));
                svc.setOwnerTeam(row.getOrDefault("ownerTeam", ""));
                svc.setSla(row.getOrDefault("sla", "99.0"));

                String tier = row.getOrDefault("tier", "MEDIUM")
                        .toUpperCase().trim();
                svc.setTier(ServiceTier.valueOf(tier));

                String status = row.getOrDefault("status", "UP")
                        .toUpperCase().trim();
                svc.setStatus(ServiceStatus.valueOf(status));

                serviceService.createService(svc);
                success++;
            } catch (Exception e) {
                errors++;
                errorMessages.add("Ligne " + (success + errors)
                        + " : " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("imported", success);
        result.put("errors", errors);
        result.put("errorMessages", errorMessages);
        return result;
    }

    // ✅ Import CSV — logique entièrement dans ServiceServiceImpl
    @PostMapping("/import/csv")
    public ResponseEntity<ImportResultDTO> importCsv(
            @RequestParam("file") MultipartFile file) {
        try {
            ImportResultDTO result = serviceService.importServicesFromCsv(file);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IOException e) {
            ImportResultDTO error = new ImportResultDTO(
                    0, 1, 0,
                    List.of("Erreur lecture fichier : " + e.getMessage())
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error);
        }
    }
}