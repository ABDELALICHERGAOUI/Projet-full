import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        TagModule,
        TabsModule,
        ChartModule,
        TooltipModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule
    ],
    templateUrl: './reports.html',
    styleUrl: './reports.css'
})
export class ReportsComponent implements OnInit {

    // Rapport 1 : Top Services Critiques
    topCriticalServices: any[] = [];
    loadingRisk = true;
    searchRisk = '';

    // Rapport 2 : Blast Radius
    blastRadiusData: any[] = [];
    loadingBlast = true;
    searchBlast = '';

    // Charts
    riskChartData: any;
    riskChartOptions: any;
    blastChartData: any;
    blastChartOptions: any;

    // Synthèse Risk
    mostRiskyService: any | null = null;
    criticalRiskCount = 0;
    highRiskCount = 0;
    downRiskCount = 0;
    averageRiskScore = 0;

    // Synthèse Blast Radius
    maxBlastRadiusService: any | null = null;
    highBlastCount = 0;
    maxImpactedServices = 0;
    maxImpactedClients = 0;
    averageBlastScore = 0;

    constructor(
        private apiService: ApiService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.initChartOptions();
        this.loadTopCritical();
        this.loadBlastRadius();
    }

    loadTopCritical(): void {
        this.loadingRisk = true;

        this.apiService.getTopCriticalServices().subscribe({
            next: (data) => {
                this.topCriticalServices = [...data].sort(
                    (a, b) => (b.riskScore || 0) - (a.riskScore || 0)
                );

                this.computeRiskSummary();
                this.buildRiskChart();

                this.loadingRisk = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.topCriticalServices = [];
                this.computeRiskSummary();
                this.loadingRisk = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadBlastRadius(): void {
        this.loadingBlast = true;

        this.apiService.getBlastRadius().subscribe({
            next: (data) => {
                this.blastRadiusData = [...data].sort(
                    (a, b) => (b.blastRadiusScore || 0) - (a.blastRadiusScore || 0)
                );

                this.computeBlastSummary();
                this.buildBlastChart();

                this.loadingBlast = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.blastRadiusData = [];
                this.computeBlastSummary();
                this.loadingBlast = false;
                this.cdr.detectChanges();
            }
        });
    }

    computeRiskSummary(): void {
        this.mostRiskyService = this.topCriticalServices.length > 0
            ? this.topCriticalServices[0]
            : null;

        this.criticalRiskCount = this.topCriticalServices.filter(
            s => s.riskLevel === 'CRITICAL'
        ).length;

        this.highRiskCount = this.topCriticalServices.filter(
            s => s.riskLevel === 'HIGH'
        ).length;

        this.downRiskCount = this.topCriticalServices.filter(
            s => s.status === 'DOWN'
        ).length;

        this.averageRiskScore = this.topCriticalServices.length > 0
            ? this.topCriticalServices.reduce(
            (sum, s) => sum + (s.riskScore || 0), 0
        ) / this.topCriticalServices.length
            : 0;
    }

    computeBlastSummary(): void {
        this.maxBlastRadiusService = this.blastRadiusData.length > 0
            ? this.blastRadiusData[0]
            : null;

        this.highBlastCount = this.blastRadiusData.filter(
            s => s.severity === 'HIGH' || s.severity === 'CRITICAL'
        ).length;

        this.maxImpactedServices = this.blastRadiusData.length > 0
            ? Math.max(...this.blastRadiusData.map(s => s.impactedServicesCount || 0))
            : 0;

        this.maxImpactedClients = this.blastRadiusData.length > 0
            ? Math.max(...this.blastRadiusData.map(s => s.impactedClientsCount || 0))
            : 0;

        this.averageBlastScore = this.blastRadiusData.length > 0
            ? this.blastRadiusData.reduce(
            (sum, s) => sum + (s.blastRadiusScore || 0), 0
        ) / this.blastRadiusData.length
            : 0;
    }

    buildRiskChart(): void {
        const top8 = this.topCriticalServices.slice(0, 8);

        this.riskChartData = {
            labels: top8.map(s => s.name),
            datasets: [
                {
                    label: 'Score de risque',
                    data: top8.map(s => s.riskScore),
                    backgroundColor: top8.map(s => this.getRiskColor(s.riskLevel)),
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        };
    }

    buildBlastChart(): void {
        const top8 = this.blastRadiusData.slice(0, 8);

        this.blastChartData = {
            labels: top8.map(s => s.serviceName),
            datasets: [
                {
                    label: 'Blast Radius (%)',
                    data: top8.map(s => s.blastRadiusScore),
                    backgroundColor: top8.map(s => this.getSeverityColor(s.severity)),
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        };
    }

    initChartOptions(): void {
        const barOptions = {
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => `${context.raw}%`
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: (value: any) => value + '%'
                    },
                    grid: {
                        color: '#eef2f7'
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#475569',
                        font: {
                            size: 12,
                            weight: 600
                        }
                    }
                }
            }
        };

        this.riskChartOptions = barOptions;
        this.blastChartOptions = barOptions;
    }

    getRiskColor(level: string): string {
        const map: any = {
            CRITICAL: '#ef4444',
            HIGH: '#f97316',
            MEDIUM: '#f59e0b',
            LOW: '#22c55e'
        };

        return map[level] || '#64748b';
    }

    getSeverityColor(severity: string): string {
        const map: any = {
            CRITICAL: '#ef4444',
            HIGH: '#f97316',
            MEDIUM: '#f59e0b',
            LOW: '#22c55e',
            NONE: '#94a3b8'
        };

        return map[severity] || '#64748b';
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

    getRiskTagSeverity(level: string): any {
        const map: any = {
            CRITICAL: 'danger',
            HIGH: 'warn',
            MEDIUM: 'info',
            LOW: 'success'
        };

        return map[level] || 'info';
    }

    getSeverityTag(severity: string): any {
        const map: any = {
            CRITICAL: 'danger',
            HIGH: 'warn',
            MEDIUM: 'info',
            LOW: 'success',
            NONE: 'secondary'
        };

        return map[severity] || 'info';
    }

    getStatusSeverity(status: string): any {
        return status === 'UP' ? 'success' : 'danger';
    }

    simulateImpact(serviceId: number): void {
        this.router.navigate(['/pages/impact'], {
            queryParams: { serviceId }
        });
    }

    exportCSV(type: string): void {
        const data = type === 'risk'
            ? this.topCriticalServices
            : this.blastRadiusData;

        const headers = type === 'risk'
            ? [
                'Nom',
                'Tier',
                'Status',
                'Dep. entrantes',
                'Dep. sortantes',
                'Score risque',
                'Niveau'
            ]
            : [
                'Service',
                'Tier',
                'Status',
                'Services impactes',
                'Clients impactes',
                'Blast Radius %',
                'Severite'
            ];

        const rows = type === 'risk'
            ? data.map((s: any) => [
                s.name,
                s.tier,
                s.status,
                s.dependencyCount,
                s.dependsOnCount,
                s.riskScore,
                s.riskLevel
            ])
            : data.map((s: any) => [
                s.serviceName,
                s.tier,
                s.status,
                s.impactedServicesCount,
                s.impactedClientsCount,
                s.blastRadiusScore,
                s.severity
            ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map((cell: any) => `"${cell ?? ''}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `rapport_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();

        window.URL.revokeObjectURL(url);
    }
}
