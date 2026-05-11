package com.example.impactanalyzer.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtService {

        // Clé secrète — minimum 32 caractères pour HS256
        private final String SECRET = "sdia_secret_key_nttdata_2024_very_long";
        private final long EXPIRATION_MS = 86400000L; // 24 heures

        private Key getKey() {
            return Keys.hmacShaKeyFor(SECRET.getBytes());
        }

        // Génère un token JWT pour un username donné
        public String generateToken(String username) {
            return Jwts.builder()
                    .setSubject(username)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                    .signWith(getKey(), SignatureAlgorithm.HS256)
                    .compact();
        }

        // Extrait le username depuis le token
        public String extractUsername(String token) {
            return Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        }

        // Vérifie si le token est valide
        public boolean isTokenValid(String token) {
            try {
                Jwts.parserBuilder().setSigningKey(getKey()).build().parseClaimsJws(token);
                return true;
            } catch (JwtException | IllegalArgumentException e) {
                return false;
            }
        }
    }