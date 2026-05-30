import { Client } from './client.model';
import { Service } from './service.model';

export interface ClientService {
  id: number;
  client : Client;
  service: Service;
}
