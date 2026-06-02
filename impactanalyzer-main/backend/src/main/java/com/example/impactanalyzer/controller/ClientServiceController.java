package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.ClientServiceDTO;
import com.example.impactanalyzer.entity.ClientService;
import com.example.impactanalyzer.repository.ClientServiceRepository;
import com.example.impactanalyzer.service.ClientServiceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/client-services")
public class ClientServiceController {

    private final ClientServiceService clientServiceService;

    public ClientServiceController( ClientServiceService clientServiceService) {
        this.clientServiceService = clientServiceService;
    }

    @GetMapping
    public List<ClientServiceDTO> getAll() {

        return clientServiceService.getAll();
    }

    @PostMapping
    public ClientServiceDTO create(@RequestBody ClientServiceDTO dto) {
        return clientServiceService.create(dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        clientServiceService.delete(id);
    }
}