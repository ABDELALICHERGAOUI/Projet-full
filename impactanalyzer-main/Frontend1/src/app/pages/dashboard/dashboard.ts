import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        ChartModule,
        ButtonModule,
        TagModule,
        TableModule,
        TooltipModule
    ],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

    private apiUrl = 'http://localhost:8080';

    // Données brutes
    services: any[] = [];
    clients: any[] = [];
    dependencies: any[] = [];
    isLoading = true;

    // KPI
    stats = {
        totalServices: 0,
        servicesUp: 0,
        servicesDown: 0,
        criticalServices: 0,
        totalClients: 0,
        vipClients: 0,
        totalDependencies: 0,
        highDependencies: 0
    };

    // Services DOWN
    downServices: any[] = [];

    // Top services connectés
    topConnectedServices: any[] = [];

    // Chart — Répartition par Tier
    tierChartData: any;
    tierChartOptions: any;

    // Chart — UP vs DOWN
    statusChartData: any;
    statusChartOptions: any;

    // Chart — Dépendances par type
    depTypeChartData: any;
    depTypeChartOptions: any;

    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadAllData();
        this.initChartOptions();
    }

    loadAllData(): void {
        // Charger services
        this.http.get<any[]>(`${this.apiUrl}/services`).subscribe({
            next: (services) => {
                this.services = services;

                // Charger clients
                this.http.get<any[]>(`${this.apiUrl}/clients`).subscribe({
                    next: (clients) => {
                        this.clients = clients;

                        // Charger dépendances
                        this.http.get<any[]>(`${this.apiUrl}/dependencies`).subscribe({
                            next: (deps) => {
                                this.dependencies = deps;
                                this.isLoading = false;
                                this.computeAll();
                                this.cdr.detectChanges();
                            }
                        });
                    }
                });
            }
        });
    }

    computeAll(): void {
        this.computeStats();
        this.computeDownServices();
        this.computeTopConnected();
        this.buildTierChart();
        this.buildStatusChart();
        this.buildDepTypeChart();
    }

    computeStats(): void {
        this.stats.totalServices    = this.services.length;
        this.stats.servicesUp       = this.services.filter(s => s.status === 'UP').length;
        this.stats.servicesDown     = this.services.filter(s => s.status === 'DOWN').length;
        this.stats.criticalServices = this.services.filter(
            s => s.tier === 'CRITICAL' || s.tier === 'HIGH'
        ).length;
        this.stats.totalClients     = this.clients.length;
        this.stats.vipClients       = this.clients.filter(
            c => c.segment === 'VIP'
        ).length;
        this.stats.totalDependencies = this.dependencies.length;
        this.stats.highDependencies  = this.dependencies.filter(
            d => d.criticality === 'HIGH'
        ).length;
    }

    computeDownServices(): void {
        this.downServices = this.services
            .filter(s => s.status === 'DOWN')
            .map(s => ({
                ...s,
                depCount: this.dependencies.filter(
                    d => d.dependsOn?.id === s.id || d.service?.id === s.id
                ).length
            }));
    }

    computeTopConnected(): void {
        // Compter les connexions de chaque service
        const connMap: { [id: number]: number } = {};
        this.dependencies.forEach(dep => {
            const fromId = dep.service?.id;
            const toId   = dep.dependsOn?.id;
            if (fromId) connMap[fromId] = (connMap[fromId] || 0) + 1;
            if (toId)   connMap[toId]   = (connMap[toId]   || 0) + 1;
        });

        this.topConnectedServices = this.services
            .map(s => ({ ...s, connections: connMap[s.id] || 0 }))
            .sort((a, b) => b.connections - a.connections)
            .slice(0, 5);
    }

    buildTierChart(): void {
        const counts = {
            CRITICAL: this.services.filter(s => s.tier === 'CRITICAL').length,
            HIGH:     this.services.filter(s => s.tier === 'HIGH').length,
            MEDIUM:   this.services.filter(s => s.tier === 'MEDIUM').length,
            LOW:      this.services.filter(s => s.tier === 'LOW').length,
        };

        this.tierChartData = {
            labels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            datasets: [{
                data: [counts.CRITICAL, counts.HIGH, counts.MEDIUM, counts.LOW],
                backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#22c55e'],
                hoverBackgroundColor: ['#dc2626', '#ea580c', '#2563eb', '#16a34a'],
                borderWidth: 0
            }]
        };
    }

    buildStatusChart(): void {
        this.statusChartData = {
            labels: ['UP', 'DOWN'],
            datasets: [{
                data: [this.stats.servicesUp, this.stats.servicesDown],
                backgroundColor: ['#22c55e', '#ef4444'],
                hoverBackgroundColor: ['#16a34a', '#dc2626'],
                borderWidth: 0
            }]
        };
    }

    buildDepTypeChart(): void {
        const sync  = this.dependencies.filter(d => d.dependencyType === 'SYNC_API').length;
        const async_= this.dependencies.filter(d => d.dependencyType === 'ASYNC_EVENT').length;
        const db    = this.dependencies.filter(d => d.dependencyType === 'DB').length;

        this.depTypeChartData = {
            labels: ['SYNC_API', 'ASYNC_EVENT', 'DB'],
            datasets: [{
                label: 'Dépendances',
                data: [sync, async_, db],
                backgroundColor: ['#6366f1', '#f59e0b', '#10b981'],
                borderRadius: 6,
                borderSkipped: false
            }]
        };
    }

    initChartOptions(): void {
        // Options communes pour Pie/Doughnut
        const pieOptions = {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 16, usePointStyle: true }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };

        this.tierChartOptions   = pieOptions;
        this.statusChartOptions = {
            ...pieOptions,
            cutout: '65%'  // donut
        };

        // Options pour Bar
        this.depTypeChartOptions = {
            plugins: { legend: { display: false } },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    grid: { color: '#f1f5f9' }
                },
                x: { grid: { display: false } }
            }
        };
    }

    // Navigation
    goTo(page: string): void {
        this.router.navigate(['/pages/' + page]);
    }

    getTierSeverity(tier: string): any {
        const map: any = {
            'CRITICAL': 'danger', 'HIGH': 'warn',
            'MEDIUM': 'info',     'LOW': 'success'
        };
        return map[tier] || 'info';
    }

    getStatusSeverity(status: string): any {
        return status === 'UP' ? 'success' : 'danger';
    }
}
