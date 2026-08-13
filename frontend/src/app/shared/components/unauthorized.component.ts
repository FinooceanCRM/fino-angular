import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="unauthorized">
      <h1>403 — Not authorised</h1>
      <p>
        Your role
        @if (auth.user(); as user) {
          (<strong>{{ user.role_label }}</strong
          >)
        }
        does not have access to this page.
      </p>

      <div class="actions">
        <button mat-flat-button routerLink="/dashboard">Go to dashboard</button>
        <button mat-stroked-button type="button" (click)="signOut()">
          Sign out
        </button>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .unauthorized {
        max-width: 520px;
        padding: 1.5rem;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
      }
    `,
  ],
})
export class UnauthorizedComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected signOut(): void {
    this.auth.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }
}
