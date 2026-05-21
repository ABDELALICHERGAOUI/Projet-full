package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.AuthResponseDTO;
import com.example.impactanalyzer.dto.ChangePasswordRequestDTO;
import com.example.impactanalyzer.dto.LoginRequestDTO;
import com.example.impactanalyzer.entity.Admin;
import com.example.impactanalyzer.repository.AdminRepository;
import com.example.impactanalyzer.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        try{
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
        }catch(AuthenticationException e){
            return ResponseEntity.status(401).body("Nom d'utilisateur ou mot de passe incorrect");
        }
        String token = jwtService.generateToken(request.getUsername());
        return ResponseEntity.ok(new AuthResponseDTO(token, request.getUsername()));
    }
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequestDTO request,
            Authentication authentication) {  // ← Spring injecte ça automatiquement

        // Le username est déjà disponible grâce à JwtFilter
        String username = authentication.getName();

        Optional<Admin> adminOptional = adminRepository.findByUsername(username);
        if (adminOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Utilisateur non trouvé"));
        }

        Admin admin = adminOptional.get();

        // Vérifier l'ancien mot de passe
        if (!passwordEncoder.matches(request.getOldPassword(), admin.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Ancien mot de passe incorrect"));
        }

        // Vérifier la longueur du nouveau mot de passe
        if (request.getNewPassword() == null || request.getNewPassword().length() < 4) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Le nouveau mot de passe doit contenir au moins 4 caractères"));
        }

        // Mettre à jour
        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        adminRepository.save(admin);

        return ResponseEntity.ok(Map.of("message", "Mot de passe changé avec succès"));
    }
}
