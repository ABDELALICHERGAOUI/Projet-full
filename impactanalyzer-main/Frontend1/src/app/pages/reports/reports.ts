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
        CommonModule, FormsModule,
        TableModule, ButtonModule, TagModule,
        TabsModule, ChartModule, TooltipModule,
        IconFieldModule, InputIconModule, InputTextModule
    ],
    templateUrl: './reports.html',
    styleUrl: './reports.css'
})
export class ReportsComponent implements OnInit {

    // Rapport 1
    topCriticalServices: any[] = [];
    loadingRisk = true;
    searchRisk = '';

    // Rapport 2
    blastRadiusData: any[] = [];
    loadingBlast = true;
    searchBlast = '';

    // Charts
    riskChartData: any;
    riskChartOptions: any;
    blastChartData: any;
    blastChartOptions: any;

    constructor(
        private apiService: ApiService,  // ✅ 'S' majuscule
        private router: Router,
        private cdr: ChangeDetectorRef
        // ✅ plus besoin de HttpClient
    ) {}

    ngOnInit(): void {
        this.loadTopCritical();
        this.loadBlastRadius();
        this.initChartOptions();
    }

    // ✅ Utilise apiService au lieu de http
    loadTopCritical(): void {
        this.apiService.getTopCriticalServices().subscribe({
            next: (data) => {
                this.topCriticalServices = data;
                this.loadingRisk = false;
                this.buildRiskChart();
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingRisk = false;
            }
        });
    }

    // ✅ Utilise apiService au lieu de http
    loadBlastRadius(): void {
        this.apiService.getBlastRadius().subscribe({
            next: (data) => {
                this.blastRadiusData = data;
                this.loadingBlast = false;
                this.buildBlastChart();
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingBlast = false;
            }
        });
    }

    buildRiskChart(): void {
        const top8 = this.topCriticalServices.slice(0, 8);
        this.riskChartData = {
            labels: top8.map(s => s.name),
            datasets: [{
                label: 'Score de risque',
                data: top8.map(s => s.riskScore),
                backgroundColor: top8.map(s =>
                    this.getRiskColor(s.riskLevel)
                ),
                borderRadius: 6,
                borderSkipped: false
            }]
        };
    }

    buildBlastChart(): void {
        const top8 = this.blastRadiusData.slice(0, 8);
        this.blastChartData = {
            labels: top8.map(s => s.serviceName),
            datasets: [{
                label: 'Blast Radius (%)',
                data: top8.map(s => s.blastRadiusScore),
                backgroundColor: top8.map(s =>
                    this.getSeverityColor(s.severity)
                ),
                borderRadius: 6,
                borderSkipped: false
            }]
        };
    }

    initChartOptions(): void {
        const barOptions = {
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: (v: any) => v + '%' },
                    grid: { color: '#f1f5f9' }
                },
                y: { grid: { display: false } }
            }
        };
        this.riskChartOptions  = barOptions;
        this.blastChartOptions = barOptions;
    }

    getRiskColor(level: string): string {
        const map: any = {
            'CRITICAL': '#ef4444',
            'HIGH':     '#f97316',
            'MEDIUM':   '#f59e0b',
            'LOW':      '#22c55e'
        };
        return map[level] || '#6366f1';
    }

    getSeverityColor(severity: string): string {
        const map: any = {
            'CRITICAL': '#ef4444',
            'HIGH':     '#f97316',
            'MEDIUM':   '#f59e0b',
            'LOW':      '#22c55e',
            'NONE':     '#94a3b8'
        };
        return map[severity] || '#6366f1';
    }

    getTierSeverity(tier: string): any {
        const map: any = {
            'CRITICAL': 'danger', 'HIGH': 'warn',
            'MEDIUM': 'info',     'LOW': 'success'
        };
        return map[tier] || 'info';
    }

    getRiskTagSeverity(level: string): any {
        return this.getTierSeverity(level);
    }

    getSeverityTag(severity: string): any {
        const map: any = {
            'CRITICAL': 'danger', 'HIGH': 'warn',
            'MEDIUM':   'info',   'LOW':  'success',
            'NONE':     'secondary'
        };
        return map[severity] || 'info';
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
            ? ['Nom', 'Tier', 'Status', 'Dép. entrantes',
                'Dép. sortantes', 'Score risque', 'Niveau']
            : ['Service', 'Tier', 'Status', 'Services impactés',
                'Clients impactés', 'Blast Radius %', 'Sévérité'];

        const rows = type === 'risk'
            ? data.map((s: any) => [
                s.name, s.tier, s.status,
                s.dependencyCount, s.dependsOnCount,
                s.riskScore, s.riskLevel
            ])
            : data.map((s: any) => [
                s.serviceName, s.tier, s.status,
                s.impactedServicesCount, s.impactedClientsCount,
                s.blastRadiusScore, s.severity
            ]);

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `rapport_${type}_${
            new Date().toISOString().slice(0,10)
        }.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
