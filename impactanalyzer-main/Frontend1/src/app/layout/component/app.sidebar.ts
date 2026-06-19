import { Component, computed, effect, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AppMenu } from './app.menu';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [AppMenu, RouterModule],
    template: `
        <div class="layout-sidebar sidebar-with-footer">
            <div class="sidebar-menu-content">
                <app-menu></app-menu>
            </div>
            <div class="sidebar-footer">
                <img
                    src="/demo/images/img.png"
                    alt="Logo NTT DATA"
                    class="ntt-logo"
                />
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            height: 100%;
        }

        .sidebar-with-footer {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 4rem);
        }

        .sidebar-menu-content {
            flex: 1;
            overflow-y: auto;
            min-height: 0;

        }

        .sidebar-footer {
            margin-top: auto;
            padding: 0.2rem 0.5rem 1rem;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }

        .sidebar-footer-text {
            display: block;
            font-size: 0.72rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
        }

        .ntt-logo {
            max-width: 200px;
            height: auto;
            object-fit: contain;
            opacity: 0.85;
        }
    `]
})
export class AppSidebar implements OnInit, OnDestroy {
    layoutService = inject(LayoutService);

    router = inject(Router);

    el = inject(ElementRef);

    private outsideClickListener: ((event: MouseEvent) => void) | null = null;

    private destroy$ = new Subject<void>();

    constructor() {
        effect(() => {
            const state = this.layoutService.layoutState();

            if (this.layoutService.isDesktop()) {
                if (state.overlayMenuActive) {
                    this.bindOutsideClickListener();
                } else {
                    this.unbindOutsideClickListener();
                }
            } else {
                if (state.mobileMenuActive) {
                    this.bindOutsideClickListener();
                } else {
                    this.unbindOutsideClickListener();
                }
            }
        });
    }

    ngOnInit() {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this.destroy$)
            )
            .subscribe((event) => {
                const navEvent = event as NavigationEnd;
                this.onRouteChange(navEvent.urlAfterRedirects);
            });

        this.onRouteChange(this.router.url);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        this.unbindOutsideClickListener();
    }

    private onRouteChange(path: string) {
        this.layoutService.layoutState.update((val) => ({
            ...val,
            activePath: path,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            mobileMenuActive: false,
            menuHoverActive: false
        }));
    }

    private bindOutsideClickListener() {
        if (!this.outsideClickListener) {
            this.outsideClickListener = (event: MouseEvent) => {
                if (this.isOutsideClicked(event)) {
                    this.layoutService.layoutState.update((val) => ({
                        ...val,
                        overlayMenuActive: false,
                        staticMenuMobileActive: false,
                        mobileMenuActive: false,
                        menuHoverActive: false
                    }));
                }
            };

            document.addEventListener('click', this.outsideClickListener);
        }
    }

    private unbindOutsideClickListener() {
        if (this.outsideClickListener) {
            document.removeEventListener('click', this.outsideClickListener);
            this.outsideClickListener = null;
        }
    }

    private isOutsideClicked(event: MouseEvent): boolean {
        const topbarButtonEl = document.querySelector('.topbar-start > button');
        const sidebarEl = this.el.nativeElement;

        return !(
            sidebarEl?.isSameNode(event.target as Node) ||
            sidebarEl?.contains(event.target as Node) ||
            topbarButtonEl?.isSameNode(event.target as Node) ||
            topbarButtonEl?.contains(event.target as Node)
        );
    }
}
