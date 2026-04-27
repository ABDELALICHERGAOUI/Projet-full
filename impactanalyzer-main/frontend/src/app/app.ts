import { Component } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <div style="display: flex; min-height: 100vh; flex-direction: column;">
      <!-- Header commun (toujours visible) -->
      <div
        style="background: #0f172a; padding: 1rem 2rem; color: white; border-bottom: 1px solid #1e293b;"
      >
        <div style="max-width: 1400px; margin: 0 auto;">
          <h1 style="margin: 0; font-size: 1.2rem; font-weight: 500;">
            Smart Dependency Impact Analyzer
          </h1>
          <p style="margin: 0.2rem 0 0 0; font-size: 0.7rem; color: #64748b;">
            Gestion des dépendances & simulation d'impact
          </p>
        </div>
      </div>

      <!-- Corps avec sidebar (sauf sur dashboard) -->
      <div style="display: flex; flex: 1;">
        <!-- Sidebar : affichée seulement si on n'est pas sur le dashboard -->
        <div
          *ngIf="!isDashboard"
          style="width: 260px; background: #1e293b; color: white; display: flex; flex-direction: column;"
        >
          <nav style="flex: 1; padding: 20px 0;">
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #94a3b8; text-decoration: none; transition: all 0.3s;"
            >
              <i class="pi pi-home"></i>
              <span>Dashboard</span>
            </a>

            <a
              routerLink="/services"
              routerLinkActive="active"
              style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #94a3b8; text-decoration: none; transition: all 0.3s;"
            >
              <i class="pi pi-server"></i>
              <span>Services</span>
            </a>

            <a
              routerLink="/dependencies"
              routerLinkActive="active"
              style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #94a3b8; text-decoration: none; transition: all 0.3s;"
            >
              <i class="pi pi-link"></i>
              <span>Dépendances</span>
            </a>

            <a
              routerLink="/impact"
              routerLinkActive="active"
              style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #94a3b8; text-decoration: none; transition: all 0.3s;"
            >
              <i class="pi pi-chart-line"></i>
              <span>Impact</span>
            </a>
          </nav>

          <div
            style="padding: 20px; border-top: 1px solid #334155; font-size: 0.7rem; color: #475569;"
          >
            v1.0
          </div>
        </div>

        <!-- Main Content -->
        <div style="flex: 1; background: #f8fafc; overflow: auto; padding: 20px;">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .active {
        background: #334155 !important;
        color: white !important;
        border-left: 3px solid #3b82f6;
      }
      a:hover {
        background: #334155;
        color: white;
      }
    `,
  ],
})
export class AppComponent {
  isDashboard = false;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isDashboard = event.url === '/' || event.url === '/dashboard';
      }
    });
  }
}
