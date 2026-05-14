package com.example.impactanalyzer.controller;

import com.example.impactanalyzer.dto.AuthResponseDTO;
import com.example.impactanalyzer.dto.LoginRequestDTO;
import com.example.impactanalyzer.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

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
}
