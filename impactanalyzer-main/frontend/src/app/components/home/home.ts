import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Client } from '../../models/client.model';
import { Service } from '../../models/service.model';
import { ClientService } from '../../models/ClientService.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {

  today: string = '';
  totalClients: number = 0;
  totalServices: number = 0;
  totalAbonnements: number = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.apiService.getAllClients().subscribe((data: Client[]) => {
      this.totalClients = data.length;
    });

    this.apiService.getServices().subscribe((data: Service[]) => {
      this.totalServices = data.length;
    });

    this.apiService.getAllClientServices().subscribe((data: ClientService[]) => {
      this.totalAbonnements = data.length;
    });
  }
}
