package com.example.impactanalyzer.dto;



import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ImportResultDTO {

    private int imported;           // lignes importées avec succès
    private int errors;             // lignes avec erreurs
    private int skipped;            // lignes ignorées (doublons)
    private List<String> errorMessages;  // détail des erreurs
}