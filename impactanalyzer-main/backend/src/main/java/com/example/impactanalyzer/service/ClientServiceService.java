package com.example.impactanalyzer.service;

import com.example.impactanalyzer.dto.ClientServiceDTO;
import com.example.impactanalyzer.entity.Client;
import com.example.impactanalyzer.entity.ClientService;
import com.example.impactanalyzer.entity.ServiceEntity;
import com.example.impactanalyzer.repository.ClientRepository;
import com.example.impactanalyzer.repository.ClientServiceRepository;
import com.example.impactanalyzer.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.impactanalyzer.dto.ImportResultDTO;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClientServiceService {

    private final ClientServiceRepository clientServiceRepository;
    private final ClientRepository clientRepository;
    private final ServiceRepository serviceRepository;

        // Entity → DTO
    private ClientServiceDTO toDTO(ClientService entity) {
        ClientServiceDTO dto = new ClientServiceDTO();
        dto.setId(entity.getId());
        dto.setClientId(entity.getClient().getId());
        dto.setServiceId(entity.getService().getId());
        dto.setServiceName(entity.getService().getName());
        dto.setServiceTier(String.valueOf(entity.getService().getTier()));
        dto.setServiceStatus(String.valueOf(entity.getService().getStatus()));
        return dto;
    }

    // DTO → Entity
    private ClientService toEntity(ClientServiceDTO dto) {
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client introuvable : " + dto.getClientId()));

        ServiceEntity service = serviceRepository.findById(dto.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service introuvable : " + dto.getServiceId()));

        ClientService entity = new ClientService();
        entity.setClient(client);
        entity.setService(service);
        return entity;
    }
    @Transactional
    public List<ClientServiceDTO> getAll() {
        return clientServiceRepository.findAllWithDetails()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public ClientServiceDTO create(ClientServiceDTO dto) {
        ClientService saved = clientServiceRepository.save(toEntity(dto));
        return toDTO(saved);
    }

    public void delete(Long id) {
        clientServiceRepository.deleteById(id);
    }

    public ImportResultDTO importFromCsv(MultipartFile file) {
        int imported = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream()))) {

            String line;
            boolean firstLine = true;
            while ((line = reader.readLine()) != null) {
                if (firstLine) { firstLine = false; continue; } // skip header
                line = line.replace("\r", "").trim();
                if (line.isEmpty()) continue;

                String[] cols = line.split(",");
                if (cols.length < 2) {
                    errors.add("Ligne invalide : " + line); continue;
                }

                String clientName  = cols[0].trim();
                String serviceName = cols[1].trim();

                // Trouver client et service par nom
                Optional<Client>        client  = clientRepository.findByName(clientName);
                Optional<ServiceEntity> service = serviceRepository.findByName(serviceName);

                if (client.isEmpty()) {
                    errors.add("Client introuvable : " + clientName); continue;
                }
                if (service.isEmpty()) {
                    errors.add("Service introuvable : " + serviceName); continue;
                }

                // Vérifier doublon
                boolean exists = clientServiceRepository
                        .existsByClientAndService(client.get(), service.get());
                if (exists) { skipped++; continue; }

                // Créer l'association
                ClientService cs = new ClientService();
                cs.setClient(client.get());
                cs.setService(service.get());
                clientServiceRepository.save(cs);
                imported++;
            }
        } catch (Exception e) {
            errors.add("Erreur lecture : " + e.getMessage());
        }

        return new ImportResultDTO(imported, errors.size(), skipped, errors);
    }
}