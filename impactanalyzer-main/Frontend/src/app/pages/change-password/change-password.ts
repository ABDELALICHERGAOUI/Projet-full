import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';

import { AuthService } from '../../services/auth';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        PasswordModule,
        DividerModule
    ],
    templateUrl: './change-password.html',
    styleUrl: './change-password.css'
})
export class ChangePassword {
    oldPassword = '';
    newPassword = '';
    confirmPassword = '';

    errorMessage = '';
    successMessage = '';
    isLoading = false;

    username = '';

    constructor(
        private authService: AuthService,
        private apiService: ApiService,
        private router: Router
    ) {
        this.username = this.authService.getUsername() || 'admin';
    }

    changePassword(): void {
        this.errorMessage = '';
        this.successMessage = '';

        if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
            this.errorMessage = 'Tous les champs sont obligatoires.';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.errorMessage = 'Les nouveaux mots de passe ne correspondent pas.';
            return;
        }

        if (this.newPassword.length < 4) {
            this.errorMessage = 'Le mot de passe doit contenir au moins 4 caractères.';
            return;
        }

        if (this.oldPassword === this.newPassword) {
            this.errorMessage = 'Le nouveau mot de passe doit être différent de l’ancien.';
            return;
        }

        this.isLoading = true;

        this.apiService.changePassword({
            oldPassword: this.oldPassword,
            newPassword: this.newPassword
        }).subscribe({
            next: () => {
                this.isLoading = false;
                this.successMessage = 'Mot de passe changé avec succès. Vous allez être redirigé vers la page de connexion.';

                setTimeout(() => {
                    this.authService.logout();
                    this.router.navigate(['/auth/login']);
                }, 2000);
            },
            error: (err: any) => {
                this.isLoading = false;
                this.errorMessage =
                    err.error?.message ||
                    err.error ||
                    'Erreur lors du changement du mot de passe.';
            }
        });
    }

    cancel(): void {
        this.router.navigate(['/pages/dashboard']);
    }
}
