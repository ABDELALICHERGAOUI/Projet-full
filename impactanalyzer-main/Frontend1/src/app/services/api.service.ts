import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Service } from '../models/service.model';
import { Client } from '../models/client.model';
import { Dependency } from '../models/dependency.model';
import { ImpactDTO } from '../models/impact.dto.model';
import { ClientService } from "../models/ClientService.model";

@Injectable({
    providedIn: 'root'
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
    /*
  createService(service: Service): Observable<Service> {
    return this.http.post<Service>(`${this.baseUrl}/services`, service);
  }

  updateService(id: number, service: Service): Observable<Service> {
    return this.http.put<Service>(`${this.baseUrl}/services/${id}`, service);
  }*/
    createService(service: any): Observable<any> {
        // ✅ any pour payload flexible
        return this.http.post<any>(`${this.baseUrl}/services`, service);
    }

    updateService(id: number, service: any): Observable<any> {
        // ✅ any pour payload flexible
        return this.http.put<any>(`${this.baseUrl}/services/${id}`, service);
    }

    deleteService(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/services/${id}`);
    }

    updateServiceStatus(id: number, status: string): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/services/${id}`, status);
    }

    // ========== Clients ==========
    getAllClients(): Observable<Client[]> {
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

    deleteMultipleClients(ids: number[]): Observable<any> {
        return this.http.delete(`${this.baseUrl}/clients/batch`, { body: ids });
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

    // ========== IMPACT ==========
    simulateImpact(serviceId: number): Observable<ImpactDTO> {
        return this.http.post<ImpactDTO>(`${this.baseUrl}/impact/simulate/${serviceId}`, {});
    }

    // ========= ClientService ============

    getAllClientServices(): Observable<ClientService[]> {
        return this.http.get<ClientService[]>(`${this.baseUrl}/client-services`);
    }
    createClientService(cs: ClientService): Observable<ClientService> {
        return this.http.post<ClientService>(`${this.baseUrl}/client-services`, cs);
    }

    deleteClientService(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/client-services/${id}`);
    }
    // ========== AUTH ==========
    changePassword(data: { oldPassword: string; newPassword: string }): Observable<any> {
        // const token = localStorage.getItem('token');
        // const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        //return this.http.post<any>(`${this.baseUrl}/auth/change-password`, data, { headers });
        return this.http.post<any>(`${this.baseUrl}/auth/change-password`, data);
    }
    //=========== Reporting ==================

    getTopCriticalServices(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/reports/top-critical-services`);
    }

    getBlastRadius(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/reports/blast-radius`);
    }
    // Ajouter dans api.service.ts

    // ========== IMPORT CSV ==========

    importClients(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(`${this.baseUrl}/clients/import/csv`, formData);
    }

    importServices(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.http.post<any>(`${this.baseUrl}/services/import/csv`, formData);
    }
}
