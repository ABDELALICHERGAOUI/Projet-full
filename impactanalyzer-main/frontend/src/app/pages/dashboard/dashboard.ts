import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.2rem;">

        <!-- Carte Services -->
        <div routerLink="/services"
             style="cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 1.2rem; text-align: center; color: white; transition: transform 0.3s;">
          <i class="pi pi-server" style="font-size: 2rem;"></i>
          <h3 style="margin: 0.8rem 0 0.3rem; font-size: 1.1rem;">Services</h3>
          <p style="margin: 0; font-size: 0.8rem; opacity: 0.9;">Gérer les services</p>
          <div style="margin-top: 0.8rem; font-size: 0.8rem;">Accéder →</div>
        </div>

        <!-- Carte Dépendances -->
        <div routerLink="/dependencies"
             style="cursor: pointer; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 1.2rem; text-align: center; color: white; transition: transform 0.3s;">
          <i class="pi pi-link" style="font-size: 2rem;"></i>
          <h3 style="margin: 0.8rem 0 0.3rem; font-size: 1.1rem;">Dépendances</h3>
          <p style="margin: 0; font-size: 0.8rem; opacity: 0.9;">Gérer les dépendances</p>
          <div style="margin-top: 0.8rem; font-size: 0.8rem;">Accéder →</div>
        </div>

        <!-- Carte Services-Clients (décorative, pas encore active) -->
        <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 12px; padding: 1.2rem; text-align: center; color: white; opacity: 0.6;">
          <i class="pi pi-users" style="font-size: 2rem;"></i>
          <h3 style="margin: 0.8rem 0 0.3rem; font-size: 1.1rem;">Services-Clients</h3>
          <p style="margin: 0; font-size: 0.8rem; opacity: 0.9;">Bientôt disponible</p>
        </div>

        <!-- Carte Impact -->
        <div routerLink="/impact"
             style="cursor: pointer; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); border-radius: 12px; padding: 1.2rem; text-align: center; color: white; transition: transform 0.3s;">
          <i class="pi pi-chart-line" style="font-size: 2rem;"></i>
          <h3 style="margin: 0.8rem 0 0.3rem; font-size: 1.1rem;">Impact</h3>
          <p style="margin: 0; font-size: 0.8rem; opacity: 0.9;">Simulation d'impact</p>
          <div style="margin-top: 0.8rem; font-size: 0.8rem;">Accéder →</div>
        </div>

        <!-- Carte Clients -->
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; padding: 1.2rem; text-align: center; color: white; opacity: 0.6;">
          <i class="pi pi-user" style="font-size: 2rem;"></i>
          <h3 style="margin: 0.8rem 0 0.3rem; font-size: 1.1rem;">Clients</h3>
          <p style="margin: 0; font-size: 0.8rem; opacity: 0.9;">Bientôt disponible</p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    [routerLink]:hover {
      transform: translateY(-4px);
    }
  `]
})
export class DashboardComponent {}
