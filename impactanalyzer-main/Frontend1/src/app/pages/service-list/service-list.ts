import { Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { Component, OnInit, ChangeDetectorRef,
    ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
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
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';


@Component({
    selector: 'app-service-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, ToolbarModule, ToastModule,
        ConfirmDialogModule, SelectModule,
        IconFieldModule, InputIconModule,
        TagModule, InputNumberModule, DividerModule,TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './service-list.html',
    styleUrl: './service-list.css'
})
export class ServiceListComponent implements OnInit {

    // ── Services ──────────────────────────────────────
    services: any[] = [];
    selectedServices: any[] = [];
    serviceDialog = false;
    isEditMode = false;
    submitted = false;
    selectedServiceId: number | null = null;
    searchValue = '';
    formService: any = {
        name: '', description: '',
        tier: 'MEDIUM', ownerTeam: '',
        sla: null, status: 'UP'
    };
    @ViewChild('dt') dt!: Table;
    cols: any[] = [];

    // ── Dépendances ───────────────────────────────────
    depDialog = false;           // Dialog graphe + liste
    addDepDialog = false;        // Dialog ajout dépendance
    currentService: any = null;  // Service sélectionné
    dependencies: any[] = [];    // Dépendances du service
    formDep: any = {
        dependsOnId: null,
        criticality: 'MEDIUM',
        dependencyType: 'SYNC_API'
    };
    submittedDep = false;
    private network: any = null;
    depCountMap: { [serviceId: number]: number } = {};

    @ViewChild('depGraph', { static: false })
    depGraphContainer!: ElementRef;

    @ViewChild('csvInput') csvInput!: ElementRef;
    importResultDialog = false;
    importResult: any  = null;
    importLoading      = false;
    // Options selects
    tierOptions = [
        { label: '🔴 CRITICAL', value: 'CRITICAL' },
        { label: '🟠 HIGH',     value: 'HIGH' },
        { label: '🟡 MEDIUM',   value: 'MEDIUM' },
        { label: '🟢 LOW',      value: 'LOW' }
    ];
    statusOptions = [
        { label: 'UP',   value: 'UP' },
        { label: 'DOWN', value: 'DOWN' }
    ];
    criticalityOptions = [
        { label: '🔴 HIGH',   value: 'HIGH' },
        { label: '🟡 MEDIUM', value: 'MEDIUM' },
        { label: '🟢 LOW',    value: 'LOW' }
    ];
    depTypeOptions = [
        { label: 'SYNC_API (appel bloquant)',  value: 'SYNC_API' },
        { label: 'ASYNC_EVENT (async)',         value: 'ASYNC_EVENT' },
        { label: 'DB (base de données)',        value: 'DB' }
    ];

    // Services disponibles pour le select (sans le service courant)
    availableServices: any[] = [];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef,
        private apiService: ApiService,
    ) {}


    ngOnInit(): void {
        this.loadServices();
        this.cols = [
            { field: 'name',        header: 'Nom' },
            { field: 'description', header: 'Description' },
            { field: 'tier',        header: 'Tier' },
            { field: 'ownerTeam',   header: 'Équipe' },
            { field: 'sla',         header: 'SLA' },
            { field: 'status',      header: 'Status' }
        ];
    }

    // ── CRUD Services ─────────────────────────────────
    loadServices(): void {
        this.apiService.getServices().subscribe({
            //this.http.get<any[]>(`${this.apiUrl}/services`).subscribe({
            next: (data) => {
                this.services = data;
                this.loadAllDependencyCounts();
                this.cdr.detectChanges();
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: 'Erreur lors du chargement', life: 3000
            })
        });
    }

    exportCSV() { this.dt.exportCSV(); }

    openAddModal() {
        this.formService = { name: '', description: '',
            tier: 'MEDIUM', ownerTeam: '',
            sla: null, status: 'UP' };
        this.isEditMode = false;
        this.submitted = false;
        this.serviceDialog = true;
    }

    openEdit(service: any) {
        this.formService = { ...service };
        this.selectedServiceId = service.id;
        this.isEditMode = true;
        this.submitted = false;
        this.serviceDialog = true;
    }

    closeServiceModal() {
        this.serviceDialog = false;
        this.submitted = false;
    }

    /*handleSubmit() {
        this.submitted = true;
        if (!this.formService.name || !this.formService.description) return;
        const url = this.isEditMode
            ? `${this.apiUrl}/services/${this.selectedServiceId}`
            : `${this.apiUrl}/services`;
        const method = this.isEditMode ? 'put' : 'post';
        this.http[method](url, this.formService).subscribe({
            next: () => {
                this.closeServiceModal();
                this.loadServices();
        // ✅ Message différent selon ajout ou modification
        if (this.isEditMode) {
            this.messageService.add({
                severity: 'success',
                summary: '✅ Service modifié',
                detail: `Le service "${this.formService.name}" a été mis à jour avec succès.`,
                life: 4000
            });
        } else {
            this.messageService.add({
                severity: 'success',
                summary: '✅ Service ajouté',
                detail: `Le service "${this.formService.name}" a été ajouté avec succès.`,
                life: 4000
            });
        }
    },
    error: (err) => {
        // ✅ Message erreur
        this.messageService.add({
            severity: 'error',
            summary: '❌ Erreur',
            detail: err?.error?.message || 'Une erreur est survenue. Veuillez réessayer.',
        life: 5000
    });
}
});
}*/
    handleSubmit() {
        this.submitted = true;
        if (!this.formService.name || !this.formService.description) return;

        // ✅ Convertir sla en string pour le backend (ServiceEntity.sla = String)
        const payload = {
            ...this.formService,
            sla: this.formService.sla != null
                ? this.formService.sla.toString()
                : null
        };

        // ✅ ApiService au lieu de HttpClient direct
        const request = this.isEditMode
            ? this.apiService.updateService(this.selectedServiceId!, payload)
            : this.apiService.createService(payload);

        request.subscribe({
            next: () => {
                this.closeServiceModal();
                this.loadServices();

                // ✅ Message différent selon ajout ou modification
                if (this.isEditMode) {
                    this.messageService.add({
                        severity: 'success',
                        summary: '✅ Service modifié',
                        detail: `Le service "${this.formService.name}" a été mis à jour avec succès.`,
                        life: 4000
                    });
                } else {
                    this.messageService.add({
                        severity: 'success',
                        summary: '✅ Service ajouté',
                        detail: `Le service "${this.formService.name}" a été ajouté avec succès.`,
                        life: 4000
                    });
                }
            },
            error: (err) => {
                // ✅ Message erreur
                this.messageService.add({
                    severity: 'error',
                    summary: '❌ Erreur',
                    detail: err?.error?.message
                        || 'Une erreur est survenue. Veuillez réessayer.',
                    life: 5000
                });
            }
        });
    }
    deleteService(service: any) {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer "${service.name}" ?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.apiService.deleteService(service.id).subscribe({
                    next: () => {
                        this.loadServices();
                        // ✅ Message succès suppression
                        this.messageService.add({
                            severity: 'success',
                            summary: '🗑️ Service supprimé',
                            detail: `Le service "${service.name}" a été supprimé avec succès.`,
                            life: 4000
                        });
                    },
                    error: () => {
                        // ✅ Message erreur suppression
                        this.messageService.add({
                            severity: 'error',
                            summary: '❌ Erreur',
                            detail: 'Erreur lors de la suppression du service.',
                            life: 5000
                        });
                    }
                });
            }
        });
    }
    deleteSelectedServices() {
        this.confirmationService.confirm({
            message: `Supprimer ${this.selectedServices.length} services ?`,
            header: 'Confirmer',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                Promise.all(
                    this.selectedServices.map(s =>
                        this.apiService.deleteService(s.id).toPromise()  // ✅ ApiService
                    )
                ).then(() => {
                    this.selectedServices = [];
                    this.loadServices();
                    this.messageService.add({
                        severity: 'success', summary: 'Supprimés',
                        detail: 'Services supprimés', life: 3000
                    });
                });
            }
        });
    }

    getStatusSeverity(status: string) {
        return status === 'UP' ? 'success' : 'danger';
    }

    getTierSeverity(tier: string) {
        const map: any = {
            'CRITICAL': 'danger', 'HIGH': 'warn',
            'MEDIUM': 'info',     'LOW': 'success'
        };
        return map[tier] || 'info';
    }

    // ── Dépendances ───────────────────────────────────
    openDepDialog(service: any) {
        this.currentService = service;
        this.dependencies = [];
        this.depDialog = true;

        // Services disponibles = tous sauf le service courant
        this.availableServices = this.services
            .filter(s => s.id !== service.id)
            .map(s => ({ label: s.name, value: s.id }));

        this.loadDependencies(service.id);
    }

    loadDependencies(serviceId: number) {
        this.apiService.getDependencies().subscribe({
                next: (data) => {
                    // Filtrer seulement les dépendances de ce service
                    this.dependencies = data.filter(
                        d => d.service?.id === serviceId
                    );
                    this.depCountMap[serviceId] = this.dependencies.length;
                    this.cdr.detectChanges();
                    setTimeout(() => this.buildDepGraph(), 100);
                }
            });
    }
