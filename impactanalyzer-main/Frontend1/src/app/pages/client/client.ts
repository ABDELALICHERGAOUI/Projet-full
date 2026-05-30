import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Client } from '../../models/client.model';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { HttpClient } from '@angular/common/http';

import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';

@Component({
    selector: 'app-client',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, ToolbarModule, ToastModule,
        ConfirmDialogModule, SelectModule,
        IconFieldModule, InputIconModule,
        TagModule, TooltipModule, DividerModule,
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './client.html',
    styleUrl: './client.css'
})
export class ClientComponent implements OnInit {

    // ── Clients ───────────────────────────────────────
    clients: Client[] = [];
    isLoading = true;
    errorMessage = '';
    clientDialog = false;
    isEditMode = false;
    formClient: Partial<Client> = {};
    selectedClientId: number | null = null;
    submitted = false;
    searchValue = '';
    selectedClients: Client[] = [];
    cols: any[] = [];

    @ViewChild('dt') dt!: Table;

    segmentOptions = [
        { label: '👑 VIP', value: 'VIP' },
        { label: 'Standard', value: 'STANDARD' }
    ];

    // ── Associations Client-Service ───────────────────
    assocDialog = false;
    addAssocDialog = false;
    currentClient: any = null;
    clientAssociations: any[] = [];
    assocCountMap: { [clientId: number]: number | undefined } = {};
    selectedNewServiceId: number | null = null;
    availableServices: any[] = [];
    allServices: any[] = [];
    submittedAssoc = false;

    // Nœud sélectionné dans le graphe pour suppression
    selectedAssocNode: any = null;
    deleteNodeDialog = false;

    private network: any = null;
    @ViewChild('assocGraph', { static: false }) assocGraphContainer!: ElementRef;

    private apiUrl = 'http://localhost:8080';

    constructor(
        private apiService: ApiService,
        private http: HttpClient,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.getAllClients();
        this.cols = [
            { field: 'name',    header: 'Nom' },
            { field: 'email',   header: 'Email' },
            { field: 'segment', header: 'Segment' },
            { field: 'region',  header: 'Région' }
        ];
    }

