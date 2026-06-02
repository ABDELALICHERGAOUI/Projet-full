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
                    const id = Number(cs.clientId);
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
                // ✅ Force la comparaison en number
                this.clientAssociations = data.filter(
                    cs => Number(cs.clientId) === Number(clientId)
                );

                // Services déjà associés
                const associatedIds = this.clientAssociations
                    .map(cs => Number(cs.serviceId));

                // Services disponibles
                this.availableServices = this.allServices
                    .filter(s => !associatedIds.includes(Number(s.id)))
                    .map(s => ({ label: s.name, value: s.id }));

                this.assocCountMap[clientId] = this.clientAssociations.length;
                this.cdr.detectChanges();
                setTimeout(() => this.buildAssocGraph(), 150); // ✅ augmente timeout
            }
        });
    }

    buildAssocGraph() {
        if (!this.assocGraphContainer) return;
        if (this.network) { this.network.destroy(); }

        const nodes: any[] = [];
        const edges: any[] = [];

        // Nœud client
        nodes.push({
            id: 'client_' + this.currentClient.id,
            label: this.currentClient.name,
            color: {
                background: '#1e293b',
                border: '#6366f1',
                highlight: { background: '#1e293b', border: '#818cf8' }
            },
            font: { color: '#ffffff', bold: true, size: 16 },
            shape: 'box',
            borderWidth: 3,
            size: 35
        });

        this.clientAssociations.forEach(cs => {

            // ✅ Label par défaut si serviceName est null
            const label = cs.serviceName || `Service #${cs.serviceId}`;

            const tierColors: any = {
                'CRITICAL': { bg: '#fef2f2', border: '#ef4444', font: '#991b1b' },
                'HIGH':     { bg: '#fff7ed', border: '#f97316', font: '#9a3412' },
                'MEDIUM':   { bg: '#eff6ff', border: '#3b82f6', font: '#1e40af' },
                'LOW':      { bg: '#f0fdf4', border: '#22c55e', font: '#166634' }
            };
            const colors = tierColors[cs.serviceTier] || tierColors['MEDIUM'];

            nodes.push({
                id: 'svc_' + cs.id,
                label: label,                           // ✅ label sécurisé
                title: `🔧 Tier: ${cs.serviceTier || '?'}\n📡 Status: ${cs.serviceStatus || '?'}`,
                color: {
                    background: colors.bg,
                    border: colors.border,
                    hover: { background: '#fee2e2', border: '#ef4444' }
                },
                font: { color: colors.font, size: 14 },
                shape: 'ellipse',
                borderWidth: 2,
                assocId: cs.id,
                serviceName: label                      // ✅ aussi sécurisé
            });

            edges.push({
                from: 'client_' + this.currentClient.id,
                to: 'svc_' + cs.id,
                arrows: 'to',
                color: { color: '#94a3b8', highlight: '#6366f1' },
                width: 2,
                smooth: { enabled: true, type: 'cubicBezier', roundness: 0.3 }
            });
        });

        const options: Options = {
            layout: {
                hierarchical: {
                    direction: 'UD',
                    sortMethod: 'directed',
                    levelSeparation: 150,
                    nodeSpacing: 150
                }
            },
            physics: { enabled: false },
            interaction: { hover: true, tooltipDelay: 100 }
        };

        this.network = new Network(
            this.assocGraphContainer.nativeElement,
            { nodes: new DataSet(nodes), edges: new DataSet(edges) },
            options
        );

        // Clic sur nœud service → dialog suppression
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
            clientId: this.currentClient.id,
            serviceId: this.selectedNewServiceId
        };

        this.apiService.createClientService(payload).subscribe({
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
