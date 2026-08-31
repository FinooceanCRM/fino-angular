import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

import { profileLink } from './nav-items';

/** Topbar account menu: user summary, role-specific profile link, sign out. */
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="account-trigger" [matMenuTriggerFor]="menu" aria-label="Account menu">
      <span class="account-avatar">{{ initials() }}</span>
      <span class="account-text">
        <span class="account-name">{{ auth.user()?.name }}</span>
        <span class="account-role">{{ auth.user()?.role_label }}</span>
      </span>
      <mat-icon class="account-chevron">expand_more</mat-icon>
    </button>

    <mat-menu #menu="matMenu" xPosition="before">
      <div class="user-summary">
        <span class="user-name">{{ auth.user()?.name }}</span>
        <span class="user-role">{{ auth.user()?.role_label }}</span>
      </div>

      <mat-divider />

      @if (profile(); as link) {
        <a mat-menu-item [routerLink]="link">
          <mat-icon>person</mat-icon>
          <span>My profile</span>
        </a>
      }

      <button mat-menu-item type="button" (click)="signOut()">
        <mat-icon>logout</mat-icon>
        <span>Sign out</span>
      </button>
    </mat-menu>
  `,
  styles: [
    `
      .account-trigger {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        padding: 0.25rem 0.5rem 0.25rem 0.25rem;
        border-radius: 999px;
        font: inherit;

        &:hover {
          background: rgba(255, 255, 255, 0.12);
        }
      }
      .account-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.16);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: var(--tide-color-text-inverse);
        font-weight: 700;
        font-size: 0.85rem;
        flex-shrink: 0;
      }
      .account-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
        text-align: left;
      }
      .account-name {
        font-weight: 600;
        font-size: 0.85rem;
      }
      .account-role {
        font-size: 0.72rem;
        opacity: 0.85;
      }
      .account-chevron {
        opacity: 0.85;
      }
      @media (max-width: 720px) {
        .account-text {
          display: none;
        }
      }
      .user-summary {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
        padding: 0.5rem 1rem;
      }
      .user-name {
        font-weight: 500;
      }
      .user-role {
        font-size: 0.75rem;
        opacity: 0.7;
      }
    `,
  ],
})
export class UserMenuComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly profile = computed(() => profileLink(this.auth));

  protected readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  protected signOut(): void {
    this.auth.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }
}
