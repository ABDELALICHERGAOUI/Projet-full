export interface ImpactDTO {
  failedServiceId: number;
  failedServiceName: string;
  impactedServices: string[];
  impactedClients: string[];
  totalServicesImpacted: number;
  totalClientsImpacted: number;
  impactScore: number;
  impactPaths: string[];
  severity: string;
}
