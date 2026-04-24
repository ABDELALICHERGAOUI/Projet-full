package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.model.ClientService;
import com.example.impactanalyzer.repository.ClientServiceRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/client-services")
public class ClientServiceController {

    private final ClientServiceRepository repo;

    public ClientServiceController(ClientServiceRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<ClientService> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public ClientService create(@RequestBody ClientService clientService) {
        return repo.save(clientService);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}