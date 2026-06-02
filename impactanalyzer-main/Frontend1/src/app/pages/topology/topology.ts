import { Component, OnInit, ViewChild,
    ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { MessageService } from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-topology',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, ToastModule,
        SelectModule, TagModule, TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './topology.html',
    styleUrl: './topology.css'
})
export class TopologyComponent implements OnInit {

    @ViewChild('topoGraph', { static: false })
    graphContainer!: ElementRef;

    private network: any = null;
    private apiUrl = 'http://localhost:8080';

    // Données
    services: any[] = [];
    dependencies: any[] = [];
    isLoading = true;

    // Stats
    stats = {
        totalServices: 0,
        totalDependencies: 0,
        servicesUp: 0,
        servicesDown: 0,
        criticalServices: 0
    };

    // Filtres
    filterTier: string | null = null;
    filterStatus: string | null = null;

    tierFilterOptions = [
        { label: 'Tous les tiers', value: null },
        { label: '🔴 CRITICAL', value: 'CRITICAL' },
        { label: '🟠 HIGH',     value: 'HIGH' },
        { label: '🟡 MEDIUM',   value: 'MEDIUM' },
        { label: '🟢 LOW',      value: 'LOW' }
    ];

    statusFilterOptions = [
        { label: 'Tous les statuts', value: null },
        { label: '✅ UP',   value: 'UP' },
        { label: '❌ DOWN', value: 'DOWN' }
    ];

    // Service sélectionné dans le graphe
    selectedNode: any = null;

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading = true;

