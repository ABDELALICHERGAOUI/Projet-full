import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Service } from '../../models/service.model';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h3>📋 Liste des services</h3>
      <table
        border="1"
        cellpadding="8"
        cellspacing="0"
        style="width: 100%; border-collapse: collapse;"
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let service of services">
            <td>{{ service.id }}</td>
            <td>{{ service.name }}</td>
            <td>{{ service.description }}</td>
            <td>
              <span
                [style.color]="
                  service.status === 'UP' ? 'green' : service.status === 'DOWN' ? 'red' : 'orange'
                "
              >
                {{ service.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [],
})
export class ServiceListComponent implements OnInit {
  services: Service[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getServices().subscribe({
      next: (data) => {
        this.services = data;
      },
      error: (err) => {
        console.error('Erreur:', err);
      },
    });
  }
}
