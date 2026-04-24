package com.example.impactanalyzer.service;

import com.example.impactanalyzer.model.Client;
import com.example.impactanalyzer.repository.ClientRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClientServiceImpl {

    private final ClientRepository repository;

    public ClientServiceImpl(ClientRepository repository) {
        this.repository = repository;
    }

    public List<Client> getAllClients() {
        return repository.findAll();
    }

    public Client getClientById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'id: " + id));
    }

    public Client createClient(Client client) {
        if (client.getName() == null || client.getName().trim().isEmpty()) {
            throw new RuntimeException("Le nom du client est obligatoire");
        }
        return repository.save(client);
    }

    public Client updateClient(Long id, Client clientDetails) {
        Client client = getClientById(id);
        if (clientDetails.getName() != null && !clientDetails.getName().trim().isEmpty()) {
            client.setName(clientDetails.getName());
        }
        if (clientDetails.getEmail() != null) {
            client.setEmail(clientDetails.getEmail());
        }
        return repository.save(client);
    }

    public void deleteClient(Long id) {
        Client client = getClientById(id);
        repository.delete(client);
    }
}