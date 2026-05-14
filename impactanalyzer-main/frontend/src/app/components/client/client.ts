import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Client } from '../../models/client.model';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-client',
  imports: [CommonModule,FormsModule],
  templateUrl: './client.html',
  styleUrl: './client.css',
})
//export class Client {}

export class ClientComponent implements OnInit {
  clients: Client[] = [];
  isLoading = true;
  errorMessage = '';
  // ---- Modal ----
  showModal = false;
  isEditMode = false;
  formClient: Partial<Client> = { name: '', email: '' };
  selectedClientId: number | null = null

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {

  }

  ngOnInit(): void {
    this.getAllClients();
  }
  getAllClients() {
    this.apiService.getAllClients().subscribe({
      next: (resp: any) => {
        this.clients = resp;
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
  handleDelete(client: Client) {
    let v = confirm("etes vous sure de vouloir supprimer ?");
    if(v==true){
      this.apiService.deleteClient(client.id).subscribe({
        next : value => {
          this.getAllClients();
        },
        error : err => {
          console.log(err);
        }
      });
    }

  }


  // ---- Ouvrir modal AJOUT ----
  openAddModal() {
    this.isEditMode = false;
    this.formClient = { name: '', email: '' };
    this.errorMessage = '';
    this.showModal = true;
  }

  // ---- Ouvrir modal MODIFICATION ----
  openEditModal(client: Client) {
    this.isEditMode = true;
    this.selectedClientId = client.id;
    this.formClient = { name: client.name, email: client.email };
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // ---- Soumettre (add ou edit) ----
  handleSubmit() {
    if (!this.formClient.name || !this.formClient.email) {
      this.errorMessage = 'Tous les champs sont obligatoires.';
      return;
    }

    const clientData = this.formClient as Client;

    if (this.isEditMode && this.selectedClientId !== null) {
      // MODIFIER
      this.apiService.updateClient(this.selectedClientId, clientData).subscribe({
        next: () => {
          this.closeModal();
          this.getAllClients();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la modification.';
          console.log(err);
        }
      });
    } else {
      // AJOUTER
      this.apiService.createClient(clientData).subscribe({
        next: () => {
          this.closeModal();
          this.getAllClients();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de l\'ajout.';
          console.log(err);
        }
      });
    }
  }
}
