import { Component, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AuthService } from '@/app/services/auth';
import { Router } from '@angular/router';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        RouterModule,
        CommonModule,
        StyleClassModule,
        AppConfigurator,
        MenuModule,
        ButtonModule
    ],
    template: `
        <div class="layout-topbar">

            <!-- Logo -->
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action"
                        (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo sdia-topbar-logo" routerLink="/pages/dashboard">
                    <div class="topbar-project-logo">
                        <i class="pi pi-sitemap"></i>
                    </div>

                    <div class="topbar-logo-text">
                        <span class="topbar-logo-title">SDIA</span>
                        <span class="topbar-logo-subtitle">Impact Analyzer</span>
                    </div>
                </a>
            </div>

            <!-- Actions droite -->
            <div class="layout-topbar-actions">

                <!-- Thème + Configurateur -->
                <div class="layout-config-menu">
                    <button type="button" class="layout-topbar-action"
                            (click)="toggleDarkMode()">
                        <i class="pi"
                           [class.pi-moon]="layoutService.isDarkTheme()"
                           [class.pi-sun]="!layoutService.isDarkTheme()">
                        </i>
                    </button>
                    <div class="relative">
                        <button class="layout-topbar-action layout-topbar-action-highlight"
                                pStyleClass="@next"
                                enterFromClass="hidden"
                                enterActiveClass="animate-scalein"
                                leaveToClass="hidden"
                                leaveActiveClass="animate-fadeout"
                                hideOnOutsideClick="true">
                            <i class="pi pi-palette"></i>
                        </button>
                        <app-configurator />
                    </div>
                </div>

                <!-- Menu mobile -->
                <button class="layout-topbar-menu-button layout-topbar-action"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        hideOnOutsideClick="true">
                    <i class="pi pi-ellipsis-v"></i>
                </button>

                <!-- ✅ Nom utilisateur + dropdown -->
                <div class="user-menu-container">
                    <button class="user-btn"
                            (click)="userMenu.toggle($event)">
                        <div class="user-avatar">
                            <i class="pi pi-user"></i>
                        </div>
                        <div class="user-info">
                            <span class="user-name">{{ getUsername() }}</span>
                            <span class="user-role">Administrateur</span>
                        </div>
                        <i class="pi pi-chevron-down chevron"></i>
                    </button>

                    <!-- ✅ p-menu reconnu grâce à MenuModule importé -->
                    <p-menu #userMenu
                            [model]="userMenuItems"
                            [popup]="true"
                            appendTo="body" />
                </div>

                <!-- ✅ Bouton déconnexion -->
                <button class="logout-btn"
                        (click)="logout()"
                        title="Se déconnecter">
                    <i class="pi pi-sign-out"></i>
                    <span>Déconnexion</span>
                </button>

            </div>
        </div>`,
    styles: [`
        .user-menu-container { position: relative; }

        .user-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px 12px;
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .user-btn:hover {
            background: var(--surface-hover);
            border-color: var(--primary-color);
        }

        .user-avatar {
            width: 34px; height: 34px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.95rem;
            flex-shrink: 0;
        }

        .user-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .user-name {
            font-weight: 600;
            font-size: 0.88rem;
            color: var(--text-color);
            line-height: 1.2;
        }

        .user-role {
            font-size: 0.72rem;
            color: var(--text-color-secondary);
            line-height: 1.2;
        }

        .chevron {
            font-size: 0.72rem;
            color: var(--text-color-secondary);
        }

        .logout-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #fca5a5;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
            transition: all 0.2s;
        }

        .logout-btn:hover {
            background: #fca5a5;
            border-color: #ef4444;
        }
        .sdia-topbar-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }

        .topbar-project-logo {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--primary-color), #22c55e);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px color-mix(in srgb, var(--primary-color) 25%, transparent);
            flex-shrink: 0;
        }

        .topbar-project-logo i {
            color: #ffffff;
            font-size: 1.1rem;
        }

        .topbar-logo-text {
            display: flex;
            flex-direction: column;
            line-height: 1.1;
        }

        .topbar-logo-title {
            color: var(--text-color);
            font-size: 1.25rem;
            font-weight: 800;
            letter-spacing: 0.04em;
        }

        .topbar-logo-subtitle {
            color: var(--text-color-secondary);
            font-size: 0.68rem;
            font-weight: 500;
            margin-top: 2px;
        }
    `]
})
export class AppTopbar {

    items!: MenuItem[];
    layoutService = inject(LayoutService);

    userMenuItems: MenuItem[] = [
        {
            label: 'Mon compte',
            items: [
                {
                    label: 'Changer mot de passe',
                    icon: 'pi pi-lock',
                    command: () => this.goToChangePassword()
                }
            ]
        }
    ];

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    getUsername(): string {
        return this.authService.getUsername()
            || localStorage.getItem('username')
            || 'Admin';
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }

    goToChangePassword(): void {
        this.router.navigate(['/pages/change-password']);
    }
}
