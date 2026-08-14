import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

import { NotificationIconComponent } from './notification-icon.component';
import { UserMenuComponent } from './user-menu.component';

/** Top navigation bar: brand, sidebar toggle, notifications, account menu. */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
    NotificationIconComponent,
    UserMenuComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar color="primary">
      @if (auth.isAuthenticated()) {
        <button
          mat-icon-button
          type="button"
          (click)="menuToggle.emit()"
          aria-label="Toggle navigation"
        >
          <mat-icon>menu</mat-icon>
        </button>
      }

      <mat-icon>account_balance</mat-icon>
      <span class="brand">{{ appName }}</span>
      <span class="spacer"></span>

      @if (auth.isAuthenticated()) {
        <app-notification-icon />
        <app-user-menu />
      } @else {
        <a mat-button routerLink="/auth/login" routerLinkActive="active">Sign in</a>
      }
    </mat-toolbar>
  `,
  styles: [
    `
      .brand {
        margin-left: 0.5rem;
        font-weight: 500;
        letter-spacing: 0.04em;
      }
      .spacer {
        flex: 1 1 auto;
      }
    `,
  ],
})
export class TopbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly appName = environment.appName;

  readonly menuToggle = output<void>();
}
