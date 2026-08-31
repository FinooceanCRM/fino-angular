import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PageHeaderComponent } from '@shared/components/page-header.component';

interface UserRoleTabLink {
  label: string;
  route: string;
}

/**
 * "Users" section header + role tab strip, shared across the six role list
 * pages (Bankers, Employees, Managers, Connectors, Relationship Managers,
 * Roles). Each tab is a real top-level route (see `super-admin.routes.ts`),
 * not a `mat-tab-group` panel, so this uses `mat-tab-nav-bar` +
 * `mat-tab-link` with `routerLink`/`routerLinkActive` — the Material pattern
 * for tabs that are actually separate routes — rather than `MatTabGroup`,
 * which expects the tab content to live inline.
 *
 * `mat-tab-nav-bar` requires a `[tabPanel]`; there is no shared panel here
 * (each route renders its own page body below), so an empty
 * `mat-tab-nav-panel` is wired up purely to satisfy that API contract.
 */
@Component({
  selector: 'app-user-role-tabs',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatTabsModule, PageHeaderComponent],
  template: `
    <app-page-header
      icon="group"
      title="Users"
      subtitle="Manage every role's login access and profile"
    >
      <ng-content select="[page-header-actions]" />
    </app-page-header>

    <nav mat-tab-nav-bar class="user-role-tabs" [tabPanel]="tabPanel" mat-stretch-tabs="false">
      @for (link of links; track link.route) {
        <a
          mat-tab-link
          [routerLink]="link.route"
          routerLinkActive
          #rla="routerLinkActive"
          [active]="rla.isActive"
        >
          {{ link.label }}
        </a>
      }
    </nav>
    <mat-tab-nav-panel #tabPanel></mat-tab-nav-panel>
  `,
  styles: [
    `
      .user-role-tabs {
        margin-bottom: var(--app-space-4);
        --mat-tab-header-active-label-text-color: var(--tide-color-primary);
        --mat-tab-header-active-focus-label-text-color: var(--tide-color-primary);
        --mat-tab-header-active-hover-label-text-color: var(--tide-color-primary);
        --mat-tab-header-active-ripple-color: var(--tide-color-primary);
        --mat-tab-header-inactive-ripple-color: var(--tide-color-primary);
        --mat-tab-header-active-indicator-color: var(--tide-color-primary);
        --mat-tab-header-inactive-label-text-color: var(--app-status-default-fg);
        --mat-tab-header-inactive-hover-label-text-color: var(--tide-color-text-primary);
        --mat-tab-header-label-text-weight: 600;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRoleTabsComponent {
  protected readonly links: UserRoleTabLink[] = [
    { label: 'Bankers', route: '/super-admin/users/bankers' },
    { label: 'Employees', route: '/super-admin/users/employees' },
    { label: 'Managers', route: '/super-admin/users/managers' },
    { label: 'Connectors', route: '/super-admin/users/connectors' },
    { label: 'Relationship Managers', route: '/super-admin/users/relationship-managers' },
    { label: 'Roles', route: '/super-admin/users/roles' },
  ];
}
