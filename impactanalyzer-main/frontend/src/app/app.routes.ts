import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ServiceListComponent } from './components/service-list/service-list';
import { AddServiceComponent } from './pages/add-service/add-service';
import { DependencyListComponent } from './components/dependency-list/dependency-list';
import { AddDependencyComponent } from './pages/add-dependency/add-dependency';
import { ImpactComponent } from './pages/impact/impact.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'services', component: ServiceListComponent },
  { path: 'services/add', component: AddServiceComponent },
  { path: 'dependencies', component: DependencyListComponent },
  { path: 'dependencies/add', component: AddDependencyComponent },
  { path: 'impact', component: ImpactComponent },
];

