import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dependency-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dependency-list.html',
})
export class DependencyListComponent implements OnInit {
  dependencies: any[] = [];
  isLoading: boolean = true;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadDependencies();
  }

  loadDependencies(): void {
    this.isLoading = true;
    this.apiService.getDependencies().subscribe({
      next: (data) => {
        this.dependencies = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.isLoading = false;
      },
    });
  }

  deleteDependency(id: number): void {
    if (confirm('Supprimer cette dépendance ?')) {
      this.apiService.deleteDependency(id).subscribe({
        next: () => {
          this.loadDependencies();
        },
        error: (err) => console.error(err),
      });
    }
  }
}
