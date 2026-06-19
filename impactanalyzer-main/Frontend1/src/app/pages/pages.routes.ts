
import { Routes } from '@angular/router';
import { ClientComponent } from '@/app/pages/client/client';
import { ServiceListComponent } from '@/app/pages/service-list/service-list';
import { Impact } from '@/app/pages/impact/impact';
import { ChangePassword } from '@/app/pages/auth/change-password/change-password';

export default [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },

    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard')
            .then(m => m.Dashboard)
    },

    {
        path: 'client',
        component: ClientComponent
    },

    {
        path: 'service',
        component: ServiceListComponent
    },

    {
        path: 'impact',
        component: Impact
    },

    {
        path: 'topology',
        loadComponent: () => import('./topology/topology')
            .then(m => m.TopologyComponent)
    },

    {
        path: 'reports',
        loadComponent: () => import('./reports/reports')
            .then(m => m.ReportsComponent)
    },

    {
        path: 'change-password',
        component: ChangePassword
    },

    {
        path: '**',
        redirectTo: '/notfound'
    }
] as Routes;
