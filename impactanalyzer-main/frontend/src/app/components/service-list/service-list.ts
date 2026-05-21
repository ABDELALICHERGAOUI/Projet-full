import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './service-list.html',
  styleUrls: ['./service-list.css'],
})
export class ServiceListComponent implements OnInit {
  services: any[] = [];
  editService: any = null;
  showModal = false;
  isEditMode = false;
  formService: any = { name: '', description: '', status: 'UP' };
  selectedServiceId: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    fetch('http://localhost:8080/services')
      .then((res) => res.json())
      .then((data) => {
        this.services = data;
        this.cdr.detectChanges();
      })
      .catch((err) => console.error(err));
  }
  openAddModal() {
    this.isEditMode = false;
    this.formService = { name: '', description: '', status: 'UP' };
    this.showModal = true;
  }

  openEdit(service: any) {
    this.isEditMode = true;
    this.selectedServiceId = service.id;
    this.formService = { ...service };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  handleSubmit() {
    if (!this.formService.name || !this.formService.description) {
      alert("Tous les champs sont obligatoires");
      return;
    }

    if (this.isEditMode && this.selectedServiceId !== null) {
      // UPDATE
      fetch(`http://localhost:8080/services/${this.selectedServiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formService),
      })
        .then(() => {
          this.closeModal();
          this.loadServices();
        });
    } else {
      // CREATE
      fetch(`http://localhost:8080/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formService),
      })
        .then(() => {
          this.closeModal();
          this.loadServices();
        });
    }
  }

  deleteService(id: number): void {
    if (confirm('Supprimer ce service ?')) {
      fetch(`http://localhost:8080/services/${id}`, { method: 'DELETE' })
        .then(() => this.loadServices())
        .catch((err) => console.error(err));
    }
  }
  updateService(): void {
    if (!this.editService) return;
    fetch(`http://localhost:8080/services/${this.editService.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: this.editService.name,
        description: this.editService.description,
      }),
    })
      .then(() => {
        this.editService = null;
        this.loadServices();
      })
      .catch((err) => console.error(err));
  }
  cancelEdit(): void {
    this.editService = null;
  }


}
