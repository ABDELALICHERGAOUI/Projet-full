import { Component, OnInit, ViewChild,
    ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';           // ✅ NOUVEAU : navigation vers page Impact
import { Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { MessageService } from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService } from '../../services/api.service';

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

    // ✅ NOUVEAU : références aux DataSets pour mise à jour dynamique des couleurs
    private nodesDataset!: DataSet<any>;
    private edgesDataset!: DataSet<any>;

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

    // ✅ NOUVEAU : état de la simulation légère
    simulationActive  = false;
    simulationLoading = false;
    simulationResult: any = null;

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef,
        private router: Router ,  // injection du Router
        private apiService: ApiService

    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading = true;

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

        const filteredServices = this.services.filter(s => {
            if (this.filterTier && s.tier !== this.filterTier) return false;
            if (this.filterStatus && s.status !== this.filterStatus) return false;
            return true;
        });

        const shapeMap: any = {
            'CRITICAL': 'box',
            'HIGH':     'diamond',
            'MEDIUM':   'ellipse',
            'LOW':      'ellipse'
        };

        const bgColorMap: any = {
            'CRITICAL': '#FECACA',
            'HIGH':     '#FED7AA',
            'MEDIUM':   '#BFDBFE',
            'LOW':      '#BBF7D0'
        };

        const borderColorMap: any = {
            'CRITICAL': '#DC2626',
            'HIGH':     '#F97316',
            'MEDIUM':   '#3B82F6',
            'LOW':      '#16A34A'
        };

        const fontColorMap: any = {
            'CRITICAL': '#7F1D1D',
            'HIGH':     '#9A3412',
            'MEDIUM':   '#1E40AF',
            'LOW':      '#166534'
        };

        filteredServices.forEach(service => {
            const isDown = service.status === 'DOWN';
            const tier   = service.tier || 'MEDIUM';

            nodes.push({
                id: service.id,
                label: service.name,
                title: `📛 ${service.name}\n` +
                    `🏷️ Tier: ${service.tier}\n` +
                    `👥 Équipe: ${service.ownerTeam || 'N/A'}\n` +
                    `📊 SLA: ${service.sla || 'N/A'}%\n` +
                    `📡 Status: ${service.status}`,
                color: {
                    background: bgColorMap[tier] || '#BFDBFE',
                    border: isDown
                        ? '#EF4444'
                        : (borderColorMap[tier] || '#3B82F6'),
                    highlight: {
                        background: bgColorMap[tier] || '#BFDBFE',
                        border: '#7C3AED'
                    },
                    hover: {
                        background: '#E0E7FF',
                        border: '#4F46E5'
                    }
                },
                /*font: {
                    color: fontColorMap[tier] || '#1E40AF',
                    size: 20,
                    face: 'Arial',
                    bold: isDown || service.tier === 'CRITICAL'
                },
                shape: shapeMap[tier] || 'ellipse',
                borderWidth: isDown ? 4 : 1.5,
                borderDashes: false,
                size: 90,
                widthConstraint: { minimum: 160, maximum: 280 },
                serviceData: service*/
                font: {
                    color: fontColorMap[tier] || '#1E40AF',
                    size: 14,
                    face: 'Arial',
                    bold: isDown || service.tier === 'CRITICAL'
                },
                shape: shapeMap[tier] || 'ellipse',
                borderWidth: isDown ? 3 : 1.5,
                borderDashes: false,
                size: 32,
                widthConstraint: { minimum: 110, maximum: 190 },
                serviceData: service
            });
            nodeIds.add(service.id);
        });

        const edgeColors: any = {
            'HIGH':   { color: '#ef4444', width: 3 },
            'MEDIUM': { color: '#f59e0b', width: 2 },
            'LOW':    { color: '#10b981', width: 1 }
        };

        this.dependencies.forEach(dep => {
            const fromId = dep.dependsOn?.id;
            const toId   = dep.service?.id;
            if (!fromId || !toId) return;
            if (!nodeIds.has(fromId) || !nodeIds.has(toId)) return;

            const ec = edgeColors[dep.criticality] || edgeColors['MEDIUM'];

            edges.push({
                id:     dep.id,   // ✅ NOUVEAU : ID de l'arête pour mise à jour dynamique
                from:   fromId,
                to:     toId,
                arrows: 'to',
                label:  dep.dependencyType,
                /*font: { size: 18, color: '#6b7280',
                    strokeWidth: 2, strokeColor: '#fff' },*/
                font: {
                    size: 11,
                    color: '#6b7280',
                    strokeWidth: 3,
                    strokeColor: '#ffffff',
                    align: 'middle'
                },
                color: { color: ec.color, highlight: '#7c3aed' },
                width: ec.width,
                dashes: dep.dependencyType === 'ASYNC_EVENT',
                smooth: {
                    enabled: true,
                    type: 'curvedCW',
                    roundness: 0.18
                }
                /*smooth: { enabled: true, type: 'cubicBezier', roundness: 0.3 }*/

            });
        });

        /*const options: Options = {
            layout: { improvedLayout: true },
            nodes: {
                size: 55,
                font: { size: 20, face: 'Arial' },
                margin: { top: 16, right: 22, bottom: 16, left: 22 }
            },
            edges: {
                font: { size: 11 },
                smooth: { enabled: true, type: 'dynamic', roundness: 0.3 }
            },
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -80,
                    centralGravity: 0.01,
                    springLength: 250,
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
        };*/
        const options: Options = {
            layout: {
                improvedLayout: true
            },
            nodes: {
                size: 32,
                font: {
                    size: 14,
                    face: 'Arial'
                },
                margin: {
                    top: 10,
                    right: 16,
                    bottom: 10,
                    left: 16
                }
            },
            edges: {
                font: {
                    size: 11,
                    color: '#6b7280',
                    strokeWidth: 3,
                    strokeColor: '#ffffff'
                },
                smooth: {
                    enabled: true,
                    type: 'dynamic',
                    roundness: 0.25
                }
            },
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -65,
                    centralGravity: 0.015,
                    springLength: 190,
                    springConstant: 0.06,
                    damping: 0.45
                },
                stabilization: {
                    iterations: 150,
                    updateInterval: 25
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 150,
                navigationButtons: true,
                keyboard: true,
                zoomView: true,
                dragView: true
            }
        };

        // ✅ NOUVEAU : stocker les DataSets pour mise à jour dynamique
        this.nodesDataset = new DataSet(nodes);
        this.edgesDataset = new DataSet(edges);

        this.network = new Network(
            this.graphContainer.nativeElement,
            { nodes: this.nodesDataset, edges: this.edgesDataset },
            options
        );

        // ✅ MODIFIÉ : clic → afficher info + lancer simulation légère
        this.network.on('click', (params: any) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node   = nodes.find(n => n.id === nodeId);
                if (node) {
                    this.selectedNode = node.serviceData;
                    this.cdr.detectChanges();
                    this.runSimulation(nodeId);   // ✅ NOUVEAU : lancer la simulation
                }
            } else {
                // ✅ NOUVEAU : clic sur fond → réinitialiser simulation
                this.selectedNode     = null;
                this.simulationActive  = false;
                this.simulationResult  = null;
                this.simulationLoading = false;
                this.resetNodeColors();          // ✅ NOUVEAU : remettre couleurs originales
                this.cdr.detectChanges();
            }
        });
        setTimeout(() => {
            this.fitGraph();
        }, 300);

        this.network.once('stabilized', () => {
            this.network.setOptions({ physics: { enabled: false } });
            setTimeout(() => {
                this.fitGraph();
            }, 100);
        });
    }

    // ✅ NOUVEAU : lancer la simulation légère sur la topologie
    runSimulation(serviceId: number): void {
        this.simulationLoading = true;
        this.simulationActive  = false;
        this.simulationResult  = null;
        this.cdr.detectChanges();

        // ✅ ApiService au lieu de HttpClient direct
        this.apiService.simulateImpact(serviceId).subscribe({
            next: (result) => {
                this.simulationResult  = result;
                this.simulationActive  = true;
                this.simulationLoading = false;
                this.applyImpactColors(serviceId, result);
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.simulationLoading = false;
                this.simulationActive  = false;
                if (err.status === 500) {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Aucun impact détecté',
                        detail: `"${this.selectedNode?.name}" n'a pas de dépendances sortantes.`,
                        life: 4000
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur simulation',
                        detail: err?.error?.message || 'Erreur lors de la simulation.',
                        life: 4000
                    });
                }
                this.cdr.detectChanges();
            }
        });
    }

    // ✅ Ajouter cette méthode complète après runSimulation()

    applyImpactColors(failedServiceId: number, result: any): void {
        if (!this.nodesDataset || !this.edgesDataset) return;

        // ImpactDTO retourne List<String> (noms) → chercher les IDs via this.services
        const impactedIds = new Set<number>(
            (result.impactedServices || [])
                .map((name: string) => {
                    const svc = this.services.find(s => s.name === name);
                    return svc ? Number(svc.id) : null;
                })
                .filter((id: number | null): id is number => id !== null)
        );

        // ── Mise à jour des nœuds ────────────────────────────
        const nodeUpdates: any[] = [];
        this.nodesDataset.forEach((node: any) => {
            const nId = Number(node.id);

            if (nId === failedServiceId) {
                // 🔴 Service sélectionné → rouge vif
                nodeUpdates.push({
                    id: node.id,
                    color: {
                        background: '#DC2626',
                        border:     '#7F1D1D',
                        highlight:  { background: '#DC2626', border: '#7F1D1D' }
                    },
                    font:        { color: '#FFFFFF', bold: true, size: 20 },
                    borderWidth: 4,
                    borderDashes: false
                });
            } else if (impactedIds.has(nId)) {
                // 🟠 Service impacté → orange
                nodeUpdates.push({
                    id: node.id,
                    color: {
                        background: '#F97316',
                        border:     '#C2410C',
                        highlight:  { background: '#FDBA74', border: '#C2410C' }
                    },
                    font:        { color: '#FFFFFF', bold: true, size: 20 },
                    borderWidth: 3,
                    borderDashes: false
                });
            } else {
                // ⬜ Non impacté → grisé
                nodeUpdates.push({
                    id: node.id,
                    color: {
                        background: '#E2E8F0',
                        border:     '#CBD5E1',
                        highlight:  { background: '#E2E8F0', border: '#94A3B8' }
                    },
                    font:        { color: '#94A3B8', bold: false, size: 20 },
                    borderWidth: 1,
                    borderDashes: false
                });
            }
        });
        this.nodesDataset.update(nodeUpdates);

        // ── Mise à jour des arêtes ───────────────────────────
        const edgeUpdates: any[] = [];
        this.edgesDataset.forEach((edge: any) => {
            const fromId = Number(edge.from);
            const toId   = Number(edge.to);

            if (fromId === failedServiceId || toId === failedServiceId) {
                // 🔴 Arête du service en panne → rouge
                edgeUpdates.push({
                    id:    edge.id,
                    color: { color: '#EF4444', highlight: '#DC2626' },
                    width: 3,
                    dashes: false
                });
            } else if (impactedIds.has(fromId) && impactedIds.has(toId)) {
                // 🟠 Arête entre services impactés → orange
                edgeUpdates.push({
                    id:    edge.id,
                    color: { color: '#F97316', highlight: '#EA580C' },
                    width: 2,
                    dashes: false
                });
            } else {
                // ⬜ Arête non concernée → grisée
                edgeUpdates.push({
                    id:    edge.id,
                    color: { color: '#E2E8F0', highlight: '#CBD5E1' },
                    width: 1,
                    dashes: false
                });
            }
        });
        this.edgesDataset.update(edgeUpdates);
    }
    //   NOUVEAU : remettre les couleurs originales sans reconstruire le graphe
    resetNodeColors(): void {
        if (!this.nodesDataset || !this.edgesDataset) return;

        const shapeMap: any = {
            'CRITICAL': 'box', 'HIGH': 'diamond',
            'MEDIUM': 'ellipse', 'LOW': 'ellipse'
        };
        const bgColorMap: any = {
            'CRITICAL': '#FECACA', 'HIGH': '#FED7AA',
            'MEDIUM': '#BFDBFE',   'LOW':  '#BBF7D0'
        };
        const borderColorMap: any = {
            'CRITICAL': '#DC2626', 'HIGH': '#F97316',
            'MEDIUM': '#3B82F6',   'LOW':  '#16A34A'
        };
        const fontColorMap: any = {
            'CRITICAL': '#7F1D1D', 'HIGH': '#9A3412',
            'MEDIUM': '#1E40AF',   'LOW':  '#166534'
        };

        const nodeUpdates: any[] = [];
        this.nodesDataset.forEach((node: any) => {
            const svc    = this.services.find(s => s.id === node.id);
            if (!svc) return;
            const tier   = svc.tier || 'MEDIUM';
            const isDown = svc.status === 'DOWN';

            nodeUpdates.push({
                id: node.id,
                color: {
                    background: bgColorMap[tier] || '#BFDBFE',
                    border: isDown ? '#EF4444' : (borderColorMap[tier] || '#3B82F6'),
                    highlight: { background: bgColorMap[tier] || '#BFDBFE', border: '#7C3AED' },
                    hover:     { background: '#E0E7FF', border: '#4F46E5' }
                },
                font: {
                    color: fontColorMap[tier] || '#1E40AF',
                    size: 20, face: 'Arial',
                    bold: isDown || svc.tier === 'CRITICAL'
                },
                shape:       shapeMap[tier] || 'ellipse',
                borderWidth: isDown ? 4 : 1.5,
                borderDashes: false
            });
        });
        this.nodesDataset.update(nodeUpdates);

        // Remettre les couleurs originales des arêtes
        const edgeColors: any = {
            'HIGH':   { color: '#ef4444', width: 3 },
            'MEDIUM': { color: '#f59e0b', width: 2 },
            'LOW':    { color: '#10b981', width: 1 }
        };
        const edgeUpdates: any[] = [];
        this.edgesDataset.forEach((edge: any) => {
            const dep = this.dependencies.find(d => d.id === edge.id);
            if (!dep) return;
            const ec = edgeColors[dep.criticality] || edgeColors['MEDIUM'];
            edgeUpdates.push({
                id:    edge.id,
                color: { color: ec.color, highlight: '#7c3aed' },
                width: ec.width,
                dashes: dep.dependencyType === 'ASYNC_EVENT'
            });
        });
        this.edgesDataset.update(edgeUpdates);
    }

    //  NOUVEAU : naviguer vers la page Impact pour l'analyse complète
    goToImpact(): void {
        if (this.selectedNode?.id) {
            this.router.navigate(['/impact'], {
                queryParams: { serviceId: this.selectedNode.id }
            });
        } else {
            this.router.navigate(['/impact']);
        }
    }

    // ✅ NOUVEAU : réinitialiser toute la simulation
    resetSimulation(): void {
        this.simulationActive  = false;
        this.simulationResult  = null;
        this.simulationLoading = false;
        this.selectedNode      = null;
        this.resetNodeColors();
        this.cdr.detectChanges();
    }

    // ✅ NOUVEAU : classe PrimeNG severity selon sévérité
    getSeverityClass(severity: string):
        'danger' | 'warn' | 'info' | 'success' | 'secondary' | 'contrast' | undefined {

        const map: Record<string, 'danger' | 'warn' | 'info' | 'success'> = {
            'CRITICAL': 'danger',
            'HIGH':     'warn',
            'MEDIUM':   'info',
            'LOW':      'success'
        };
        return map[severity] ?? undefined;
    }

    // Appliquer les filtres
    applyFilters(): void {
        setTimeout(() => this.buildGraph(), 100);
    }

    // Réinitialiser les filtres
    resetFilters(): void {
        this.filterTier    = null;
        this.filterStatus  = null;
        this.selectedNode  = null;
        this.simulationActive  = false;  // ✅ NOUVEAU
        this.simulationResult  = null;   // ✅ NOUVEAU
        this.simulationLoading = false;  // ✅ NOUVEAU
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
        this.selectedNode      = null;
        this.simulationActive  = false;  // ✅ NOUVEAU
        this.simulationResult  = null;   // ✅ NOUVEAU
        this.simulationLoading = false;  // ✅ NOUVEAU
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
