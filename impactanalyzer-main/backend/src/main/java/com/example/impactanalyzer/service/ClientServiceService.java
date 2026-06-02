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

import java.util.List;

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
}