package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.model.Dependency;
import com.example.impactanalyzer.service.DependencyServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dependencies")
public class DependencyController {

    private final DependencyServiceImpl dependencyService;

    public DependencyController(DependencyServiceImpl dependencyService) {
        this.dependencyService = dependencyService;
    }

    @GetMapping
    public List<Dependency> getAllDependencies() {
        return dependencyService.getAllDependencies();
    }

    @GetMapping("/{id}")
    public Dependency getDependencyById(@PathVariable Long id) {
        return dependencyService.getDependencyById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Dependency createDependency(@RequestBody Dependency dependency) {
        return dependencyService.createDependency(dependency);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDependency(@PathVariable Long id) {
        dependencyService.deleteDependency(id);
    }
}