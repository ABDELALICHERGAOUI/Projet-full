import { Network , Options} from 'vis-network';
import { DataSet } from 'vis-data';
import { Component, OnInit, ElementRef, ViewChild,ChangeDetectorRef , AfterViewInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { ImpactDTO } from '../../models/impact.dto.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-impact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './impact.html',
  styleUrl: './impact.css',
})
export class Impact implements OnInit{

  @ViewChild('graphContainer', { static: false }) graphContainer!: ElementRef;

  services: any[] = [];
  selectedServiceId: number | null = null;
  impactResult: ImpactDTO | null = null;
  loading = false;
  error = '';
  private network: any = null;

  constructor(
    private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.apiService.getServices().subscribe({
      next: (data) => this.services = data,
      error: () => this.error = 'Impossible de charger les services.'
    });
  }

  simulate(): void {
    if (!this.selectedServiceId) return;

    const serviceId = Number(this.selectedServiceId); // ← capturer immédiatement
    this.loading = true;
    this.error = '';
    this.impactResult = null;

    this.apiService.simulateImpact(serviceId).subscribe({
      next: (result) => {
        this.impactResult = result;
        this.loading = false;
        this.cdr.detectChanges(); // ← forcer Angular à rendre le *ngIf AVANT buildGraph
        setTimeout(() => this.buildGraph(result), 50);
      },
      error: () => {
        this.error = 'Erreur lors de la simulation.';
        this.loading = false;
      }
    });
  }

  buildGraph(impact: ImpactDTO): void {
    if (!this.graphContainer) return;
    if (this.network) { this.network.destroy(); }

    const nodes: any[] = [];
    const edges: any[] = [];
    const nodeIds = new Set<string>();

    // Nœud du service défaillant
    nodes.push({
      id: impact.failedServiceName,
      label: impact.failedServiceName,
      color: { background: '#ef4444', border: '#b91c1c' },
      font: { color: '#fff', bold: true },
      shape: 'box',
      size: 30
    });
    nodeIds.add(impact.failedServiceName);

    // Construire le graphe à partir des chemins d'impact
    impact.impactPaths.forEach(path => {
      const parts = path.split(' -> ');
      // Résoudre les IDs en noms de services
      parts.forEach((part, i) => {
        const label = isNaN(Number(part)) ? part : (
          this.services.find(s => s.id == Number(part))?.name || `Service ${part}`
        );
        if (!nodeIds.has(label)) {
          const isLast = i === parts.length - 1;
          nodes.push({
            id: label,
            label: label,
            color: {
              background: isLast ? '#f97316' : '#f59e0b',
              border: isLast ? '#c2410c' : '#b45309'
            },
            font: { color: '#fff' },
            shape: 'ellipse'
          });
          nodeIds.add(label);
        }
        if (i > 0) {
          const prevLabel = isNaN(Number(parts[i - 1])) ? parts[i - 1] : (
            this.services.find(s => s.id == Number(parts[i - 1]))?.name || `Service ${parts[i - 1]}`
          );
          edges.push({ from: prevLabel, to: label, arrows: 'to' });
        }
      });
    });

    // Si pas de chemins, afficher juste les services impactés
    if (impact.impactPaths.length === 0) {
      impact.impactedServices.forEach(name => {
        if (!nodeIds.has(name)) {
          nodes.push({
            id: name, label: name,
            color: { background: '#f59e0b', border: '#b45309' },
            font: { color: '#fff' }, shape: 'ellipse'
          });
          nodeIds.add(name);
          edges.push({ from: impact.failedServiceName, to: name, arrows: 'to' });
        }
      });
    }

    const data = {
      nodes: new DataSet(nodes),
      edges: new DataSet(edges)
    };

    const options: Options = {
      layout: { hierarchical: { direction: 'LR', sortMethod: 'directed', levelSeparation: 180 } },
      physics: { enabled: false },
      edges: { color: '#6b7280', smooth: { enabled: true, type: 'cubicBezier', roundness: 0.5 } },
      nodes: { margin: { top: 10, right: 10, bottom: 10, left: 10 } }
    };

    this.network = new Network(this.graphContainer.nativeElement, data, options);
  }

  getSeverityClass(): string {
    const map: any = {
      NONE: 'badge-none', LOW: 'badge-low',
      MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical'
    };
    return map[this.impactResult?.severity || 'NONE'] || '';
  }
}
