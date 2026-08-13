import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { PageHeaderComponent } from '@shared/components/page-header.component';

/**
 * Placeholder landing view. No widgets or business data in Phase 1.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="FINOOCEAN"
      subtitle="Phase 1 scaffold — feature modules are added in later phases."
    />

    <mat-card>
      <mat-card-content>
        <p>The application shell, routing, and core services are in place.</p>
      </mat-card-content>
    </mat-card>
  `,
})
export class DashboardComponent {}
