import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {RouterModule} from '@angular/router';
import {ApiService} from '../../services/api.service';

@Component({
   selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit{
  services: any[] = [];
  clients: any[] = [];
  dependencies: any[] = [];
  clientServices: any[] = [];
  isLoading = true;
  currentDate = new Date();
  angularVersion = '19+';

  kpiCards: any[] = [];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    let loaded = 0;
    const total = 4;
    const done = () => {
      loaded++;
      if (loaded === total) {
        this.isLoading = false;
        this.buildKpiCards();
        this.cdr.detectChanges();
      }
    };

    this.apiService.getServices().subscribe({
      next: (data) => { this.services = data; done(); },
      error: () => done(),
    });

    this.apiService.getAllClients().subscribe({
      next: (data) => { this.clients = data; done(); },
      error: () => done(),
    });

    this.apiService.getDependencies().subscribe({
      next: (data) => { this.dependencies = data; done(); },
      error: () => done(),
    });

    this.apiService.getAllClientServices().subscribe({
      next: (data) => { this.clientServices = data; done(); },
      error: () => done(),
    });
  }

  buildKpiCards(): void {
    this.kpiCards = [
      {
        icon: '⚙',
        label: 'Services',
        value: this.services.length,
        sub: 'dans le système',
        gradient: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
        trend: this.services.length,
        trendLabel: 'enregistrés',
      },
      {
        icon: '👥',
        label: 'Clients',
        value: this.clients.length,
        sub: 'utilisateurs actifs',
        gradient: 'linear-gradient(135deg, #1a3a2a, #16a34a)',
        trend: this.clients.length,
        trendLabel: 'enregistrés',
      },
      {
        icon: '🔗',
        label: 'Dépendances',
        value: this.dependencies.length,
        sub: 'liens de dépendance',
        gradient: 'linear-gradient(135deg, #3b1a5f, #7c3aed)',
        trend: this.dependencies.length,
        trendLabel: 'configurées',
      },
      {
        icon: '💥',
        label: 'Associations',
        value: this.clientServices.length,
        sub: 'client ↔ service',
        gradient: 'linear-gradient(135deg, #5f1a1a, #dc2626)',
        trend: this.clientServices.length,
        trendLabel: 'actives',
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
