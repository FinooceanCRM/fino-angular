import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

/** Protected landing view for every signed-in role. */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Dashboard"
      [subtitle]="auth.user()?.role_label ?? 'FINOOCEAN'"
    />

    <mat-card>
      <mat-card-content>
        <p>Signed in as {{ auth.user()?.name }} ({{ auth.user()?.email }}).</p>
      </mat-card-content>
      <mat-card-actions>
        @if (auth.hasRole('connector', 'super_admin')) {
          <a mat-stroked-button routerLink="/dashboard/connector">
            Connector dashboard
          </a>
        }
        <button mat-flat-button type="button" (click)="logout()">Sign out</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      mat-card-actions {
        display: flex;
        gap: 0.5rem;
      }
    `,
  ],
})
export class DashboardComponent {
  private readonly router = inject(Router);

  protected readonly auth = inject(AuthService);

  protected logout(): void {
    this.auth.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }
}
