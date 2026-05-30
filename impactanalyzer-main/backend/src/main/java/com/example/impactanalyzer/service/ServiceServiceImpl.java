package com.example.impactanalyzer.service;

import com.example.impactanalyzer.entity.ServiceEntity;
import com.example.impactanalyzer.enums.ServiceStatus;
import com.example.impactanalyzer.repository.ServiceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServiceServiceImpl {

    private final ServiceRepository repository;

    public ServiceServiceImpl(ServiceRepository repository) {
        this.repository = repository;
    }

    public List<ServiceEntity> getAllServices() {
        return repository.findAll();
    }

    public ServiceEntity getServiceById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'id: " + id));
    }

    public ServiceEntity createService(ServiceEntity service) {
        if (service.getName() == null || service.getName().trim().isEmpty()) {
            throw new RuntimeException("Le nom du service est obligatoire");
        }
        return repository.save(service);
    }

    public ServiceEntity updateService(Long id, ServiceEntity serviceDetails) {
        ServiceEntity service = getServiceById(id);
        if (serviceDetails.getName() != null && !serviceDetails.getName().trim().isEmpty()) {
            service.setName(serviceDetails.getName());
        }
        if (serviceDetails.getDescription() != null) {
            service.setDescription(serviceDetails.getDescription());
        }
        if (serviceDetails.getOwnerTeam() != null) {
            service.setOwnerTeam(serviceDetails.getOwnerTeam());
        }
        if(serviceDetails.getTier() != null) {
            service.setTier(serviceDetails.getTier());
        }
        if(serviceDetails.getSla() != null) {
            service.setSla(serviceDetails.getSla());
        }
        if (serviceDetails.getStatus() != null) {
            service.setStatus(serviceDetails.getStatus());
        }
        return repository.save(service);
    }

    public void deleteService(Long id) {
        ServiceEntity service = getServiceById(id);
        repository.delete(service);
    }
    public void updateStatus(Long id, ServiceStatus status) {
        ServiceEntity service = getServiceById(id);
        service.setStatus(status);
        repository.save(service);
    }
}