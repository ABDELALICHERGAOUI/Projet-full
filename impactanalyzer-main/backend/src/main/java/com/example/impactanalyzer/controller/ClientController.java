package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.ImportResultDTO;
import com.example.impactanalyzer.entity.Client;
import com.example.impactanalyzer.service.ClientServiceImpl;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/clients")
@Tag(name = "Clients", description = "Gestion des clients")
@SecurityRequirement(name = "bearerAuth")
public class ClientController {

    private final ClientServiceImpl clientService;

    public ClientController(ClientServiceImpl clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    @Operation(summary = "Lister tous les clients")
    public List<Client> getAllClients() {
        return clientService.getAllClients();
    }

    @GetMapping("/{id}")
    public Client getClientById(@PathVariable Long id) {
        return clientService.getClientById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Client createClient(@RequestBody Client client) {
        return clientService.createClient(client);
    }

    @PutMapping("/{id}")
    public Client updateClient(@PathVariable Long id, @RequestBody Client client) {
        return clientService.updateClient(id, client);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
    }

    @DeleteMapping("/batch")
    public ResponseEntity<?> deleteMultiple(@RequestBody List<Long> ids) {
        clientService.deleteAllById(ids);
        return ResponseEntity.ok().build();
    }
    @PostMapping(
            value = "/import/csv",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Operation(summary = "Importer des clients depuis un fichier CSV")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Clients importés avec succès"),
            @ApiResponse(responseCode = "400", description = "Fichier CSV invalide"),
            @ApiResponse(responseCode = "500", description = "Erreur interne lors de l'import")
    })
    public ResponseEntity<ImportResultDTO> importCsv(
            @RequestParam("file") MultipartFile file) {

        ImportResultDTO result = clientService.importClientsFromCsv(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}