        // Charger services et dépendances en parallèle
        this.http.get<any[]>(`${this.apiUrl}/services`).subscribe({
            next: (services) => {
                this.services = services;

                this.http.get<any[]>(`${this.apiUrl}/dependencies`).subscribe({
                    next: (deps) => {
                        this.dependencies = deps;
                        this.computeStats();
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        setTimeout(() => this.buildGraph(), 200);
                    },
                    error: () => {
                        this.isLoading = false;
                        this.messageService.add({
                            severity: 'error', summary: 'Erreur',
                            detail: 'Impossible de charger les dépendances'
                        });
                    }
                });
            },
            error: () => {
                this.isLoading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger les services'
                });
            }
        });
    }

    computeStats(): void {
        this.stats.totalServices    = this.services.length;
        this.stats.servicesUp       = this.services.filter(s => s.status === 'UP').length;
        this.stats.servicesDown     = this.services.filter(s => s.status === 'DOWN').length;
        this.stats.criticalServices = this.services.filter(
            s => s.tier === 'CRITICAL' || s.tier === 'HIGH'
        ).length;
        this.stats.totalDependencies = this.dependencies.length;
    }

    buildGraph(): void {
        if (!this.graphContainer) return;
        if (this.network) { this.network.destroy(); }

        const nodes: any[] = [];
        const edges: any[] = [];
        const nodeIds = new Set<number>();

        // Filtrer les services selon les filtres actifs
        const filteredServices = this.services.filter(s => {
            if (this.filterTier && s.tier !== this.filterTier) return false;
            if (this.filterStatus && s.status !== this.filterStatus) return false;
            return true;
        });

        // Couleurs par tier
        const tierColors: any = {
            'CRITICAL': { bg: '#fee2e2', border: '#ef4444', font: '#991b1b' },
            'HIGH':     { bg: '#ffedd5', border: '#f97316', font: '#9a3412' },
            'MEDIUM':   { bg: '#eff6ff', border: '#3b82f6', font: '#1e40af' },
            'LOW':      { bg: '#f0fdf4', border: '#22c55e', font: '#166534' }
        };

        // Créer les nœuds
        filteredServices.forEach(service => {
            const colors = tierColors[service.tier] || tierColors['MEDIUM'];
            const isDown = service.status === 'DOWN';

            nodes.push({
                id: service.id,
                label: service.name,
                title: `📛 ${service.name}\n` +
                    `🏷️ Tier: ${service.tier}\n` +
                    `👥 Équipe: ${service.ownerTeam || 'N/A'}\n` +
                    `📊 SLA: ${service.sla || 'N/A'}%\n` +
                    `📡 Status: ${service.status}`,
                color: {
                    background: isDown ? '#fca5a5' : colors.bg,
                    border:     isDown ? '#dc2626' : colors.border,
                    highlight: {
                        background: '#ddd6fe',
                        border: '#7c3aed'
                    },
                    hover: {
                        background: '#e0e7ff',
                        border: '#4f46e5'
                    }
                },
                font: {
                    color: isDown ? '#7f1d1d' : colors.font,
                    size: 16,
                    bold: service.tier === 'CRITICAL'
                },
                shape: service.tier === 'CRITICAL' ? 'box' : 'ellipse',
                borderWidth: isDown ? 3 : 2,
                borderDashes: isDown,     // ← bordure pointillée si DOWN
                size: 35,
                widthConstraint: {
                    minimum: 120,
                    maximum: 180
                },
                serviceData: service      // stocker les données
            });
            nodeIds.add(service.id);
        });

        // Couleurs des flèches par criticité
        const edgeColors: any = {
            'HIGH':   { color: '#ef4444', width: 3 },
            'MEDIUM': { color: '#f59e0b', width: 2 },
            'LOW':    { color: '#10b981', width: 1 }
        };

        // Créer les arêtes (seulement si les 2 nœuds sont visibles)
        this.dependencies.forEach(dep => {
            const fromId = dep.service?.id;
            const toId   = dep.dependsOn?.id;
            if (!fromId || !toId) return;
            if (!nodeIds.has(fromId) || !nodeIds.has(toId)) return;

            const ec = edgeColors[dep.criticality] || edgeColors['MEDIUM'];

            edges.push({
                from: fromId,
                to: toId,
                arrows: 'to',
                label: dep.dependencyType,
                font: { size: 9, color: '#6b7280',
                    strokeWidth: 2, strokeColor: '#fff' },
                color: { color: ec.color, highlight: '#7c3aed' },
                width: ec.width,
                dashes: dep.dependencyType === 'ASYNC_EVENT',
                smooth: { enabled: true, type: 'cubicBezier', roundness: 0.3 }
            });
        });

        const options: Options = {
            layout: { improvedLayout: true },
            nodes: {
                size: 35,              //  taille globale des nœuds
                font: {
                    size: 16,          //  taille globale du texte
                    face: 'Arial'
                },
                margin: {              //  espace intérieur des nœuds
                    top: 12,
                    right: 16,
                    bottom: 12,
                    left: 16
                }
            },
            edges: {
                font: { size: 11 },   //  labels des flèches un peu plus grands
                smooth: { enabled: true, type: 'dynamic', roundness: 0.3 }
            },
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -80,  //  plus d'espace entre nœuds
                    centralGravity: 0.01,
                    springLength: 250,           // augmenté pour plus d'espace
                    springConstant: 0.08,
                    damping: 0.4
                },
                stabilization: { iterations: 200, updateInterval: 25 }
            },
            interaction: {
                hover: true,
                tooltipDelay: 150,
                navigationButtons: true,
                keyboard: true,
                zoomView: true
            }
        };

        this.network = new Network(
            this.graphContainer.nativeElement,
            { nodes: new DataSet(nodes), edges: new DataSet(edges) },
            options
        );

        // Clic sur un nœud → afficher info
        this.network.on('click', (params: any) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node   = nodes.find(n => n.id === nodeId);
                if (node) {
                    this.selectedNode = node.serviceData;
                    this.cdr.detectChanges();
                }
            } else {
                this.selectedNode = null;
                this.cdr.detectChanges();
            }
        });

        // Stabilisation terminée
        this.network.on('stabilized', () => {
            this.network.setOptions({ physics: { enabled: false } });
        });
    }

    // Appliquer les filtres
    applyFilters(): void {
        setTimeout(() => this.buildGraph(), 100);
    }

    // Réinitialiser les filtres
    resetFilters(): void {
        this.filterTier   = null;
        this.filterStatus = null;
        this.selectedNode = null;
        setTimeout(() => this.buildGraph(), 100);
    }

    // Recentrer la vue
    fitGraph(): void {
        if (this.network) {
            this.network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
        }
    }

    // Recharger les données
    refresh(): void {
        this.selectedNode = null;
        this.loadData();
    }

    getTierSeverity(tier: string): any {
        const map: any = {
            'CRITICAL': 'danger', 'HIGH': 'warn',
            'MEDIUM': 'info', 'LOW': 'success'
        };
        return map[tier] || 'info';
    }
}
