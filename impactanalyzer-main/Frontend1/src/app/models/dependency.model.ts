import { Service } from './service.model';

export interface Dependency {
  id: number;
  service: Service;
  dependsOn: Service;
  criticality: string;
  dependencyType: string;
}
