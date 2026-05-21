import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  services: any[] = [];
  clients: any[] = [];
  dependencies: any[] = [];
  clientServices: any[] = [];
  isLoading = true;
  currentDate = new Date();

  previewServiceId: number | null = null;
  impactPreviewScore: number | null = null;

  kpiCards: any[] = [];

  constructor(
      private apiService: ApiService,
      private cdr: ChangeDetectorRef,
      private authService: AuthService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadAll(): void {
    this.isLoading = true;
    let loaded = 0;
    const total = 4;
    const done = (): void => {
      loaded++;
      if (loaded === total) {
        this.isLoading = false;
        this.buildKpiCards();
        this.cdr.detectChanges();
      }
    };

    this.apiService.getServices().subscribe({
      next: (data: any[]) => { this.services = data; done(); },
      error: () => done(),
    });

    this.apiService.getAllClients().subscribe({
      next: (data: any[]) => { this.clients = data; done(); },
      error: () => done(),
    });

    this.apiService.getDependencies().subscribe({
      next: (data: any[]) => { this.dependencies = data; done(); },
      error: () => done(),
    });

    this.apiService.getAllClientServices().subscribe({
      next: (data: any[]) => { this.clientServices = data; done(); },
      error: () => done(),
    });
  }

  loadImpactPreview(): void {
    if (!this.previewServiceId) return;
    this.apiService.simulateImpact(this.previewServiceId).subscribe({
      next: (data: any) => {
        this.impactPreviewScore = Math.round(data.impactScore || 0);
        this.cdr.detectChanges();
      },
      error: () => {
        this.impactPreviewScore = null;
      },
    });
  }

  buildKpiCards(): void {
    this.kpiCards = [
      {
        icon: '⚙',
        label: 'SERVICES',
        value: this.services.length,
        sub: 'actifs',
        trend: this.services.length,
      },
      {
        icon: '👥',
        label: 'CLIENTS',
        value: this.clients.length,
        sub: 'enregistrés',
        trend: this.clients.length,
      },
      {
        icon: '🔗',
        label: 'DEPENDENCIES',
        value: this.dependencies.length,
        sub: 'liens',
        trend: this.dependencies.length,
      },
      {
        icon: '📎',
        label: 'LINKS',
        value: this.clientServices.length,
        sub: 'associations',
        trend: this.clientServices.length,
      },
    ];
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-active';
    switch (status.toUpperCase()) {
      case 'UP':
      case 'ACTIVE':
      case 'ACTIF': return 'status-active';
      case 'DOWN':
      case 'INACTIVE': return 'status-down';
      case 'DEGRADED':
      case 'WARNING': return 'status-warning';
      default: return 'status-active';
    }
  }
}
