import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-service',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div style="max-width: 500px; margin: 20px auto; padding: 20px;">
      <div style="margin-bottom: 20px;">
        <a routerLink="/services" style="color: #3B82F6; text-decoration: none;"
          >← Retour à la liste</a
        >
      </div>
      <div
        style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
      >
        <h2>➕ Ajouter un service</h2>
        <input
          [(ngModel)]="name"
          placeholder="Nom du service"
          style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px;"
        />
        <input
          [(ngModel)]="description"
          placeholder="Description"
          style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px;"
        />
        <button
          (click)="save()"
          [disabled]="!name"
          style="background: #10B981; color: white; border: none; padding: 10px; width: 100%; border-radius: 6px; cursor: pointer;"
        >
          Enregistrer
        </button>
      </div>
    </div>
  `,
})
export class AddServiceComponent {
  name = '';
  description = '';

  constructor(private router: Router) {}

  save(): void {
    fetch('http://localhost:8080/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: this.name, description: this.description, status: 'UP' }),
    })
      .then(() => {
        this.router.navigate(['/services']);
      })
      .catch((err) => console.error(err));
  }
}
