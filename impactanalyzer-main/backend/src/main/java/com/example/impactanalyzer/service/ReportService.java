package com.example.impactanalyzer.service;

import com.example.impactanalyzer.dto.BlastRadiusDTO;
import com.example.impactanalyzer.dto.ServiceRiskDTO;
import com.example.impactanalyzer.entity.*;
import com.example.impactanalyzer.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ReportService {

    @Autowired private ServiceRepository        serviceRepository;
    @Autowired private DependencyRepository     dependencyRepository;
    @Autowired private ClientServiceRepository  clientServiceRepository;
    @Autowired private ClientRepository         clientRepository;

    // ── Rapport 1 : Top Services Critiques ─────────────
    public List<ServiceRiskDTO> getTopCriticalServices() {

        List<Dependency> allDeps = dependencyRepository.findAll();
        List<ServiceEntity> allServices = serviceRepository.findAll();

        // Compter les dépendances entrantes et sortantes
        Map<Long, Integer> incomingDeps = new HashMap<>();  // services qui dépendent de X
        Map<Long, Integer> outgoingDeps = new HashMap<>();  // services dont X dépend

        for (Dependency d : allDeps) {

            // Sécurité contre les dépendances incomplètes
            if (d.getDependsOn() == null || d.getService() == null) {
                continue;
            }

            Long from = d.getDependsOn().getId(); // source : service utilisé
            Long to   = d.getService().getId();   // destination : service dépendant


            incomingDeps.merge(from, 1, Integer::sum);
            outgoingDeps.merge(to, 1, Integer::sum);
        }

        long totalServices = serviceRepository.count();

        long maxIncomingDeps = Math.max(totalServices - 1, 0);

        List<ServiceRiskDTO> result = new ArrayList<>();

        for (ServiceEntity svc : allServices) {

            int depCount  = incomingDeps.getOrDefault(svc.getId(), 0);
            int dependsOn = outgoingDeps.getOrDefault(svc.getId(), 0);

            // Calcul du poids selon le tier du service
            int tierWeight = switch (svc.getTier()) {
                case CRITICAL -> 40;
                case HIGH     -> 30;
                case MEDIUM   -> 20;
                case LOW      -> 10;
            };

            double depScore = maxIncomingDeps > 0
                    ? (depCount / (double) maxIncomingDeps) * 40
                    : 0.0;

            // Bonus si le service est DOWN
            int downBonus = (svc.getStatus() != null &&
                    svc.getStatus().toString().equals("DOWN")) ? 20 : 0;

            // Score de risque final limité à 100
            double riskScore = Math.min(tierWeight + depScore + downBonus, 100);

            // Niveau de risque
            String riskLevel;
            if      (riskScore >= 75) riskLevel = "CRITICAL";
            else if (riskScore >= 50) riskLevel = "HIGH";
            else if (riskScore >= 30) riskLevel = "MEDIUM";
            else                      riskLevel = "LOW";

            ServiceRiskDTO dto = new ServiceRiskDTO();
            dto.setId(svc.getId());
            dto.setName(svc.getName());
            dto.setTier(svc.getTier().toString());
            dto.setStatus(svc.getStatus() != null
                    ? svc.getStatus().toString()
                    : "UNKNOWN");
            dto.setOwnerTeam(svc.getOwnerTeam());

            // Nombre de services qui dépendent de ce service
            dto.setDependencyCount(depCount);

            // Nombre de services dont ce service dépend
            dto.setDependsOnCount(dependsOn);

            dto.setRiskScore(Math.round(riskScore * 10.0) / 10.0);
            dto.setRiskLevel(riskLevel);

            result.add(dto);
        }

        // Trier par score de risque décroissant
        result.sort((a, b) -> Double.compare(b.getRiskScore(), a.getRiskScore()));

        return result;
    }

    // ── Rapport 2 : Blast Radius par service ───────────
    public List<BlastRadiusDTO> getBlastRadiusReport() {

        List<ServiceEntity> allServices = serviceRepository.findAll();
        List<Dependency> allDeps = dependencyRepository.findAll();
        List<ClientService> allClientServices = clientServiceRepository.findAll();

        long totalServices = serviceRepository.count();
        long maxImpactedServices = Math.max(totalServices - 1, 0);

        // Construire le graphe une seule fois
        Map<Long, List<Long>> graph = new HashMap<>();

        for (Dependency d : allDeps) {

            // Sécurité contre les dépendances incomplètes
            if (d.getDependsOn() == null || d.getService() == null) {
                continue;
            }

            Long from = d.getDependsOn().getId();
            Long to   = d.getService().getId();

            graph.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
        }

        List<BlastRadiusDTO> result = new ArrayList<>();

        for (ServiceEntity svc : allServices) {

            // BFS depuis ce service
            Set<Long> visited = new HashSet<>();
            Queue<Long> queue = new LinkedList<>();

            queue.add(svc.getId());
            visited.add(svc.getId());

            while (!queue.isEmpty()) {
                Long current = queue.poll();

                for (Long neighbor : graph.getOrDefault(current, List.of())) {
                    if (!visited.contains(neighbor)) {
                        visited.add(neighbor);
                        queue.add(neighbor);
                    }
                }
            }

            visited.remove(svc.getId());

            // Clients impactés
            Set<Long> impactedClientIds = new HashSet<>();

            for (ClientService cs : allClientServices) {

                if (cs.getService() == null || cs.getClient() == null) {
                    continue;
                }

                Long csServiceId = cs.getService().getId();

                /*
                 Un client est impacté si :
                 - il utilise le service en panne
                 - ou il utilise un service impacté
                */
                if (visited.contains(csServiceId) ||
                        csServiceId.equals(svc.getId())) {
                    impactedClientIds.add(cs.getClient().getId());
                }
            }
            double score = maxImpactedServices > 0
                    ? Math.min((visited.size() / (double) maxImpactedServices) * 100, 100)
                    : 0.0;

            String severity;
            if      (score == 0)  severity = "NONE";
            else if (score <= 25) severity = "LOW";
            else if (score <= 50) severity = "MEDIUM";
            else if (score <= 75) severity = "HIGH";
            else                  severity = "CRITICAL";

            BlastRadiusDTO dto = new BlastRadiusDTO();
            dto.setServiceId(svc.getId());
            dto.setServiceName(svc.getName());
            dto.setTier(svc.getTier().toString());
            dto.setStatus(svc.getStatus() != null
                    ? svc.getStatus().toString()
                    : "UNKNOWN");
            dto.setImpactedServicesCount(visited.size());
            dto.setImpactedClientsCount(impactedClientIds.size());
            dto.setBlastRadiusScore(Math.round(score * 10.0) / 10.0);
            dto.setSeverity(severity);

            result.add(dto);
        }
        // Trier par blast radius décroissant
        result.sort((a, b) ->
                Double.compare(b.getBlastRadiusScore(), a.getBlastRadiusScore()));

        return result;
    }
}