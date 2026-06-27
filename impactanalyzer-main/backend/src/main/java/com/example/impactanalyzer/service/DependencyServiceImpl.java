package com.example.impactanalyzer.service;

import com.example.impactanalyzer.dto.DependencyDTO;
import com.example.impactanalyzer.dto.ImportResultDTO;
import com.example.impactanalyzer.entity.Dependency;
import com.example.impactanalyzer.entity.ServiceEntity;
import com.example.impactanalyzer.repository.DependencyRepository;
import com.example.impactanalyzer.repository.ServiceRepository;
import org.springframework.stereotype.Service;
import com.example.impactanalyzer.enums.DependencyCriticality;
import com.example.impactanalyzer.enums.DependencyType;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    public Dependency createDependency(DependencyDTO dto) {
        Long serviceId = dto.getServiceId();
        Long dependsOnId = dto.getDependsOnId();

        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'id: " + serviceId));
        ServiceEntity dependsOn = serviceRepository.findById(dependsOnId)
                .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'id: " + dependsOnId));

        if (serviceId.equals(dependsOnId)) {
            throw new RuntimeException("Un service ne peut pas dépendre de lui-même");
        }
        Dependency dependency = new Dependency();
        dependency.setService(service);
        dependency.setDependsOn(dependsOn);
        dependency.setCriticality(
                DependencyCriticality.valueOf(dto.getCriticality())
        );
        dependency.setDependencyType(
                DependencyType.valueOf(dto.getDependencyType())
        );
        return dependencyRepository.save(dependency);
    }

    public void deleteDependency(Long id) {
        Dependency dependency = getDependencyById(id);
        dependencyRepository.delete(dependency);
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
                if (cols.length < 4) {
                    errors.add("Ligne invalide : " + line); continue;
                }

                String fromName  = cols[0].trim();
                String toName    = cols[1].trim();
                String depType   = cols[2].trim();
                String crit      = cols[3].trim();

                // Trouver les services par nom
                Optional<ServiceEntity> from = serviceRepository.findByName(fromName);
                Optional<ServiceEntity> to   = serviceRepository.findByName(toName);

                if (from.isEmpty()) {
                    errors.add("Service introuvable : " + fromName); continue;
                }
                if (to.isEmpty()) {
                    errors.add("Service introuvable : " + toName); continue;
                }

                // Vérifier doublon
                boolean exists = dependencyRepository
                        .existsByServiceAndDependsOn(from.get(), to.get());
                if (exists) { skipped++; continue; }

                // Créer la dépendance
                Dependency dep = new Dependency();
                dep.setService(from.get());
                dep.setDependsOn(to.get());
                dep.setDependencyType(DependencyType.valueOf(depType));
                dep.setCriticality(DependencyCriticality.valueOf(crit));
                dependencyRepository.save(dep);
                imported++;
            }
        } catch (Exception e) {
            errors.add("Erreur lecture : " + e.getMessage());
        }

        return new ImportResultDTO(imported, errors.size(), skipped, errors);
    }
}