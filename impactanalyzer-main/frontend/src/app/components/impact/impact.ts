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

    // Nœud du service en panne
    nodes.push({
      id: impact.failedServiceName,
      label: impact.failedServiceName,
      color: { background: '#ef4444', border: '#b91c1c' },
      font: { color: '#fff', bold: true },
      shape: 'box',
      size: 30
    });
    nodeIds.add(impact.failedServiceName);

    // ✅ FIX : utiliser ' → ' (Unicode) comme le backend
    impact.impactPaths.forEach(path => {
      const parts = path.split(' → ');  // ← CORRECTION ICI

      parts.forEach((label, i) => {
        // ✅ Plus besoin de résoudre les IDs — c'est déjà des noms
        if (!nodeIds.has(label)) {
          const isLast = i === parts.length - 1;
          nodes.push({
            id: label,
            label: label,
            color: {
              background: isLast ? '#f97316' : '#f59e0b',
              border:     isLast ? '#c2410c' : '#b45309'
            },
            font: { color: '#fff' },
            shape: 'ellipse'
          });
          nodeIds.add(label);
        }

        // Ajouter le lien entre le nœud précédent et celui-ci
        if (i > 0) {
          const prevLabel = parts[i - 1]; // ✅ directement le nom
          edges.push({ from: prevLabel, to: label, arrows: 'to' });
        }
      });
    });

    // Si pas de chemins → afficher services directement
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

    const options: Options = {
      layout: {
        hierarchical: {
          direction: 'LR',
          sortMethod: 'directed',
          levelSeparation: 200,   // ✅ plus d'espace entre niveaux
          nodeSpacing: 120        // ✅ plus d'espace entre nœuds
        }
      },
      physics: { enabled: false },
      edges: {
        color: '#6b7280',
        smooth: { enabled: true, type: 'cubicBezier', roundness: 0.5 }
      },
      nodes: {
        margin: { top: 10, right: 15, bottom: 10, left: 15 }
      }
    };

    this.network = new Network(
      this.graphContainer.nativeElement,
      { nodes: new DataSet(nodes), edges: new DataSet(edges) },
      options
    );
  }

  getSeverityClass(): string {
    const map: any = {
      NONE: 'badge-none', LOW: 'badge-low',
      MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical'
    };
    return map[this.impactResult?.severity || 'NONE'] || '';
  }
}
