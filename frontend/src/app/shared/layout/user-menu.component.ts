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
    <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Account menu">
      <mat-icon>account_circle</mat-icon>
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

  protected signOut(): void {
    this.auth.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }
}
