import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar color="primary">
      <mat-icon>account_balance</mat-icon>
      <span class="brand">{{ appName() }}</span>
      <span class="spacer"></span>
      @if (auth.isAuthenticated()) {
        @if (auth.hasRole('connector')) {
          <a mat-button routerLink="/connector/dashboard" routerLinkActive="active">
            Connector dashboard
          </a>
          <a mat-button routerLink="/connector/profile" routerLinkActive="active">
            Profile
          </a>
        } @else {
          <a mat-button routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        }
      } @else {
        <a mat-button routerLink="/auth/login" routerLinkActive="active">Sign in</a>
      }
    </mat-toolbar>

    <main class="content">
      <router-outlet />
    </main>
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
      .content {
        padding: 1.5rem;
        max-width: 1100px;
        margin: 0 auto;
      }
    `,
  ],
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
  protected readonly appName = signal(environment.appName);
}
