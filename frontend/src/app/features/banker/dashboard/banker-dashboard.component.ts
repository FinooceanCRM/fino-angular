import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '@core/services/auth.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { QuickActionsComponent } from '@shared/components/quick-actions.component';
import { RecentActivityComponent } from '@shared/components/recent-activity.component';
import { NotificationsPanelComponent } from '@shared/components/notifications-panel.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import {
  BANKER_QUICK_ACTIONS,
  BANKER_STATS,
  recentActivityForRole,
} from '@shared/mocks/dashboard-mocks';

/**
 * Banker landing view. There is no backend dashboard endpoint for this role
 * yet, so the statistics and activity feed below are illustrative mock data
 * — everything else (auth, notifications) uses the existing services.
 */
@Component({
  selector: 'app-banker-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    PageHeaderComponent,
    QuickActionsComponent,
    RecentActivityComponent,
    NotificationsPanelComponent,
    StatCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Banker dashboard" subtitle="Matched leads and lending criteria" />

    <mat-card class="welcome">
      <mat-card-header>
        <mat-icon mat-card-avatar>waving_hand</mat-icon>
        <mat-card-title>Welcome back, {{ auth.user()?.name }}</mat-card-title>
        <mat-card-subtitle>Leads matched against your bank's criteria.</mat-card-subtitle>
      </mat-card-header>
      <app-quick-actions [actions]="quickActions" />
    </mat-card>

    <div class="stats-grid">
      @for (stat of stats; track stat.label) {
        <app-stat-card
          [icon]="stat.icon"
          [value]="stat.value"
          [label]="stat.label"
          [accent]="stat.accent"
        />
      }
    </div>

    <div class="panels-grid">
      <app-recent-activity [items]="activity" />
      <app-notifications-panel />
    </div>
  `,
  styles: [
    `
      .welcome {
        margin-bottom: 1rem;
      }
      .stats-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-bottom: 1rem;
      }
      .panels-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
    `,
  ],
})
export class BankerDashboardComponent {
  protected readonly auth = inject(AuthService);

  protected readonly stats = BANKER_STATS;
  protected readonly quickActions = BANKER_QUICK_ACTIONS;
  protected readonly activity = recentActivityForRole('banker');
}
