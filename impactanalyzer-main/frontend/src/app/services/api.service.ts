import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Service } from '../models/service.model';
import { Client } from '../models/client.model';
import { Dependency } from '../models/dependency.model';
import { ImpactDTO } from '../models/impact.dto.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // ========== SERVICES ==========
  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.baseUrl}/services`);
  }

  getServiceById(id: number): Observable<Service> {
    return this.http.get<Service>(`${this.baseUrl}/services/${id}`);
  }

  createService(service: Service): Observable<Service> {
    return this.http.post<Service>(`${this.baseUrl}/services`, service);
  }

  updateService(id: number, service: Service): Observable<Service> {
    return this.http.put<Service>(`${this.baseUrl}/services/${id}`, service);
  }

  updateServiceStatus(id: number, status: string): Observable<Service> {
    return this.http.patch<Service>(`${this.baseUrl}/services/${id}`, { status: status });
  }

  // ========== LIMINAIRES ==========
  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/clients`);
  }

  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/clients/${id}`);
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.baseUrl}/clients`, client);
  }

  updateClient(id: number, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/clients/${id}`, client);
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clients/${id}`);
  }

  // ========== DEPENDANCES ==========
  getDependencies(): Observable<Dependency[]> {
    return this.http.get<Dependency[]>(`${this.baseUrl}/dependencies`);
  }

  getDependencyById(id: number): Observable<Dependency> {
    return this.http.get<Dependency>(`${this.baseUrl}/dependencies/${id}`);
  }

  createDependency(dependency: any): Observable<Dependency> {
    return this.http.post<Dependency>(`${this.baseUrl}/dependencies`, dependency);
  }

  deleteDependency(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/dependencies/${id}`);
  }

  // ========== CLIENT-SERVICES ==========
  getClientServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/client-services`);
  }

  createClientService(clientService: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/client-services`, clientService);
  }

  deleteClientService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/client-services/${id}`);
  }

  // ========== IMPACT ==========
  simulateImpact(serviceId: number): Observable<ImpactDTO> {
    return this.http.post<ImpactDTO>(`${this.baseUrl}/impact/simulate/${serviceId}`, {});
  }
}
