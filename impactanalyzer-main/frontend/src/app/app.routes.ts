import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { ClientComponent } from './components/client/client';
import { ServiceListComponent } from './components/service-list/service-list';
import { ClientServices } from './components/client-services/client-services';

export const routes: Routes = [
  {path : "home" , component : Home},
  {path : "client" , component : ClientComponent},
  {path : "service" , component : ServiceListComponent},
  {path : "ClientService" , component : ClientServices}

];
