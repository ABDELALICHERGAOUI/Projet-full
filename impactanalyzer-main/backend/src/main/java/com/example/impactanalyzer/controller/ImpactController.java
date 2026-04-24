package com.example.impactanalyzer.controller;


import com.example.impactanalyzer.dto.ImpactDTO;
import com.example.impactanalyzer.service.ImpactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/impact")
public class ImpactController {

    @Autowired
    private ImpactService impactService;

    @PostMapping("/simulate/{id}")
    public ImpactDTO simulate(@PathVariable Long id) {
        return impactService.simulateImpact(id);
    }
}
