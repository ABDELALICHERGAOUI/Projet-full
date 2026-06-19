package com.example.impactanalyzer.service;

import com.example.impactanalyzer.dto.ImportResultDTO;
import com.example.impactanalyzer.entity.ServiceEntity;
import com.example.impactanalyzer.enums.ServiceStatus;
import com.example.impactanalyzer.enums.ServiceTier;
import com.example.impactanalyzer.repository.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class ServiceServiceImpl {

    private final ServiceRepository repository;
    private static final String[] REQUIRED_HEADERS =
            {"name", "description", "tier", "ownerteam", "sla", "status"};

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

    // ── Import CSV ────────────────────────────────────

    public ImportResultDTO importServicesFromCsv(MultipartFile file)
            throws IOException {

        List<String> errorMessages = new ArrayList<>();
        int imported = 0;
        int errors   = 0;
        int skipped  = 0;

        // ── Validation du fichier ─────────────────────
        if (file == null || file.isEmpty()) {
            errorMessages.add("Le fichier CSV est vide ou absent.");
            return new ImportResultDTO(0, 1, 0, errorMessages);
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            errorMessages.add("Le fichier doit être au format .csv");
            return new ImportResultDTO(0, 1, 0, errorMessages);
        }

        // ── Lecture ligne par ligne ───────────────────
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        file.getInputStream(), StandardCharsets.UTF_8))) {

            // Ligne 1 = headers
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.trim().isEmpty()) {
                errorMessages.add("Le fichier CSV est vide (pas de headers).");
                return new ImportResultDTO(0, 1, 0, errorMessages);
            }

            // Nettoyer BOM UTF-8 si présent
            headerLine = headerLine.replace("\uFEFF", "").trim();

            // Parser les headers en minuscules
            String[] headers = headerLine.split(",");
            for (int i = 0; i < headers.length; i++) {
                headers[i] = headers[i].trim()
                        .toLowerCase()
                        .replace("\"", "");
            }

            // ── Validation colonnes obligatoires ──────
            List<String> headerList = List.of(headers);
            for (String required : REQUIRED_HEADERS) {
                if (!headerList.contains(required)) {
                    errorMessages.add(
                            "Colonne manquante : '" + required + "'. "
                                    + "Colonnes attendues : "
                                    + "name, description, tier, ownerTeam, sla, status");
                    return new ImportResultDTO(0, 1, 0, errorMessages);
                }
            }

            // Index de chaque colonne
            int idxName        = headerList.indexOf("name");
            int idxDescription = headerList.indexOf("description");
            int idxTier        = headerList.indexOf("tier");
            int idxOwnerTeam   = headerList.indexOf("ownerteam");
            int idxSla         = headerList.indexOf("sla");
            int idxStatus      = headerList.indexOf("status");

            // ── Traitement ligne par ligne ────────────
            String line;
            int lineNumber = 2;

            while ((line = reader.readLine()) != null) {

                line = line.trim();
                if (line.isEmpty()) {
                    lineNumber++;
                    continue;
                }

                try {
                    // Parser les valeurs
                    String[] values = line.split(",", -1);
                    for (int i = 0; i < values.length; i++) {
                        values[i] = values[i].trim().replace("\"", "");
                    }

                    // ── Extraction des champs ─────────
                    String name        = getValueSafe(values, idxName);
                    String description = getValueSafe(values, idxDescription);
                    String tierStr     = getValueSafe(values, idxTier);
                    String ownerTeam   = getValueSafe(values, idxOwnerTeam);
                    String sla         = getValueSafe(values, idxSla);
                    String statusStr   = getValueSafe(values, idxStatus);

                    // ── Validation champ obligatoire ──
                    if (name.isEmpty()) {
                        errorMessages.add(
                                "Ligne " + lineNumber + " : nom vide — ignorée");
                        errors++;
                        lineNumber++;
                        continue;
                    }

                    // ── Vérification doublon par nom ──
                    if (repository.existsByName(name)) {
                        errorMessages.add(
                                "Ligne " + lineNumber
                                        + " : service '" + name
                                        + "' déjà existant — ignoré");
                        skipped++;
                        lineNumber++;
                        continue;
                    }

                    // ── Conversion enum ServiceTier ───
                    ServiceTier tier;
                    try {
                        tier = ServiceTier.valueOf(
                                tierStr.toUpperCase().trim());
                    } catch (IllegalArgumentException e) {
                        tier = ServiceTier.MEDIUM; // valeur par défaut
                        errorMessages.add(
                                "Ligne " + lineNumber
                                        + " : tier '" + tierStr
                                        + "' invalide → MEDIUM utilisé par défaut");
                    }

                    // ── Conversion enum ServiceStatus ─
                    ServiceStatus status;
                    try {
                        status = ServiceStatus.valueOf(
                                statusStr.toUpperCase().trim());
                    } catch (IllegalArgumentException e) {
                        status = ServiceStatus.UP; // valeur par défaut
                        errorMessages.add(
                                "Ligne " + lineNumber
                                        + " : status '" + statusStr
                                        + "' invalide → UP utilisé par défaut");
                    }

                    // ── Création et sauvegarde JPA ────
                    ServiceEntity service = new ServiceEntity();
                    service.setName(name);
                    service.setDescription(
                            description.isEmpty() ? "" : description);
                    service.setTier(tier);
                    service.setOwnerTeam(
                            ownerTeam.isEmpty() ? "N/A" : ownerTeam);
                    service.setSla(sla.isEmpty() ? "99.0" : sla);
                    service.setStatus(status);

                    repository.save(service);
                    imported++;

                } catch (Exception e) {
                    errorMessages.add(
                            "Ligne " + lineNumber + " : " + e.getMessage());
                    errors++;
                }

                lineNumber++;
            }
        }

        return new ImportResultDTO(imported, errors, skipped, errorMessages);
    }

    // ── Utilitaire ────────────────────────────────────

    private String getValueSafe(String[] values, int index) {
        if (index < 0 || index >= values.length) return "";
        return values[index] == null ? "" : values[index].trim();
    }
}


