import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-impact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div style="padding: 20px;">
      <!-- Bouton Retour -->
      <div style="margin-bottom: 20px; text-align: right;">
        <a
          routerLink="/dashboard"
          style="background: #EF4444; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; display: inline-block;"
        >
          ← Retour au Dashboard
        </a>
      </div>

      <h3 style="margin-bottom: 20px;">⚡ Simulation d'impact</h3>

      <!-- Zone de sélection -->
      <div
        style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
      >
        <label style="display: block; margin-bottom: 5px; font-weight: 500;"
          >Choisir un service</label
        >
        <select
          [(ngModel)]="selectedServiceId"
          style="width: 100%; padding: 10px; border: 1px solid #D1D5DB; border-radius: 6px; margin-bottom: 15px;"
        >
          <option [value]="null">-- Sélectionner un service --</option>
          <option *ngFor="let service of services" [value]="service.id">
            {{ service.name }}
          </option>
        </select>
        <button
          (click)="simulateImpact()"
          [disabled]="!selectedServiceId || isLoading"
          style="background: #3B82F6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; width: 100%;"
        >
          {{ isLoading ? 'Chargement...' : 'Simuler' }}
        </button>
      </div>

      <!-- Résultats -->
      <div *ngIf="impactResult && !isLoading">
        <!-- Score -->
        <div
          style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
        >
          <h4 style="margin: 0 0 15px 0;">Score d'impact</h4>
          <div style="font-size: 3rem; font-weight: 700; color: #3B82F6;">{{ impactScore }}%</div>
          <div
            style="margin-top: 10px; padding: 5px 15px; border-radius: 20px; display: inline-block; background: {{
              getSeverityColor()
            }}; color: white;"
          >
            {{ severity }}
          </div>
          <div style="margin-top: 15px; font-size: 0.85rem; color: #6B7280;">
            Services impactés : {{ impactedServices.length }} / Total services :
            {{ totalServicesCount }}
          </div>
        </div>

        <!-- Services impactés -->
        <div
          style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
        >
          <h4 style="margin: 0 0 15px 0;">Services impactés ({{ impactedServices.length }})</h4>
          <div *ngIf="impactedServices.length === 0" style="color: #6B7280;">
            Aucun service impacté
          </div>
          <div
            *ngFor="let service of impactedServices"
            style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"
          >
            {{ service }}
          </div>
        </div>

        <!-- Clients impactés -->
        <div
          style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
        >
          <h4 style="margin: 0 0 15px 0;">Clients impactés ({{ impactedClients.length }})</h4>
          <div *ngIf="impactedClients.length === 0" style="color: #6B7280;">
            Aucun client impacté
          </div>
          <div
            *ngFor="let client of impactedClients"
            style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"
          >
            {{ client }}
          </div>
        </div>
      </div>

      <!-- Message initial -->
      <div
        *ngIf="!impactResult && !isLoading"
        style="text-align: center; padding: 40px; background: white; border-radius: 12px;"
      >
        <p>Sélectionnez un service et cliquez sur "Simuler"</p>
      </div>
    </div>
  `,
})
export class ImpactComponent implements OnInit {
  services: any[] = [];
  selectedServiceId: number | null = null;
  impactResult: any = null;
  isLoading: boolean = false;

  impactedServices: string[] = [];
  impactedClients: string[] = [];
  impactScore: number = 0;
  severity: string = '';
  totalServicesCount: number = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.services = data;
        this.totalServicesCount = data.length;
      },
      error: (err) => console.error('Erreur:', err),
    });
  }

  simulateImpact(): void {
    if (!this.selectedServiceId) return;

    this.isLoading = true;
    this.impactResult = null;

    this.apiService.simulateImpact(this.selectedServiceId).subscribe({
      next: (data) => {
        this.impactResult = data;
        this.impactScore = Math.round(data.impactScore || 0);
        this.severity = data.severity || this.getSeverityText(this.impactScore);
        this.impactedServices = data.impactedServices || [];
        this.impactedClients = data.impactedClients || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
      },
    });
  }

  getSeverityText(score: number): string {
    if (score === 0) return 'NONE';
    if (score <= 25) return 'LOW';
    if (score <= 50) return 'MEDIUM';
    if (score <= 75) return 'HIGH';
    return 'CRITICAL';
  }

  getSeverityColor(): string {
    if (this.impactScore === 0) return '#6B7280';
    if (this.impactScore <= 25) return '#10B981';
    if (this.impactScore <= 50) return '#F59E0B';
    if (this.impactScore <= 75) return '#F97316';
    return '#EF4444';
  }
}
