package com.example.impactanalyzer.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="admin")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(unique = true ,nullable = false)
    private String username;

    @Column(unique = true ,nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

}
