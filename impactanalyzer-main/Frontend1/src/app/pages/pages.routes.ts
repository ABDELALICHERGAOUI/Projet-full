import { Routes } from '@angular/router';
import { Crud } from './crud/crud';
import {ClientComponent} from "@/app/pages/client/client";
import { ServiceListComponent } from '@/app/pages/service-list/service-list';
import { Impact } from '@/app/pages/impact/impact';

export default [
    { path: 'crud', component: Crud },
    { path: 'client', component: ClientComponent },
    { path: 'service', component: ServiceListComponent},
    { path: 'impact' , component: Impact },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
