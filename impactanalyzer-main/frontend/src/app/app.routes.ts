import { Routes } from '@angular/router';
import { ClientComponent } from './components/client/client';
import { ServiceListComponent } from './components/service-list/service-list';
import { ClientServices } from './components/client-services/client-services';
import { DependencyListComponent } from './components/dependency-list/dependency-list';
import { Layout } from './components/layout/layout';
import { Impact } from './components/impact/impact';
import {Dashboard} from './components/dashboard/dashboard';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth-guard';


export const routes: Routes = [

  // Page login — publique, sans layout
  { path: 'login', component: Login },
  // Dashboard protégé
  { path: '', component: Dashboard, canActivate: [authGuard] }, // ← ajouté canActivate
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] }, // ← ajouté canActivate

  // Pages AVEC navbar  — protégées
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'client',        component: ClientComponent    },
      { path: 'service',       component: ServiceListComponent },
      { path: 'dependency',       component: DependencyListComponent },
      { path: 'ClientService', component: ClientServices     },
      { path: 'impact', component: Impact }

    ]
  },

  { path: '**', redirectTo: 'login' }
];