    // ── CRUD Clients ──────────────────────────────────
    getAllClients() {
        this.apiService.getAllClients().subscribe({
            next: (resp: any) => {
                this.clients = resp;
                this.isLoading = false;
                this.loadAllAssocCounts();
                this.cdr.detectChanges();
            },
            error: () => {
                this.errorMessage = 'Erreur lors du chargement';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    exportCSV() { this.dt.exportCSV(); }

    deleteSelectedClients() {
        this.confirmationService.confirm({
            message: `Supprimer ${this.selectedClients.length} clients ?`,
            header: 'Confirmer',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const ids = this.selectedClients.map(c => c.id);
                this.apiService.deleteMultipleClients(ids).subscribe({
                    next: () => {
                        this.selectedClients = [];
                        this.getAllClients();
                        this.messageService.add({
                            severity: 'success', summary: 'Supprimés',
                            detail: 'Clients supprimés', life: 3000
                        });
                    }
                });
            }
        });
    }

    openAddModal() {
        this.formClient = { name: '', email: '', segment: 'STANDARD', region: '' };
        this.isEditMode = false;
        this.submitted = false;
        this.clientDialog = true;
    }

    openEditModal(client: Client) {
        this.formClient = { ...client };
        this.selectedClientId = client.id;
        this.isEditMode = true;
        this.submitted = false;
        this.clientDialog = true;
    }

    closeModal() {
        this.clientDialog = false;
        this.submitted = false;
    }

    handleDelete(client: Client) {
        this.confirmationService.confirm({
            message: `Supprimer "${client.name}" ?`,
            header: 'Confirmer',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.apiService.deleteClient(client.id).subscribe({
                    next: () => {
                        this.getAllClients();
                        this.messageService.add({
                            severity: 'success', summary: 'Supprimé',
                            detail: `Client supprimé`, life: 3000
                        });
                    }
                });
            }
        });
    }

    handleSubmit() {
        this.submitted = true;
        if (!this.formClient.name || !this.formClient.email) return;
        const clientData = this.formClient as Client;

        if (this.isEditMode && this.selectedClientId !== null) {
            this.apiService.updateClient(this.selectedClientId, clientData).subscribe({
                next: () => {
                    this.closeModal();
                    this.getAllClients();
                    this.messageService.add({
                        severity: 'success', summary: 'Modifié',
                        detail: 'Client mis à jour', life: 3000
                    });
                }
            });
        } else {
            this.apiService.createClient(clientData).subscribe({
                next: () => {
                    this.closeModal();
                    this.getAllClients();
                    this.messageService.add({
                        severity: 'success', summary: 'Ajouté',
                        detail: 'Client ajouté', life: 3000
                    });
                }
            });
        }
    }

    // ── Associations ──────────────────────────────────
    loadAllAssocCounts() {
        this.apiService.getAllClientServices().subscribe({
            next: (data: any[]) => {
                this.assocCountMap = {};
                data.forEach(cs => {
                    const id = cs.client?.id;
                    if (id) {
                        this.assocCountMap[id] =
                            (this.assocCountMap[id] || 0) + 1;
                    }
                });
                this.cdr.detectChanges();
            }
        });
    }

    openAssocDialog(client: Client) {
        this.currentClient = client;
        this.clientAssociations = [];
        this.assocDialog = true;

        // Charger tous les services pour le select
        this.apiService.getServices().subscribe({
            next: (data: any[]) => {
                this.allServices = data;
            }
        });

        this.loadAssociations(client.id);
    }

    loadAssociations(clientId: number) {
        this.apiService.getAllClientServices().subscribe({
            next: (data: any[]) => {
                this.clientAssociations = data.filter(
                    cs => cs.client?.id === clientId
                );
                // Services déjà associés
                const associatedIds = this.clientAssociations
                    .map(cs => cs.service?.id);
                // Services disponibles = pas encore associés
                this.availableServices = this.allServices
                    .filter(s => !associatedIds.includes(s.id))
                    .map(s => ({ label: s.name, value: s.id }));

                this.assocCountMap[clientId] =
                    this.clientAssociations.length;
                this.cdr.detectChanges();
                setTimeout(() => this.buildAssocGraph(), 100);
            }
        });
    }

    buildAssocGraph() {
        if (!this.assocGraphContainer) return;
        if (this.network) { this.network.destroy(); }

        const nodes: any[] = [];
        const edges: any[] = [];

        // Nœud client central
        nodes.push({
            id: 'client_' + this.currentClient.id,
            label: this.currentClient.name,
            color: { background: '#6366f1', border: '#4338ca' },
            font: { color: '#fff', bold: true, size: 14 },
            shape: 'box',
            size: 30
        });

        // Nœuds services associés
        this.clientAssociations.forEach(cs => {
            const service = cs.service;
            if (!service) return;

            const tierColors: any = {
                'CRITICAL': '#ef4444',
                'HIGH':     '#f97316',
                'MEDIUM':   '#6366f1',
                'LOW':      '#10b981'
            };
            const bg = tierColors[service.tier] || '#64748b';

            nodes.push({
                id: 'svc_' + cs.id,  // utilise l'ID de l'association
                label: service.name,
                title: `Tier: ${service.tier}\nStatus: ${service.status}`,
                color: {
                    background: bg,
                    border: bg,
                    hover: { background: '#ef4444', border: '#b91c1c' }
                },
                font: { color: '#fff', size: 12 },
                shape: 'ellipse',
                // Stocker l'ID de l'association pour la suppression
                assocId: cs.id,
                serviceName: service.name
            });

            edges.push({
                from: 'client_' + this.currentClient.id,
                to: 'svc_' + cs.id,
                arrows: 'to',
                color: { color: '#94a3b8' },
                smooth: { enabled: true, type: 'cubicBezier', roundness: 0.3 }
            });
        });

        const options: Options = {
            layout: {
                hierarchical: {
                    direction: 'LR',
                    sortMethod: 'directed',
                    levelSeparation: 200,
                    nodeSpacing: 100
                }
            },
            physics: { enabled: false },
            interaction: {
                hover: true,
                tooltipDelay: 100
            }
        };

        this.network = new Network(
            this.assocGraphContainer.nativeElement,
            { nodes: new DataSet(nodes), edges: new DataSet(edges) },
            options
        );

        // ✅ Clic sur un nœud service → dialog suppression
        this.network.on('click', (params: any) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                if (String(nodeId).startsWith('svc_')) {
                    const node = nodes.find(n => n.id === nodeId);
                    if (node) {
                        this.selectedAssocNode = node;
                        this.deleteNodeDialog = true;
                        this.cdr.detectChanges();
                    }
                }
            }
        });
    }

    confirmDeleteAssoc() {
        if (!this.selectedAssocNode) return;
        this.apiService.deleteClientService(
            this.selectedAssocNode.assocId
        ).subscribe({
            next: () => {
                this.deleteNodeDialog = false;
                this.selectedAssocNode = null;
                this.loadAssociations(this.currentClient.id);
                this.messageService.add({
                    severity: 'success', summary: 'Supprimée',
                    detail: 'Association supprimée', life: 3000
                });
            }
        });
    }

    openAddAssocDialog() {
        this.selectedNewServiceId = null;
        this.submittedAssoc = false;
        this.addAssocDialog = true;
    }

    handleAddAssoc() {
        this.submittedAssoc = true;
        if (!this.selectedNewServiceId) return;

        const payload = {
            client: { id: this.currentClient.id },
            service: { id: this.selectedNewServiceId }
        };

        this.apiService.createClientService(payload as any).subscribe({
            next: () => {
                this.addAssocDialog = false;
                this.loadAssociations(this.currentClient.id);
                this.messageService.add({
                    severity: 'success', summary: 'Ajoutée',
                    detail: 'Association ajoutée', life: 3000
                });
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err?.error?.message || 'Erreur lors de l\'ajout',
                    life: 3000
                });
            }
        });
    }

    closeAssocDialog() {
        this.assocDialog = false;
        if (this.network) { this.network.destroy(); this.network = null; }
    }
    getTierSeverity(tier: string): any {
        const map: any = {
            'CRITICAL': 'danger', 'HIGH': 'warn',
            'MEDIUM': 'info', 'LOW': 'success'
        };
        return map[tier] || 'info';
    }
}
