import { Component, OnInit, ChangeDetectorRef ,ViewChild  } from '@angular/core';
import { Client } from '../../models/client.model';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG Modules
import { Table ,TableModule } from 'primeng/table';
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

@Component({
    selector: 'app-client',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        ToolbarModule,
        ToastModule,
        ConfirmDialogModule,
        SelectModule,
        IconFieldModule,
        InputIconModule,
        TagModule,
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './client.html',
    styleUrl: './client.css'
})
export class ClientComponent implements OnInit {
    clients: Client[] = [];
    isLoading = true;
    errorMessage = '';

    @ViewChild('dt') dt!: Table;
    selectedClients: Client[] = [];
    cols: any[] = [];

    // Dialog
    clientDialog = false;
    isEditMode = false;
    formClient: Partial<Client> = {};
    selectedClientId: number | null = null;
    submitted = false;

    // Recherche
    searchValue = '';

    // Options segment
    segmentOptions = [
        { label: '👑 VIP', value: 'VIP' },
        { label: 'Standard', value: 'STANDARD' }
    ];

    constructor(
        private apiService: ApiService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.getAllClients();
        //Définir les colonnes pour l'export
        this.cols = [
            { field: 'name',    header: 'Nom' },
            { field: 'email',   header: 'Email' },
            { field: 'segment', header: 'Segment' },
            { field: 'region',  header: 'Région' }
        ];
    }

    getAllClients() {
        this.apiService.getAllClients().subscribe({
            next: (resp: any) => {
                this.clients = resp;
                this.isLoading = false;
                this.cdr.detectChanges();  // ← rajoute
            },
            error: (err: any) => {
                this.errorMessage = 'Erreur lors du chargement';
                this.isLoading = false;
                this.cdr.detectChanges();  // ← rajoute
            }
        });
    }

    //-------- supprimer la sélection -----
    deleteSelectedClients() {
        this.confirmationService.confirm({
            message: `Voulez-vous supprimer les ${this.selectedClients.length} clients sélectionnés ?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const ids = this.selectedClients.map(c => c.id);
                this.apiService.deleteMultipleClients(ids).subscribe({
                    next: () => {
                        this.selectedClients = [];
                        this.getAllClients();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Supprimés',
                            detail: 'Clients supprimés avec succès',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    // ---- Ouvrir dialog AJOUT ----
    openAddModal() {
        this.formClient = { name: '', email: '', segment: 'STANDARD', region: '' };
        this.isEditMode = false;
        this.submitted = false;
        this.clientDialog = true;
    }

    // ---- Ouvrir dialog MODIFICATION ----
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

    // ---- Supprimer avec confirmation ----
    handleDelete(client: Client) {
        this.confirmationService.confirm({
            message: `Voulez-vous supprimer le client "${client.name}" ?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.apiService.deleteClient(client.id).subscribe({
                    next: () => {
                        this.getAllClients();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Supprimé',
                            detail: `Client "${client.name}" supprimé`,
                            life: 3000
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Erreur lors de la suppression',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    // ---- Soumettre (add ou edit) ----
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
                        severity: 'success',
                        summary: 'Modifié',
                        detail: 'Client mis à jour avec succès',
                        life: 3000
                    });
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Erreur lors de la modification',
                        life: 3000
                    });
                }
            });
        } else {
            this.apiService.createClient(clientData).subscribe({
                next: () => {
                    this.closeModal();
                    this.getAllClients();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Ajouté',
                        detail: 'Client ajouté avec succès',
                        life: 3000
                    });
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Erreur lors de l\'ajout',
                        life: 3000
                    });
                }
            });
        }
    }
//  Export CSV
    exportCSV() {
        this.dt.exportCSV();
    }
}
