import { Routes } from '@angular/router';
import { ClientComponent } from './components/client/client';
import { ServiceListComponent } from './components/service-list/service-list';
import { ClientServices } from './components/client-services/client-services';
import { DependencyListComponent } from './components/dependency-list/dependency-list';
import { Layout } from './components/layout/layout';
import { Impact } from './components/impact/impact';
import {Dashboard} from './components/dashboard/dashboard';


export const routes: Routes = [

  // Dashboard SANS navbar
  { path: '', component: Dashboard },
  { path : 'dashboard' , component : Dashboard},

  // Pages AVEC navbar à gauche
  {
    path: '',
    component: Layout,
    children: [
      { path: 'client',        component: ClientComponent    },
      { path: 'service',       component: ServiceListComponent },
      { path: 'dependency',       component: DependencyListComponent },
      { path: 'ClientService', component: ClientServices     },
      { path: 'impact', component: Impact }

    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];


