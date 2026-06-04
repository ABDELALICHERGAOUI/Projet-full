import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Gestion',
                items: [
                    { label: 'Clients',      icon: 'pi pi-fw pi-users',    routerLink: ['/pages/client'] },
                    { label: 'Services',     icon: 'pi pi-fw pi-cog',      routerLink: ['/pages/service'] },
                    { label: 'Impact',       icon: 'pi pi-fw pi-chart-bar',routerLink: ['/pages/impact'] },
                    { label: 'Topologie', icon: 'pi pi-fw pi-share-alt',routerLink: ['/pages/topology'] },
                    { label: 'Rapports',  icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/pages/reports'] },

                ]
            },
        ];
    }
}
