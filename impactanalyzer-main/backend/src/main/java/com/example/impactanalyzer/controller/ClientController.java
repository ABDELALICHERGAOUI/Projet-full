package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.ImportResultDTO;
import com.example.impactanalyzer.entity.Client;
import com.example.impactanalyzer.service.ClientServiceImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/clients")
public class ClientController {

    private final ClientServiceImpl clientService;

    public ClientController(ClientServiceImpl clientService) {
        this.clientService = clientService;
    }

    @GetMapping
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
    public ResponseEntity<ImportResultDTO> importCsv(
            @RequestParam("file") MultipartFile file) {
        try {
            ImportResultDTO result = clientService.importClientsFromCsv(file);
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