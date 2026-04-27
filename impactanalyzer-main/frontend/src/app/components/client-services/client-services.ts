import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ClientserviceApi } from '../../services/clientservice-api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client } from '../../models/client.model';
import { ClientService } from '../../models/ClientService.model';
import { ApiService } from '../../services/api.service';
import { Service } from '../../models/service.model';

@Component({
  selector: 'app-client-services',
  imports: [CommonModule, FormsModule],
  templateUrl: './client-services.html',
  styleUrl: './client-services.css',
})
export class ClientServices implements OnInit {
  clientservice: ClientService[] = [];
  isLoading = true;
  errorMessage = '';
  // ---- Modal ----
  showModal = false;
  clients: Client[] = [];
  services: Service[] = [];
  selectedClientId: number | null = null;
  selectedServiceId: number | null = null;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getAllClientService();
    this.loadClients();
    this.loadServices();
  }
  getAllClientService() {
    this.apiService.getAllClientServices().subscribe({
      next: (resp: any) => {
        this.clientservice = resp;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.errorMessage = 'Erreur lors du chargement';
        this.isLoading = false;
      }
    });
  }

  handleDelete(clientservice: ClientService) {
    let v = confirm('etes vous sure de vouloir supprimer ?');
    if (v == true) {
      this.apiService.deleteClientService(clientservice.id).subscribe({
        next : value => {
          this.getAllClientService();
        },
        error : err => {
          console.log(err);
        }
      });
    }
  }

  loadClients() {
    this.apiService.getAllClients().subscribe({
      next: (data) => {
        console.log('Clients reçus :', data); // ← vérifie ici
        this.clients = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.log('Erreur Client',err)
    });
  }

  loadServices() {
    this.apiService.getServices().subscribe({
      next: (data) => {
        console.log('Services reçus :', data);
        this.services = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.log('Erreur services :',err)
    });
  }
  // ---- Modal ----
  openAddModal() {
    this.selectedClientId = null;
    this.selectedServiceId = null;
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  handleSubmit() {
    if (!this.selectedClientId || !this.selectedServiceId) {
      this.errorMessage = 'Veuillez sélectionner un client et un service.';
      return;
    }

    const payload = {
      client: { id: this.selectedClientId },
      service: { id: this.selectedServiceId }
    };

    this.apiService.createClientService(payload as any).subscribe({
      next: () => {
        this.closeModal();
        this.getAllClientService();
      },
      error: (err) => {
        console.log(err);
        this.errorMessage = 'Erreur lors de l\'ajout.';
      }
    });
  }
}
