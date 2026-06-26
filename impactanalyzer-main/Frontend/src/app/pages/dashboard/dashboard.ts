import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

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

    // Rapports backend
    riskServices: any[] = [];
    blastRadiusReport: any[] = [];

    isLoading = true;

    // KPI principaux
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

    // Données affichées
    downServices: any[] = [];
    topRiskServices: any[] = [];
    topBlastRadiusServices: any[] = [];

    mostRiskyService: any | null = null;
    maxBlastRadius: any | null = null;

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
        this.initChartOptions();
        this.loadAllData();
    }

    loadAllData(): void {
        this.isLoading = true;

        forkJoin({
            services: this.http.get<any[]>(`${this.apiUrl}/services`)
                .pipe(catchError(() => of([]))),

            clients: this.http.get<any[]>(`${this.apiUrl}/clients`)
                .pipe(catchError(() => of([]))),

            dependencies: this.http.get<any[]>(`${this.apiUrl}/dependencies`)
                .pipe(catchError(() => of([]))),

            riskServices: this.http.get<any[]>(`${this.apiUrl}/reports/top-critical-services`)
                .pipe(catchError(() => of([]))),

            blastRadiusReport: this.http.get<any[]>(`${this.apiUrl}/reports/blast-radius`)
                .pipe(catchError(() => of([])))
        })
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (data) => {
                    this.services = data.services;
                    this.clients = data.clients;
                    this.dependencies = data.dependencies;
                    this.riskServices = data.riskServices;
                    this.blastRadiusReport = data.blastRadiusReport;

                    this.computeAll();
                },
                error: () => {
                    this.services = [];
                    this.clients = [];
                    this.dependencies = [];
                    this.riskServices = [];
                    this.blastRadiusReport = [];
                    this.computeAll();
                }
            });
    }

    computeAll(): void {
        this.computeStats();
        this.computeDownServices();
        this.computeReportSummaries();

        this.buildTierChart();
        this.buildStatusChart();
        this.buildDepTypeChart();
    }

    computeStats(): void {
        this.stats.totalServices = this.services.length;

        this.stats.servicesUp = this.services.filter(
            s => s.status === 'UP'
        ).length;

        this.stats.servicesDown = this.services.filter(
            s => s.status === 'DOWN'
        ).length;

        this.stats.criticalServices = this.services.filter(
            s => s.tier === 'CRITICAL' || s.tier === 'HIGH'
        ).length;

        this.stats.totalClients = this.clients.length;

        this.stats.vipClients = this.clients.filter(
            c => c.segment === 'VIP'
        ).length;

        this.stats.totalDependencies = this.dependencies.length;

        this.stats.highDependencies = this.dependencies.filter(
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

    computeReportSummaries(): void {
        this.topRiskServices = [...this.riskServices]
            .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
            .slice(0, 5);

        this.topBlastRadiusServices = [...this.blastRadiusReport]
            .sort((a, b) => (b.blastRadiusScore || 0) - (a.blastRadiusScore || 0))
            .slice(0, 5);

        this.mostRiskyService = this.topRiskServices.length > 0
            ? this.topRiskServices[0]
            : null;

        this.maxBlastRadius = this.topBlastRadiusServices.length > 0
            ? this.topBlastRadiusServices[0]
            : null;
    }

    buildTierChart(): void {
        const counts = {
            CRITICAL: this.services.filter(s => s.tier === 'CRITICAL').length,
            HIGH:     this.services.filter(s => s.tier === 'HIGH').length,
            MEDIUM:   this.services.filter(s => s.tier === 'MEDIUM').length,
            LOW:      this.services.filter(s => s.tier === 'LOW').length
        };

        this.tierChartData = {
            labels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            datasets: [
                {
                    data: [
                        counts.CRITICAL,
                        counts.HIGH,
                        counts.MEDIUM,
                        counts.LOW
                    ],
                    backgroundColor: [
                        '#ef4444',
                        '#f97316',
                        '#6366f1',
                        '#22c55e'
                    ],
                    hoverBackgroundColor: [
                        '#dc2626',
                        '#ea580c',
                        '#4f46e5',
                        '#16a34a'
                    ],
                    borderWidth: 0
                }
            ]
        };
    }

    buildStatusChart(): void {
        this.statusChartData = {
            labels: ['UP', 'DOWN'],
            datasets: [
                {
                    data: [
                        this.stats.servicesUp,
                        this.stats.servicesDown
                    ],
                    backgroundColor: [
                        '#22c55e',
                        '#ef4444'
                    ],
                    hoverBackgroundColor: [
                        '#16a34a',
                        '#dc2626'
                    ],
                    borderWidth: 0
                }
            ]
        };
    }

    buildDepTypeChart(): void {
        const sync = this.dependencies.filter(
            d => d.dependencyType === 'SYNC_API'
        ).length;

        const async = this.dependencies.filter(
            d => d.dependencyType === 'ASYNC_EVENT'
        ).length;

        const db = this.dependencies.filter(
            d => d.dependencyType === 'DB'
        ).length;

        this.depTypeChartData = {
            labels: ['SYNC_API', 'ASYNC_EVENT', 'DB'],
            datasets: [
                {
                    label: 'Dépendances',
                    data: [sync, async, db],
                    backgroundColor: [
                        '#8b5cf6',
                        '#f59e0b',
                        '#10b981'
                    ],
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        };
    }

    initChartOptions(): void {
        const pieOptions = {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 14,
                        usePointStyle: true,
                        boxWidth: 10,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };

        this.tierChartOptions = pieOptions;

        this.statusChartOptions = {
            ...pieOptions,
            cutout: '64%'
        };

        this.depTypeChartOptions = {
            plugins: {
                legend: {
                    display: false
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: '#eef2f7'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        };
    }

    getUpPercentage(): number {
        return this.stats.totalServices > 0
            ? (this.stats.servicesUp / this.stats.totalServices) * 100
            : 0;
    }

    getDownPercentage(): number {
        return this.stats.totalServices > 0
            ? (this.stats.servicesDown / this.stats.totalServices) * 100
            : 0;
    }

    goTo(page: string): void {
        this.router.navigate(['/pages/' + page]);
    }

    getTierSeverity(tier: string): any {
        const map: any = {
            CRITICAL: 'danger',
            HIGH: 'warn',
            MEDIUM: 'info',
            LOW: 'success'
        };

        return map[tier] || 'info';
    }

    getStatusSeverity(status: string): any {
        return status === 'UP' ? 'success' : 'danger';
    }

    getRiskSeverity(level: string): any {
        const map: any = {
            NONE: 'success',
            LOW: 'info',
            MEDIUM: 'warn',
            HIGH: 'danger',
            CRITICAL: 'danger'
        };

        return map[level] || 'info';
    }
}
