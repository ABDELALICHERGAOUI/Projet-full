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
import {ChangePassword} from "./components/change-password/change-password";


export const routes: Routes = [

  { path: 'login', component: Login },
  // Dashboard protégé
  { path: '', component: Dashboard, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'change-password', component: ChangePassword, canActivate: [authGuard] },


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

