package com.example.impactanalyzer.service;

import com.example.impactanalyzer.model.Dependency;
import com.example.impactanalyzer.model.ServiceEntity;
import com.example.impactanalyzer.repository.DependencyRepository;
import com.example.impactanalyzer.repository.ServiceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DependencyServiceImpl {

    private final DependencyRepository dependencyRepository;
    private final ServiceRepository serviceRepository;

    public DependencyServiceImpl(DependencyRepository dependencyRepository, ServiceRepository serviceRepository) {
        this.dependencyRepository = dependencyRepository;
        this.serviceRepository = serviceRepository;
    }

    public List<Dependency> getAllDependencies() {
        return dependencyRepository.findAll();
    }

    public Dependency getDependencyById(Long id) {
        return dependencyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dépendance non trouvée avec l'id: " + id));
    }

    public Dependency createDependency(Dependency dependency) {
        Long serviceId = dependency.getService().getId();
        Long dependsOnId = dependency.getDependsOn().getId();

        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'id: " + serviceId));
        ServiceEntity dependsOn = serviceRepository.findById(dependsOnId)
                .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'id: " + dependsOnId));

        if (serviceId.equals(dependsOnId)) {
            throw new RuntimeException("Un service ne peut pas dépendre de lui-même");
        }

        dependency.setService(service);
        dependency.setDependsOn(dependsOn);

        return dependencyRepository.save(dependency);
    }

    public void deleteDependency(Long id) {
        Dependency dependency = getDependencyById(id);
        dependencyRepository.delete(dependency);
    }
}