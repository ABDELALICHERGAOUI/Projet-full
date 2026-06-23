package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.BlastRadiusDTO;
import com.example.impactanalyzer.dto.ServiceRiskDTO;
import com.example.impactanalyzer.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@Tag(name = "Rapports", description = "Rapports d'analyse des risques et du blast radius")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/top-critical-services")
    @Operation(summary = "Afficher les services les plus critiques")
    public List<ServiceRiskDTO> getTopCriticalServices() {
        return reportService.getTopCriticalServices();
    }

    @GetMapping("/blast-radius")
    @Operation(summary = "Afficher le rapport du blast radius des services")
    public List<BlastRadiusDTO> getBlastRadiusReport() {
        return reportService.getBlastRadiusReport();
    }
}