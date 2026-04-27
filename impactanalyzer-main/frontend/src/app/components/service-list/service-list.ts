import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div style="padding: 20px;">
      <!-- Bouton Ajouter -->
      <div style="margin-bottom: 20px; text-align: right;">
        <a
          routerLink="/services/add"
          style="background: #3B82F6; color: white; text-decoration: none; padding: 10px 15px; border-radius: 6px; display: inline-block;"
        >
          ➕ Ajouter un service
        </a>
      </div>

      <h2>📋 Liste des services</h2>

      <!-- Tableau -->
      <table
        style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
      >
        <thead>
          <tr style="background: #F3F4F6; border-bottom: 1px solid #E5E7EB;">
            <th style="padding: 12px; text-align: left;">ID</th>
            <th style="padding: 12px; text-align: left;">Nom</th>
            <th style="padding: 12px; text-align: left;">Description</th>
            <th style="padding: 12px; text-align: left;">Status</th>
            <th style="padding: 12px; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let service of services" style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 10px;">{{ service.id }}</td>
            <td style="padding: 10px;">{{ service.name }}</td>
            <td style="padding: 10px;">{{ service.description }}</td>
            <td style="padding: 10px;">
              <span
                [style.color]="service.status === 'UP' ? 'green' : 'red'"
                style="font-weight: 500;"
              >
                {{ service.status }}
              </span>
            </td>
            <td style="padding: 10px; text-align: center;">
              <button
                (click)="openEdit(service)"
                style="background: #F59E0B; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-right: 5px; cursor: pointer;"
              >
                ✏️ Modifier
              </button>
              <button
                (click)="deleteService(service.id)"
                style="background: #EF4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;"
              >
                🗑️ Supprimer
              </button>
            </td>
          </tr>
          <tr *ngIf="services.length === 0">
            <td colspan="5" style="text-align: center; padding: 40px; color: #6B7280;">
              Aucun service trouvé
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Carte de modification (affichée en dessous du tableau) -->
      <div
        *ngIf="editService"
        style="margin-top: 20px; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #F59E0B;"
      >
        <h3 style="margin: 0 0 15px 0;">✏️ Modifier : {{ editService.name }}</h3>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <input
            [(ngModel)]="editService.name"
            placeholder="Nom"
            style="flex: 2; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
          />
          <input
            [(ngModel)]="editService.description"
            placeholder="Description"
            style="flex: 3; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
          />
          <button
            (click)="updateService()"
            style="background: #10B981; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer;"
          >
            💾 Enregistrer
          </button>
          <button
            (click)="cancelEdit()"
            style="background: #6B7280; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer;"
          >
            ❌ Annuler
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ServiceListComponent implements OnInit {
  services: any[] = [];
  editService: any = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    fetch('http://localhost:8080/services')
      .then((res) => res.json())
      .then((data) => {
        this.services = data;
        this.cdr.detectChanges();
      })
      .catch((err) => console.error(err));
  }

  deleteService(id: number): void {
    if (confirm('Supprimer ce service ?')) {
      fetch(`http://localhost:8080/services/${id}`, { method: 'DELETE' })
        .then(() => this.loadServices())
        .catch((err) => console.error(err));
    }
  }

  openEdit(service: any): void {
    // Copie du service pour modification
    this.editService = { ...service };
  }

  updateService(): void {
    if (!this.editService) return;
    fetch(`http://localhost:8080/services/${this.editService.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: this.editService.name,
        description: this.editService.description,
      }),
    })
      .then(() => {
        this.editService = null;
        this.loadServices();
      })
      .catch((err) => console.error(err));
  }

  cancelEdit(): void {
    this.editService = null;
  }
}
