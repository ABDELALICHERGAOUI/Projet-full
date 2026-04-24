import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Service } from '../../models/service.model';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-list.html',
})
export class ServiceListComponent implements OnInit {
  services: Service[] = [];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.apiService.getServices().subscribe({
      next: (data) => {
        console.log('Données reçues:', data);
        this.services = data;
        this.cdr.detectChanges(); // Force la mise à jour de l'affichage
        console.log('Services après mise à jour:', this.services.length);
      },
      error: (err) => {
        console.error('Erreur:', err);
      },
    });
  }
}
