import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

import { WORKSPACE_NAV_ITEMS, roleNavItems } from './nav-items';

/** Primary navigation: role-specific links, then the shared loan workspace. */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatListModule, MatIconModule, MatDividerModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-nav-list class="sidebar-nav">
      @for (item of roleItems(); track item.link) {
        <a mat-list-item [routerLink]="item.link" routerLinkActive="active-link">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </a>
      }

      <mat-divider class="section-divider" />

      @for (item of workspaceItems; track item.link) {
        <a mat-list-item [routerLink]="item.link" routerLinkActive="active-link">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  styles: [
    `
      .sidebar-nav {
        padding-top: 0.5rem;
      }
      .section-divider {
        margin: 0.5rem 0;
      }
      a.active-link {
        background: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
      }
    `,
  ],
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  protected readonly workspaceItems = WORKSPACE_NAV_ITEMS;
  protected readonly roleItems = computed(() => roleNavItems(this.auth));
}
