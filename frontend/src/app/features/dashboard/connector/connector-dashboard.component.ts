import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { AuthService } from '@core/services/auth.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

/** Connector-facing landing view. Placeholder — no business logic yet. */
@Component({
  selector: 'app-connector-dashboard',
  standalone: true,
  imports: [MatCardModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Connector dashboard"
      subtitle="Referral partner workspace"
    />

    <mat-card>
      <mat-card-content>
        <p>Signed in as {{ auth.user()?.name }} ({{ auth.user()?.role_label }}).</p>
        <p>Connector features are added in a later phase.</p>
      </mat-card-content>
    </mat-card>
  `,
})
export class ConnectorDashboardComponent {
  protected readonly auth = inject(AuthService);
}
