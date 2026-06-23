package com.example.impactanalyzer.service;

import com.example.impactanalyzer.dto.ImportResultDTO;
import com.example.impactanalyzer.entity.Client;
import com.example.impactanalyzer.enums.ClientSegment;
import com.example.impactanalyzer.repository.ClientRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClientServiceImpl {


    private final ClientRepository repository;
    private static final String[] REQUIRED_HEADERS =
            {"name", "email", "segment", "region"};

    public ClientServiceImpl(ClientRepository repository) {
        this.repository = repository;
    }


    public List<Client> getAllClients() {
        return repository.findAll();
    }

    public Client getClientById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'id: " + id));
    }

    public Client createClient(Client client) {
        if (client.getName() == null || client.getName().trim().isEmpty()) {
            throw new RuntimeException("Le nom du client est obligatoire");
        }
        if(repository.existsByEmail(client.getEmail())){
            throw new RuntimeException("Email already exists");
        }
        return repository.save(client);
    }

    public Client updateClient(Long id, Client clientDetails) {
        Client client = getClientById(id);
        if (clientDetails.getName() != null && !clientDetails.getName().trim().isEmpty()) {
            client.setName(clientDetails.getName());
        }
        if (clientDetails.getEmail() != null) {
            client.setEmail(clientDetails.getEmail());
        }
        if(clientDetails.getSegment() != null) {
            client.setSegment(clientDetails.getSegment());
        }
        if(clientDetails.getRegion() != null) {
            client.setRegion(clientDetails.getRegion());
        }
        return repository.save(client);
    }

    public void deleteClient(Long id) {
        Client client = getClientById(id);
        repository.delete(client);
    }
    public void deleteAllById(List<Long> ids) {
        repository.deleteAllById(ids);
    }


    // ── Import CSV ────────────────────────────────────

    /**
     * Importe des clients depuis un fichier CSV MultipartFile.
     * Le backend parse entièrement le CSV, valide chaque ligne,
     * gère les doublons et convertit les enums avant persistance JPA.
     *
     * Format attendu du CSV :
     *   name,email,segment,region
     *   BNP Paribas,bnp@bnp.fr,VIP,France
     */
    public ImportResultDTO importClientsFromCsv(MultipartFile file) {

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

        // ── Lecture du fichier ligne par ligne ────────
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        file.getInputStream(), StandardCharsets.UTF_8))) {

            // Ligne 1 = headers
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.trim().isEmpty()) {
                errorMessages.add("Le fichier CSV est vide (pas de headers).");
                return new ImportResultDTO(0, 1, 0, errorMessages);
            }

            // Nettoyer les headers (supprimer BOM UTF-8 si présent)
            headerLine = headerLine.replace("\uFEFF", "").trim();

            // Parser les headers
            String[] headers = headerLine.split(",");
            for (int i = 0; i < headers.length; i++) {
                headers[i] = headers[i].trim().toLowerCase()
                        .replace("\"", "");
            }

            // ── Validation des colonnes obligatoires ──
            List<String> headerList = List.of(headers);
            for (String required : REQUIRED_HEADERS) {
                if (!headerList.contains(required)) {
                    errorMessages.add(
                            "Colonne manquante : '" + required + "'. "
                                    + "Colonnes attendues : name, email, segment, region");
                    return new ImportResultDTO(0, 1, 0, errorMessages);
                }
            }

            // Index de chaque colonne
            int idxName    = headerList.indexOf("name");
            int idxEmail   = headerList.indexOf("email");
            int idxSegment = headerList.indexOf("segment");
            int idxRegion  = headerList.indexOf("region");

            // ── Traitement ligne par ligne ────────────
            String line;
            int lineNumber = 2; // commence à 2 (ligne 1 = headers)

            while ((line = reader.readLine()) != null) {

                // Ignorer les lignes vides
                line = line.trim();
                if (line.isEmpty()) {
                    lineNumber++;
                    continue;
                }

                try {
                    // Parser les valeurs de la ligne
                    String[] values = line.split(",", -1);
                    for (int i = 0; i < values.length; i++) {
                        values[i] = values[i].trim().replace("\"", "");
                    }

                    // ── Extraction des champs ─────────
                    String name = getValueSafe(values, idxName);
                    String email = getValueSafe(values, idxEmail);
                    String segment = getValueSafe(values, idxSegment);
                    String region = getValueSafe(values, idxRegion);

                    // ── Validation champs obligatoires ─
                    if (name.isEmpty()) {
                        errorMessages.add(
                                "Ligne " + lineNumber + " : nom vide — ignorée");
                        errors++;
                        lineNumber++;
                        continue;
                    }

                    if (email.isEmpty()) {
                        errorMessages.add(
                                "Ligne " + lineNumber + " : email vide — ignorée");
                        errors++;
                        lineNumber++;
                        continue;
                    }

                    // ── Vérification doublon email ────
                    if (repository.existsByEmail(email)) {
                        errorMessages.add(
                                "Ligne " + lineNumber
                                        + " : email '" + email + "' déjà existant — ignorée");
                        skipped++;
                        lineNumber++;
                        continue;
                    }

                    // ── Conversion enum segment ───────
                    ClientSegment clientSegment;
                    try {
                        clientSegment = ClientSegment.valueOf(
                                segment.toUpperCase().trim());
                    } catch (IllegalArgumentException e) {
                        // Valeur par défaut si segment invalide
                        clientSegment = ClientSegment.STANDARD;
                        errorMessages.add(
                                "Ligne " + lineNumber
                                        + " : segment '" + segment
                                        + "' invalide → STANDARD utilisé par défaut");
                    }

                    // ── Création et sauvegarde ────────
                    Client client = new Client();
                    client.setName(name);
                    client.setEmail(email);
                    client.setSegment(clientSegment);
                    client.setRegion(region.isEmpty() ? "N/A" : region);

                    repository.save(client);
                    imported++;

                } catch (Exception e) {
                    errorMessages.add(
                            "Ligne " + lineNumber + " : " + e.getMessage());
                    errors++;
                }

                lineNumber++;
            }
            } catch (IOException e) {
                errorMessages.add("Erreur lors de la lecture du fichier : " + e.getMessage());
                return new ImportResultDTO(0, 1, 0, errorMessages);
            }


        return new ImportResultDTO(imported, errors, skipped, errorMessages);
    }

    // ── Utilitaire ────────────────────────────────────

    private String getValueSafe(String[] values, int index) {
        if (index < 0 || index >= values.length) return "";
        return values[index] == null ? "" : values[index].trim();
    }
}