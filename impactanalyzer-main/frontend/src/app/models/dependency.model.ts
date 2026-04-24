export interface Service {
  id: number;
  name: string;
  description: string;
  status: string;
}

export interface Dependency {
  id: number;
  service: Service;
  dependsOn: Service;
  impactWeight: number;
}
