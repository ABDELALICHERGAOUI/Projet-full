import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Service } from '../../models/service.model';

@Component({
  selector: 'app-add-dependency',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Bouton Retour à la liste (rouge clair, aligné à droite) -->
      <div style="margin-bottom: 20px; text-align: right;">
        <a
          routerLink="/dependencies"
          style="background: #EF4444; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; display: inline-block; font-size: 0.85rem;"
        >
          ← Retour à la liste
        </a>
      </div>

      <div
        style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
      >
        <h2 style="margin-top: 0;">🔗 Ajouter une dépendance</h2>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500;">Service *</label>
          <select
            [(ngModel)]="selectedServiceId"
            style="width: 100%; padding: 10px; border: 1px solid #D1D5DB; border-radius: 6px;"
          >
            <option [value]="null">-- Sélectionner un service --</option>
            <option *ngFor="let service of services" [value]="service.id">
              {{ service.name }} (ID: {{ service.id }})
            </option>
          </select>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500;">Dépend de *</label>
          <select
            [(ngModel)]="selectedDependsOnId"
            style="width: 100%; padding: 10px; border: 1px solid #D1D5DB; border-radius: 6px;"
          >
            <option [value]="null">-- Sélectionner un service --</option>
            <option *ngFor="let service of services" [value]="service.id">
              {{ service.name }} (ID: {{ service.id }})
            </option>
          </select>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 500;"
            >Poids d'impact (1-10)</label
          >
          <input
            type="number"
            [(ngModel)]="impactWeight"
            min="1"
            max="10"
            style="width: 100%; padding: 10px; border: 1px solid #D1D5DB; border-radius: 6px;"
          />
        </div>

        <div style="display: flex; gap: 10px;">
          <button
            (click)="addDependency()"
            [disabled]="!isFormValid()"
            style="background: #3B82F6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;"
          >
            💾 Enregistrer
          </button>
          <button
            (click)="cancel()"
            style="background: #9CA3AF; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;"
          >
            ❌ Annuler
          </button>
        </div>

        <div
          *ngIf="message"
          [style.color]="messageError ? 'red' : 'green'"
          style="margin-top: 15px;"
        >
          {{ message }}
        </div>
      </div>
    </div>
  `,
})
export class AddDependencyComponent implements OnInit {
  services: Service[] = [];
  selectedServiceId: number | null = null;
  selectedDependsOnId: number | null = null;
  impactWeight: number = 5;
  message: string = '';
  messageError: boolean = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.services = data;
      },
      error: (err) => console.error('Erreur:', err),
    });
  }

  isFormValid(): boolean {
    return (
      this.selectedServiceId !== null &&
      this.selectedDependsOnId !== null &&
      this.selectedServiceId !== this.selectedDependsOnId
    );
  }

  addDependency(): void {
    if (!this.isFormValid()) return;

    const newDependency = {
      service: { id: this.selectedServiceId },
      dependsOn: { id: this.selectedDependsOnId },
      impactWeight: this.impactWeight,
    };

    this.apiService.createDependency(newDependency).subscribe({
      next: () => {
        this.message = '✅ Dépendance ajoutée avec succès !';
        this.messageError = false;
        setTimeout(() => this.router.navigate(['/dependencies']), 1500);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.message = '❌ Erreur: ' + (err.error?.message || err.message);
        this.messageError = true;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/dependencies']);
  }
}
