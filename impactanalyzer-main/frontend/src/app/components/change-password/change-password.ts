import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
//import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth';


@Component({
  selector: 'app-change-password',
  //imports: [],
  //templateUrl: './change-password.html',
  //styleUrl: './change-password.css',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="change-password-wrapper">
      <div class="change-password-card">
        <div class="card-header">
          <div class="card-icon">🔐</div>
          <h2>Changer mon mot de passe</h2>
          <p>Administrateur : {{ username }}</p>
        </div>

        <div class="card-body">
          <div class="input-group">
            <label>Ancien mot de passe</label>
            <input type="password" [(ngModel)]="oldPassword" placeholder="Entrez votre mot de passe actuel">
          </div>

          <div class="input-group">
            <label>Nouveau mot de passe</label>
            <input type="password" [(ngModel)]="newPassword" placeholder="Nouveau mot de passe (min. 4 caractères)">
          </div>

          <div class="input-group">
            <label>Confirmer le mot de passe</label>
            <input type="password" [(ngModel)]="confirmPassword" placeholder="Confirmez le nouveau mot de passe">
          </div>

          <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
          <div *ngIf="successMessage" class="success-message">{{ successMessage }}</div>

          <div class="button-group">
            <button class="btn-primary" (click)="changePassword()" [disabled]="isLoading">
              {{ isLoading ? 'Chargement...' : 'Changer le mot de passe' }}
            </button>
            <button class="btn-secondary" (click)="cancel()">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .change-password-wrapper {
      min-height: 100vh;
      background: #05070A;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .change-password-card {
      background: rgba(15, 20, 30, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 480px;
    }
    .card-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .card-icon { font-size: 48px; margin-bottom: 16px; }
    .card-header h2 { font-size: 24px; font-weight: 700; color: #00FFFF; margin: 0 0 8px 0; }
    .card-header p { color: #64748B; font-size: 14px; margin: 0; }
    .input-group { margin-bottom: 20px; }
    .input-group label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: #E8EDF2; }
    .input-group input {
      width: 100%;
      padding: 12px 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      font-size: 14px;
      color: #E8EDF2;
      box-sizing: border-box;
    }
    .input-group input:focus { outline: none; border-color: #00FFFF; }
    .error-message {
      background: rgba(239,68,68,0.15);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #F87171;
      text-align: center;
    }
    .success-message {
      background: rgba(34,197,94,0.15);
      border: 1px solid rgba(34,197,94,0.3);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #4ADE80;
      text-align: center;
    }
    .button-group { display: flex; gap: 16px; margin-top: 24px; }
    .btn-primary {
      flex: 1;
      background: linear-gradient(135deg, #00FFFF, #FF00FF);
      border: none;
      border-radius: 40px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      color: #000;
      cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 40px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      color: #E8EDF2;
      cursor: pointer;
    }
  `]
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
    this.username = this.authService.getUsername() || 'Admin';
  }

  changePassword(): void {
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

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.changePassword({
      oldPassword: this.oldPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.successMessage = 'Mot de passe changé avec succès ! Redirection...';
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.error || 'Erreur lors du changement.';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
