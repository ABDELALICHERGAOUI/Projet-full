import { Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { Component, OnInit, ChangeDetectorRef,
    ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-service-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, ToastModule,
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
        this.apiService.getServiceDeleteInfo(service.id).subscribe({
            next: (info) => {
                let message = `Êtes-vous sûr de vouloir supprimer le service "${service.name}" ?`;

                if (info.hasRelations) {
                    message =
                        `Le service "${service.name}" possède des relations avec d'autres éléments :\n\n` +
                        `- ${info.clientAssociations} association(s) avec des clients\n` +
                        `- ${info.dependencies} dépendance(s)\n\n` +
                        `Si vous continuez, ces relations seront supprimées aussi. Voulez-vous vraiment supprimer ce service ?`;
                }

                this.confirmationService.confirm({
                    message: message,
                    header: 'Confirmer la suppression',
                    icon: 'pi pi-exclamation-triangle',
                    acceptLabel: 'Oui, supprimer',
                    rejectLabel: 'Annuler',
                    acceptButtonStyleClass: 'p-button-danger',
                    rejectButtonStyleClass: 'p-button-text',

                    accept: () => {
                        this.apiService.deleteService(service.id, true).subscribe({
                            next: () => {
                                this.loadServices();

                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Service supprimé',
                                    detail: `Le service "${service.name}" a été supprimé avec ses relations.`,
                                    life: 4000
                                });
                            },
                            error: (err) => {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Erreur',
                                    detail: err?.error?.message || 'Erreur lors de la suppression du service.',
                                    life: 5000
                                });
                            }
                        });
                    }
                });
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err?.error?.message || 'Impossible de vérifier les relations du service.',
                    life: 5000
                });
            }
        });
    }
    deleteSelectedServices() {
        if (!this.selectedServices || this.selectedServices.length === 0) return;

        this.confirmationService.confirm({
            message:
                `Vous allez supprimer ${this.selectedServices.length} service(s).\n\n` +
                `Les associations clients et les dépendances liées à ces services seront également supprimées. Voulez-vous continuer ?`,
            header: 'Confirmer la suppression multiple',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',

            accept: () => {
                const requests = this.selectedServices.map(service =>
                    this.apiService.deleteService(service.id, true)
                );

                forkJoin(requests).subscribe({
                    next: () => {
                        this.selectedServices = [];
                        this.loadServices();

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Services supprimés',
                            detail: 'Les services sélectionnés ont été supprimés avec leurs relations.',
                            life: 4000
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: err?.error?.message || 'Erreur lors de la suppression multiple.',
                            life: 5000
                        });
                    }
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
        const primaryColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color')
            .trim() || '#8b5cf6';

        nodes.push({
            id: this.currentService.id,
            label: this.currentService.name,
            color: {
                background: primaryColor,
                border: primaryColor,
                highlight: {
                    background: primaryColor,
                    border: '#4c1d95'
                }
            },
            font: {
                color: '#ffffff',
                bold: true,
                size: 18,
                face: 'Arial'
            },
            shape: 'box',
            size: 45,
            margin: {
                top: 10,
                right: 16,
                bottom: 10,
                left: 16
            },
            widthConstraint: {
                minimum: 150,
                maximum: 230
            }
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
                color: {
                    background: '#eff6ff',
                    border: '#3b82f6',
                    highlight: {
                        background: '#dbeafe',
                        border: primaryColor
                    },
                    hover: {
                        background: '#dbeafe',
                        border: primaryColor
                    }
                },
                font: {
                    color: '#1e40af',
                    size: 16,
                    bold: true,
                    face: 'Arial'
                },
                shape: 'ellipse',
                size: 40,
                margin: {
                    top: 8,
                    right: 14,
                    bottom: 8,
                    left: 14
                },
                widthConstraint: {
                    minimum: 140,
                    maximum: 220
                },
                title: `Type: ${dep.dependencyType}\nCriticité: ${dep.criticality}`
            });

            const arrowColor = edgeColors[dep.criticality] || edgeColors['MEDIUM'];

            edges.push({
                from: this.currentService.id,
                to: depService.id,

                label: dep.dependencyType,
                color: { color: arrowColor, highlight: arrowColor },
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 1.25
                    }
                },
                font: {
                    size: 13,
                    color: '#374151',
                    strokeWidth: 3,
                    strokeColor: '#ffffff'
                },
                width: dep.criticality === 'HIGH' ? 4 : 3,
                dashes: dep.dependencyType === 'ASYNC_EVENT'  // ✅ pointillés pour async
            });
        });

        const options: Options = {
            layout: {
                hierarchical: {
                    direction: 'LR',
                    sortMethod: 'directed',
                    levelSeparation: 230,
                    nodeSpacing: 150
                }
            },

            nodes: {
                font: {
                    size: 16,
                    face: 'Arial'
                }
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: 'cubicBezier',
                    roundness: 0.4
                },
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 1.25
                    }
                }
            },
            physics: { enabled: false },

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
