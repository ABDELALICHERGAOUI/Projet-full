package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.BlastRadiusDTO;
import com.example.impactanalyzer.dto.ServiceRiskDTO;
import com.example.impactanalyzer.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // GET /reports/top-critical-services
    @GetMapping("/top-critical-services")
    public List<ServiceRiskDTO> getTopCriticalServices() {
        return reportService.getTopCriticalServices();
    }

    // GET /reports/blast-radius
    @GetMapping("/blast-radius")
    public List<BlastRadiusDTO> getBlastRadiusReport() {
        return reportService.getBlastRadiusReport();
    }
}