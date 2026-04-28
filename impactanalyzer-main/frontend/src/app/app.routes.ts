import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { ClientComponent } from './components/client/client';
//import { ServiceListComponent } from './components/service-list/service-list';
import { ClientServices } from './components/client-services/client-services';
import { Layout } from './components/layout/layout';
import { Impact } from './components/impact/impact';


export const routes: Routes = [

  // Dashboard SANS navbar
  { path: '', component: Home },
  { path: 'home', component: Home },

  // Pages AVEC navbar à gauche
  {
    path: '',
    component: Layout,
    children: [
      { path: 'client',        component: ClientComponent    },
     // { path: 'service',       component: ServiceListComponent },
      { path: 'ClientService', component: ClientServices     },
      { path: 'impact', component: Impact }

    ]
  },

  { path: '**', redirectTo: 'home' }
];
