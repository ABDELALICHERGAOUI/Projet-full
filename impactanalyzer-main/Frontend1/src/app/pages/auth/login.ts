import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth'; // ✅ ton service

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        ButtonModule, CheckboxModule,
        InputTextModule, PasswordModule,
        MessageModule, RippleModule
    ],
    templateUrl: './login.component.html'
})
export class Login {
    username = '';   // ✅ ton champ (pas email)
    password = '';
    rememberMe = false;
    errorMessage = '';
    loading = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    login(): void {
        if (!this.username || !this.password) {
            this.errorMessage = 'Veuillez remplir tous les champs.';
            return;
        }
        this.loading = true;
        this.errorMessage = '';

        // ✅ ton AuthService branché ici
        this.authService.login(this.username, this.password).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/pages/client']);
            },
            error: () => {
                this.loading = false;
                this.errorMessage = "Nom d'utilisateur ou mot de passe incorrect.";
            }
        });
    }
}
