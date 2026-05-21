package com.example.impactanalyzer.service;

import com.example.impactanalyzer.entity.*;
import com.example.impactanalyzer.repository.*;
import com.example.impactanalyzer.enums.*;
import com.example.impactanalyzer.dto.ImpactDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.util.*;

@Service
public class ImpactService {

    @Autowired private ClientServiceRepository clientServiceRepository;
    @Autowired private DependencyRepository dependencyRepository;
    @Autowired private ServiceRepository serviceRepository;
    @Autowired private ClientRepository clientRepository;

    public ImpactDTO simulateImpact(Long serviceId) {

        ServiceEntity failedService = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        // ── 1. Construire le graphe ──────────────────────────
        // Map : serviceId → liste des services qui dépendent de lui
        // ET Map : serviceId → dépendance (pour récupérer criticality)
        Map<Long, List<Long>> graph = new HashMap<>();
        Map<String, DependencyCriticality> edgeCriticality = new HashMap<>();

        for (Dependency d : dependencyRepository.findAll()) {
            Long from = d.getDependsOn().getId(); // si ce service tombe
            Long to   = d.getService().getId();   // → ce service est impacté
            graph.computeIfAbsent(from, k -> new ArrayList<>()).add(to);

            // clé "from->to" pour retrouver la criticité de ce lien
            edgeCriticality.put(from + "->" + to, d.getCriticality());
        }

        // ── 2. BFS ──────────────────────────────────────────
        Set<Long> visited = new HashSet<>();
        Queue<Long> queue = new LinkedList<>();
        Map<Long, Long> parent = new HashMap<>();

        queue.add(serviceId);
        visited.add(serviceId);

        while (!queue.isEmpty()) {
            Long current = queue.poll();
            for (Long neighbor : graph.getOrDefault(current, new ArrayList<>())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    parent.put(neighbor, current);
                    queue.add(neighbor);
                }
            }
        }
        visited.remove(serviceId);

        // ── 3. Chemins de propagation (fix bug noms) ─────────
        List<String> impactPaths = new ArrayList<>();
        for (Long node : visited) {
            if (graph.getOrDefault(node, new ArrayList<>()).isEmpty()) {
                List<Long> path = new ArrayList<>();
                Long current = node;
                while (current != null) {
                    path.add(current);
                    current = parent.get(current);
                }
                Collections.reverse(path);

                // ✅ FIX : afficher les NOMS, pas les IDs
                String pathStr = path.stream()
                        .map(id -> serviceRepository.findById(id)
                                .map(ServiceEntity::getName)
                                .orElse("Service#" + id))
                        .reduce((a, b) -> a + " → " + b)
                        .orElse("");

                impactPaths.add(pathStr);
            }
        }

        // ── 4. Services impactés ─────────────────────────────
        List<ServiceEntity> impactedServiceEntities = visited.stream()
                .map(id -> serviceRepository.findById(id).get())
                .toList();

        List<String> impactedServiceNames = impactedServiceEntities.stream()
                .map(ServiceEntity::getName)
                .toList();

        // ── 5. Clients impactés ──────────────────────────────
        Set<Client> impactedClientSet = new HashSet<>();
        for (ClientService cs : clientServiceRepository.findAll()) {
            Long csServiceId = cs.getService().getId();
            if (visited.contains(csServiceId) || csServiceId.equals(serviceId)) {
                impactedClientSet.add(cs.getClient());
            }
        }

        // ── 6. CALCUL DU SCORE PONDÉRÉ ───────────────────────
        double weightedScore = 0.0;

        for (ServiceEntity svc : impactedServiceEntities) {

            // Poids du tier du service impacté
            int tierWeight = switch (svc.getTier()) {
                case CRITICAL -> 4;
                case HIGH     -> 3;
                case MEDIUM   -> 2;
                case LOW      -> 1;
            };

            // Poids de la criticité du lien (dépendance) qui mène à ce service
            Long parentId = parent.get(svc.getId());
            int critWeight = 2; // MEDIUM par défaut
            if (parentId != null) {
                DependencyCriticality crit = edgeCriticality
                        .getOrDefault(parentId + "->" + svc.getId(), DependencyCriticality.MEDIUM);
                critWeight = switch (crit) {
                    case HIGH   -> 3;
                    case MEDIUM -> 2;
                    case LOW    -> 1;
                };
            }

            weightedScore += tierWeight * critWeight;
        }

        // Bonus clients VIP
        for (Client c : impactedClientSet) {
            weightedScore += (c.getSegment() == ClientSegment.VIP) ? 2 : 1;
        }

        // Normalisation en pourcentage
        // poids max théorique = (nbServices × 4 × 3) + (nbClients × 2)
        long totalServices = serviceRepository.count();
        long totalClients  = clientRepository.count();
        double maxPossible = (totalServices * 4 * 3) + (totalClients * 2);

        double impactScore = maxPossible > 0
                ? Math.min((weightedScore / maxPossible) * 100, 100)
                : 0.0;

        // Sévérité
        String severity;
        if (impactScore == 0)        severity = "NONE";
        else if (impactScore <= 25)  severity = "LOW";
        else if (impactScore <= 50)  severity = "MEDIUM";
        else if (impactScore <= 75)  severity = "HIGH";
        else                         severity = "CRITICAL";

        // ── 7. Construire et retourner le DTO ────────────────
        ImpactDTO dto = new ImpactDTO();
        dto.setFailedServiceId(serviceId);
        dto.setFailedServiceName(failedService.getName());
        dto.setImpactedServices(impactedServiceNames);
        dto.setImpactedClients(impactedClientSet.stream().map(Client::getName).toList());
        dto.setImpactScore(impactScore);
        dto.setTotalServicesImpacted(impactedServiceNames.size());
        dto.setTotalClientsImpacted(impactedClientSet.size());
        dto.setImpactPaths(impactPaths);
        dto.setSeverity(severity);

        return dto;
    }
}




