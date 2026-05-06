import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dependency-list',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './dependency-list.html',
  styleUrls: ['./dependency-list.css'],

})
export class DependencyListComponent implements OnInit {
  dependencies: any[] = [];
  isLoading: boolean = true;
  showModal = false;
  isEditMode = false;
  services: any[] = [];
  formDependency: any = {
    serviceId: null,
    dependsOnId: null,
    impactWeight: 1
  };

  selectedDependencyId: number | null = null;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadDependencies();
    this.loadServices()
  }

  loadDependencies(): void {
    this.isLoading = true;
    this.apiService.getDependencies().subscribe({
      next: (data) => {
        this.dependencies = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
      },
    });
  }
  loadServices(): void {
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.services = data;
      },
      error: (err) => console.error(err)
    });
  }

  deleteDependency(id: number): void {
    if (confirm('Supprimer cette dépendance ?')) {
      this.apiService.deleteDependency(id).subscribe({
        next: () => {
          this.loadDependencies();
        },
        error: (err) => console.error(err),
      });
    }
  }
  openAddModal() {
    this.isEditMode = false;
    this.formDependency = {
      serviceId: null,
      dependsOnId: null,
      impactWeight: 1
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
  handleSubmit() {
    if (!this.formDependency.serviceId || !this.formDependency.dependsOnId) {
      alert("Tous les champs sont obligatoires");
      return;
    }

    if (this.formDependency.serviceId === this.formDependency.dependsOnId) {
      alert("Un service ne peut pas dépendre de lui-même !");
      return;
    }

    const body = {
      serviceId: Number(this.formDependency.serviceId),      // ✅ sécurité supplémentaire
      dependsOnId: Number(this.formDependency.dependsOnId),  // ✅
      impactWeight: this.formDependency.impactWeight
    };

    this.apiService.createDependency(body).subscribe({
      next: () => {
        this.closeModal();
        this.loadDependencies();
        this.cdr.detectChanges(); // ✅
      },
      error: (err) => {
        console.error("Erreur création dépendance:", err);
        alert("Erreur : " + (err?.error?.message || err.message || "Vérifie la console"));
      }
    });
  }


}
