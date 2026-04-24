package com.example.impactanalyzer.service;

import com.example.impactanalyzer.dto.ImpactDTO;
import com.example.impactanalyzer.model.ClientService;
import com.example.impactanalyzer.model.Dependency;
import com.example.impactanalyzer.model.ServiceEntity;
import com.example.impactanalyzer.model.ServiceStatus;
import com.example.impactanalyzer.repository.ClientRepository;
import com.example.impactanalyzer.repository.ClientServiceRepository;
import com.example.impactanalyzer.repository.DependencyRepository;
import com.example.impactanalyzer.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ImpactService {


    @Autowired
    private ClientServiceRepository clientServiceRepository;

    @Autowired
    private DependencyRepository dependencyRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    public ImpactDTO simulateImpact(Long serviceId) {

        ServiceEntity failedService = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        // construire graphe
        Map<Long, List<Long>> graph = new HashMap<>();

        for (Dependency d : dependencyRepository.findAll()) {
            Long dependsOn = d.getDependsOn().getId();
            Long service = d.getService().getId();

            graph.computeIfAbsent(dependsOn, k -> new ArrayList<>()).add(service);
        }

        // BFS
        Set<Long> visited = new HashSet<>();
        Queue<Long> queue = new LinkedList<>();
        Map<Long, Long> parent = new HashMap<>();

        queue.add(serviceId);
        visited.add(serviceId);

        while (!queue.isEmpty()) {
            Long current = queue.poll();

            List<Long> neighbors = graph.getOrDefault(current, new ArrayList<>());

            for (Long n : neighbors) {
                if (!visited.contains(n)) {
                    visited.add(n);
                    parent.put(n, current);
                    queue.add(n);
                }
            }
        }

        visited.remove(serviceId); // enlever le service initial

        List<String> impactPaths = new ArrayList<>();

        for (Long node : visited) {

            // vérifier si c'est une feuille (pas de voisins)
            List<Long> neighbors = graph.getOrDefault(node, new ArrayList<>());

            if (neighbors.isEmpty()) { // ✅ feuille

                List<Long> path = new ArrayList<>();
                Long current = node;

                // remonter jusqu'à la racine
                while (current != null) {
                    path.add(current);
                    current = parent.get(current);
                }

                Collections.reverse(path);

                // convertir en noms des services
                String pathStr = path.stream()
                        .map(String::valueOf)
                        //.map(id -> serviceRepository.findById(id).get().getName())
                        .reduce((a, b) -> a + " -> " + b)
                        .orElse("");

                impactPaths.add(pathStr);
            }
        }

        // récupérer services impactés
        List<String> impactedServices = visited.stream()
                .map(id -> serviceRepository.findById(id).get().getName())
                .toList();

        // récupérer clients impactés
        Set<String> clients = new HashSet<>();

        for (ClientService cs : clientServiceRepository.findAll()) {
            if (visited.contains(cs.getService().getId())
                    || cs.getService().getId().equals(serviceId)) {
                clients.add(cs.getClient().getName());
            }
        }

        // calcul score
        // 1. Nombre total de services UP
        long totalServices = serviceRepository.findAll().stream()
                .filter(s -> s.getStatus() == ServiceStatus.UP)
                .count();

        // 2. Nombre de services impactés
        int impactedCount = visited.size();

        // 3. Score en pourcentage (blast radius)
        double impactScore = totalServices > 0
                ? (impactedCount * 100.0 / totalServices)
                : 0.0;

        String severity;

        if (impactScore == 0) severity = "NONE";
        else if (impactScore <= 25) severity = "LOW";
        else if (impactScore <= 50) severity = "MEDIUM";
        else if (impactScore <= 75) severity = "HIGH";
        else severity = "CRITICAL";

        // construire DTO
        ImpactDTO dto = new ImpactDTO();
        dto.setFailedServiceName(failedService.getName());
        dto.setImpactedServices(impactedServices);
        dto.setImpactedClients(new ArrayList<>(clients));
        dto.setImpactScore(impactScore);
        dto.setFailedServiceId(serviceId);
        dto.setTotalServicesImpacted(impactedServices.size());
        dto.setTotalClientsImpacted(clients.size());
        dto.setImpactPaths(impactPaths);
        dto.setSeverity(severity);

        return dto;
    }
}




