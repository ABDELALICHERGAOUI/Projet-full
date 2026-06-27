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
        Map<Long, List<Long>> graph = new HashMap<>();
        Map<String, DependencyCriticality> edgeCriticality = new HashMap<>();

        for (Dependency d : dependencyRepository.findAll()) {
            Long from = d.getDependsOn().getId();
            Long to   = d.getService().getId();
            graph.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
            edgeCriticality.put(from + "->" + to, d.getCriticality());
        }

        // ── 2. BFS — trouver TOUS les nœuds impactés ────────
        // BFS = file (Queue) → parcours niveau par niveau
        // Objectif : trouver quels services sont impactés
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
        visited.remove(serviceId); // retirer le service source

        // ── 3. DFS — trouver TOUS les chemins de propagation ─
        // DFS = récursion + backtracking → tous les chemins possibles
        // Objectif : comment la panne se propage exactement
        List<String> impactPaths = new ArrayList<>();
        List<List<Long>> allPaths = new ArrayList<>();

        dfsAllPaths(
                serviceId,
                new ArrayList<>(List.of(serviceId)),
                allPaths,
                graph,
                new HashSet<>(Set.of(serviceId))
        );

        // Convertir IDs → Noms pour chaque chemin
        for (List<Long> path : allPaths) {
            String pathStr = path.stream()
                    .map(id -> serviceRepository.findById(id)
                            .map(ServiceEntity::getName)
                            .orElse("Service#" + id))
                    .reduce((a, b) -> a + " → " + b)
                    .orElse("");
            if (!pathStr.isEmpty()) {
                impactPaths.add(pathStr);
            }
        }

        // ── 4. Services impactés (résultat BFS) ─────────────
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

// ── 6. Calcul du score pondéré ───────────────────────
// Formule : 50% gravité services + 30% clients + 20% propagation

        List<ServiceEntity> allServices = serviceRepository.findAll();
        List<Client> allClients = clientRepository.findAll();


// ✅ Dimension 1 — gravité des services impactés
// On calcule seulement les services impactés par propagation.
// Le service en panne est affiché séparément.
        double weightedImpacted = 0.0;

        for (ServiceEntity svc : impactedServiceEntities) {

            int tierWeight = switch (svc.getTier()) {
                case CRITICAL -> 4;
                case HIGH     -> 3;
                case MEDIUM   -> 2;
                case LOW      -> 1;
            };

            Long parentId = parent.get(svc.getId());

            int critWeight = 2; // MEDIUM par défaut

            if (parentId != null) {
                DependencyCriticality crit = edgeCriticality.getOrDefault(
                        parentId + "->" + svc.getId(),
                        DependencyCriticality.MEDIUM
                );

                critWeight = switch (crit) {
                    case HIGH   -> 3;
                    case MEDIUM -> 2;
                    case LOW    -> 1;
                };
            }

            weightedImpacted += tierWeight * critWeight;
        }


// ✅ Dénominateur basé sur les poids réels des services
        double weightedTotal = allServices.stream()
                .mapToDouble(s -> {
                    int tierWeight = switch (s.getTier()) {
                        case CRITICAL -> 4;
                        case HIGH     -> 3;
                        case MEDIUM   -> 2;
                        case LOW      -> 1;
                    };
                    return tierWeight * 3.0;
                })
                .sum();

        double dim1 = weightedTotal > 0
                ? Math.min((weightedImpacted / weightedTotal) * 100.0, 100.0)
                : 0.0;


// ✅ Dimension 2 — clients affectés
        double clientImpacted = impactedClientSet.stream()
                .mapToDouble(c -> c.getSegment() == ClientSegment.VIP ? 2.0 : 1.0)
                .sum();

        double clientMax = allClients.stream()
                .mapToDouble(c -> c.getSegment() == ClientSegment.VIP ? 2.0 : 1.0)
                .sum();

        double dim2 = clientMax > 0
                ? Math.min((clientImpacted / clientMax) * 100.0, 100.0)
                : 0.0;


// ✅ Dimension 3 — propagation
// visited contient seulement les services impactés, car serviceId a été retiré
        long totalServices = allServices.size();

        double dim3 = totalServices > 1
                ? Math.min(((double) visited.size() / (totalServices - 1)) * 100.0, 100.0)
                : 0.0;


// ✅ Score final pondéré
        double impactScore = (dim1 * 0.50) + (dim2 * 0.30) + (dim3 * 0.20);
        impactScore = Math.min(impactScore, 100.0);


// ✅ Cas spécial : aucun service et aucun client n'est impacté
        if (impactedServiceEntities.isEmpty() && impactedClientSet.isEmpty()) {
            impactScore = 0.0;
        }


// ✅ Sévérité
        String severity;
        if      (impactScore == 0)    severity = "NONE";
        else if (impactScore <= 25)   severity = "LOW";
        else if (impactScore <= 50)   severity = "MEDIUM";
        else if (impactScore <= 75)   severity = "HIGH";
        else                          severity = "CRITICAL";



        // ── 7. Construire le DTO ─────────────────────────────
        ImpactDTO dto = new ImpactDTO();
        dto.setFailedServiceId(serviceId);
        dto.setFailedServiceName(failedService.getName());
        dto.setImpactedServices(impactedServiceNames);
        dto.setImpactedClients(
                impactedClientSet.stream().map(Client::getName).toList()
        );
        dto.setImpactScore(Math.round(impactScore * 10.0) / 10.0);
        dto.setTotalServicesImpacted(impactedServiceNames.size());
        dto.setTotalClientsImpacted(impactedClientSet.size());
        dto.setImpactPaths(impactPaths);
        dto.setSeverity(severity);

        return dto;
    }

    // ── Méthode DFS récursive ────────────────────────────────
    // Trouve TOUS les chemins depuis 'current' jusqu'aux feuilles
    private void dfsAllPaths(
            Long current,
            List<Long> currentPath,
            List<List<Long>> allPaths,
            Map<Long, List<Long>> graph,
            Set<Long> visited
    ) {
        List<Long> neighbors = graph.getOrDefault(current, new ArrayList<>());

        // Cas d'arrêt : nœud feuille ou tous les voisins déjà visités
        boolean isLeaf = neighbors.isEmpty();
        boolean allVisited = neighbors.stream().allMatch(visited::contains);

        if (isLeaf || allVisited) {
            // Enregistrer le chemin seulement s'il a au moins 2 nœuds
            if (currentPath.size() > 1) {
                allPaths.add(new ArrayList<>(currentPath));
            }
            return;
        }

        // Récursion sur chaque voisin non visité
        for (Long neighbor : neighbors) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                currentPath.add(neighbor);

                dfsAllPaths(neighbor, currentPath, allPaths, graph, visited);

                // Backtracking — revenir en arrière
                currentPath.remove(currentPath.size() - 1);
                visited.remove(neighbor);
            }
        }
    }
}