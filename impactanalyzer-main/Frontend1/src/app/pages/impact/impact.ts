import { Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { ImpactDTO } from '../../models/impact.dto.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';

@Component({
    selector: 'app-impact',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, SelectModule, CardModule,
        TagModule, ToastModule, ProgressSpinnerModule,
        DividerModule,MessageModule,
        DialogModule,
        ProgressBarModule,
    ],
    providers: [MessageService],
    templateUrl: './impact.html',
    styleUrl: './impact.css'
})
export class Impact implements OnInit {

    @ViewChild('graphContainer', { static: false }) graphContainer!: ElementRef;

    services: any[] = [];
    selectedServiceId: number | null = null;
    impactResult: ImpactDTO | null = null;
    loading = false;
    error = '';
    private network: any = null;

    // Options pour p-select
    serviceOptions: any[] = [];

    constructor(
        private apiService: ApiService,
        private cdr: ChangeDetectorRef,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.apiService.getServices().subscribe({
            next: (data) => {
                this.services = data;
                // ✅ Convertir pour p-select
                this.serviceOptions = data.map((s: any) => ({
                    label: s.name,
                    value: s.id
                }));
            },
            error: () => {
                this.error = 'Impossible de charger les services.';
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger les services', life: 3000
                });
            }
        });
    }

    simulate(): void {
        if (!this.selectedServiceId) return;
        const serviceId = Number(this.selectedServiceId);
        this.loading = true;
        this.error = '';
        this.impactResult = null;

        this.apiService.simulateImpact(serviceId).subscribe({
            next: (result) => {
                this.impactResult = result;
                this.loading = false;
                this.cdr.detectChanges();
                setTimeout(() => this.buildGraph(result), 50);
            },
            error: () => {
                this.error = 'Erreur lors de la simulation.';
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Erreur lors de la simulation', life: 3000
                });
            }
        });
    }

    // ✅ Même logique buildGraph — pas de changement
    buildGraph(impact: ImpactDTO): void {
        if (!this.graphContainer) return;
        if (this.network) { this.network.destroy(); }

        const nodes: any[] = [];
        const edges: any[] = [];
        const nodeIds = new Set<string>();

        nodes.push({
            id: impact.failedServiceName,
            label: impact.failedServiceName,
            color: { background: '#ef4444', border: '#b91c1c' },
            font: { color: '#fff', bold: true },
            shape: 'box', size: 30
        });
        nodeIds.add(impact.failedServiceName);

        impact.impactPaths.forEach(path => {
            const parts = path.split(' → ');
            parts.forEach((label, i) => {
                if (!nodeIds.has(label)) {
                    const isLast = i === parts.length - 1;
                    nodes.push({
                        id: label, label,
                        color: {
                            background: isLast ? '#f97316' : '#f59e0b',
                            border: isLast ? '#c2410c' : '#b45309'
                        },
                        font: { color: '#fff' }, shape: 'ellipse'
                    });
                    nodeIds.add(label);
                }
                if (i > 0) {
                    edges.push({ from: parts[i - 1], to: label, arrows: 'to' });
                }
            });
        });

        if (impact.impactPaths.length === 0) {
            impact.impactedServices.forEach(name => {
                if (!nodeIds.has(name)) {
                    nodes.push({
                        id: name, label: name,
                        color: { background: '#f59e0b', border: '#b45309' },
                        font: { color: '#fff' }, shape: 'ellipse'
                    });
                    nodeIds.add(name);
                    edges.push({ from: impact.failedServiceName, to: name, arrows: 'to' });
                }
            });
        }

        const options: Options = {
            layout: {
                hierarchical: {
                    direction: 'LR', sortMethod: 'directed',
                    levelSeparation: 200, nodeSpacing: 120
                }
            },
            physics: { enabled: false },
            edges: { color: '#6b7280', smooth: { enabled: true, type: 'cubicBezier', roundness: 0.5 } },
            nodes: { margin: { top: 10, right: 15, bottom: 10, left: 15 } }
        };
        this.network = new Network(
            this.graphContainer.nativeElement,
            { nodes: new DataSet(nodes), edges: new DataSet(edges) },
            options
        );
    }

    getSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
        const map: any = {
            NONE: 'success',
            LOW: 'info',
            MEDIUM: 'warn',
            HIGH: 'danger',
            CRITICAL: 'danger'
        };
        return map[this.impactResult?.severity || 'NONE'];
    }
    showServicesDialog = false;
    showClientsDialog = false;

    openServicesDialog() {
        if (this.impactResult && this.impactResult.totalServicesImpacted > 0) {
            this.showServicesDialog = true;
        }
    }

    openClientsDialog() {
        if (this.impactResult && this.impactResult.totalClientsImpacted > 0) {
            this.showClientsDialog = true;
        }
    }

    getBlastRadiusColor(): string {
        const score = this.impactResult?.impactScore || 0;
        if (score >= 75) return 'danger';
        if (score >= 50) return 'warn';
        if (score >= 25) return 'info';
        return 'success';
    }
}