//  Charger le count de toutes les dépendances
    loadAllDependencyCounts(): void {
        this.apiService.getDependencies().subscribe({
            next: (data) => {
                // Compter les dépendances par service
                this.depCountMap = {};
                data.forEach(dep => {
                    const id = dep.service?.id;
                    if (id) {
                        this.depCountMap[id] = (this.depCountMap[id] || 0) + 1;
                    }
                });
                this.cdr.detectChanges();
            }
        });
    }
    buildDepGraph() {
        if (!this.depGraphContainer) return;
        if (this.network) { this.network.destroy(); }

        const nodes: any[] = [];
        const edges: any[] = [];

        // Nœud principal
        nodes.push({
            id: this.currentService.id,
            label: this.currentService.name,
            color: { background: '#6366f1', border: '#4338ca' },
            font: { color: '#fff', bold: true },
            shape: 'box', size: 25
        });

        // Couleurs des flèches selon criticité
        const edgeColors: any = {
            'HIGH':   '#ef4444',   // rouge
            'MEDIUM': '#f59e0b',   // orange
            'LOW':    '#10b981'    // vert
        };

        this.dependencies.forEach(dep => {
            const depService = dep.dependsOn;
            if (!depService) return;

            nodes.push({
                id: depService.id,
                label: depService.name,
                color: { background: '#64748b', border: '#475569' },
                font: { color: '#fff' },
                shape: 'ellipse',
                title: `Type: ${dep.dependencyType}\nCriticité: ${dep.criticality}`
            });

            const arrowColor = edgeColors[dep.criticality] || edgeColors['MEDIUM'];

            edges.push({
                from: this.currentService.id,
                to: depService.id,
                arrows: 'to',
                // ✅ Label = type de dépendance
                label: dep.dependencyType,
                font: { size: 11, color: '#374151', strokeWidth: 2, strokeColor: '#fff' },
                // ✅ Couleur selon criticité
                color: { color: arrowColor, highlight: arrowColor },
                width: dep.criticality === 'HIGH' ? 3 : 2,
                dashes: dep.dependencyType === 'ASYNC_EVENT'  // ✅ pointillés pour async
            });
        });

        const options: Options = {
            layout: {
                hierarchical: {
                    direction: 'LR',
                    sortMethod: 'directed',
                    levelSeparation: 200,
                    nodeSpacing: 120
                }
            },
            physics: { enabled: false },
            edges: {
                smooth: { enabled: true, type: 'cubicBezier', roundness: 0.4 }
            }
        };

        this.network = new Network(
            this.depGraphContainer.nativeElement,
            { nodes: new DataSet(nodes), edges: new DataSet(edges) },
            options
        );
    }

    openAddDepDialog() {
        this.formDep = {
            dependsOnId: null,
            criticality: 'MEDIUM',
            dependencyType: 'SYNC_API'
        };
        this.submittedDep = false;
        this.addDepDialog = true;
    }

    handleAddDep() {
        this.submittedDep = true;
        if (!this.formDep.dependsOnId) return;

        const body = {
            serviceId: this.currentService.id,
            dependsOnId: Number(this.formDep.dependsOnId),
            criticality: this.formDep.criticality,
            dependencyType: this.formDep.dependencyType
        };

        this.apiService.createDependency(body).subscribe({
            next: () => {
                this.addDepDialog = false;
                this.loadDependencies(this.currentService.id);
                this.messageService.add({
                    severity: 'success', summary: 'Ajoutée',
                    detail: 'Dépendance ajoutée', life: 3000
                });
            },
            error: (err) => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: err?.error?.message || 'Erreur lors de l\'ajout',
                life: 3000
            })
        });
    }

    deleteDependency(dep: any) {
        this.confirmationService.confirm({
            message: `Supprimer la dépendance vers "${dep.dependsOn?.name}" ?`,
            header: 'Confirmer',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.apiService.deleteDependency(dep.id).subscribe({
                    next: () => {
                            this.loadDependencies(this.currentService.id);
                            this.messageService.add({
                                severity: 'success', summary: 'Supprimée',
                                detail: 'Dépendance supprimée', life: 3000
                            });
                        }
                    });
            }
        });
    }

    closeDepDialog() {
        this.depDialog = false;
        if (this.network) { this.network.destroy(); this.network = null; }
    }
    closeModal() {
        this.closeServiceModal();
    }

    // ── Import CSV ─────────────────────────────────────

    triggerImport(): void {
        this.csvInput.nativeElement.value = '';
        this.csvInput.nativeElement.click();
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.messageService.add({
                severity: 'error',
                summary: '❌ Format invalide',
                detail: 'Veuillez sélectionner un fichier .csv',
                life: 4000
            });
            return;
        }

        this.sendImport(file);
    }

    sendImport(file: File): void {
        this.importLoading = true;

        this.messageService.add({
            severity: 'info',
            summary: 'Import en cours...',
            detail: `Envoi de "${file.name}" vers le serveur...`,
            life: 2000
        });

        this.apiService.importServices(file).subscribe({
            next: (result) => {
                this.importLoading = false;
                this.importResult  = result;
                this.importResultDialog = true;
                this.loadServices();

                if (result.imported > 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: '✅ Import terminé',
                        detail: `${result.imported} service(s) importé(s) avec succès.`,
                        life: 4000
                    });
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: '⚠️ Aucun import',
                        detail: 'Aucun service importé. Vérifiez les erreurs.',
                        life: 5000
                    });
                }
            },
            error: (err) => {
                this.importLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: '❌ Erreur import',
                    detail: err?.error?.errorMessages?.[0]
                        || err?.error?.message
                        || 'Erreur lors de l\'import.',
                    life: 5000
                });
            }
        });
    }
}
