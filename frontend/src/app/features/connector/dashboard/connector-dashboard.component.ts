import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { ConnectorDashboard } from '@core/models/connector.model';
import { ConnectorService } from '@core/services/connector.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { NotificationsPanelComponent } from '@shared/components/notifications-panel.component';
import { RecentActivityComponent } from '@shared/components/recent-activity.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { CONNECTOR_STATS, recentActivityForRole } from '@shared/mocks/dashboard-mocks';

@Component({
  selector: 'app-connector-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    PageHeaderComponent,
    NotificationsPanelComponent,
    RecentActivityComponent,
    StatCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Connector dashboard"
      subtitle="Your independent connector workspace"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (error(); as message) {
      <mat-card class="error-card">
        <mat-card-content>{{ message }}</mat-card-content>
      </mat-card>
    }

    @if (data(); as dashboard) {
      <div class="grid">
        <mat-card class="welcome">
          <mat-card-header>
            <mat-icon mat-card-avatar>waving_hand</mat-icon>
            <mat-card-title>{{ dashboard.welcome.headline }}</mat-card-title>
            <mat-card-subtitle>{{ dashboard.welcome.message }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-actions>
            <a mat-stroked-button routerLink="/connector/profile">
              <mat-icon>badge</mat-icon>
              Manage profile
            </a>
            <a mat-stroked-button routerLink="/leads">
              <mat-icon>assignment</mat-icon>
              Leads
            </a>
            <a mat-stroked-button routerLink="/documents">
              <mat-icon>description</mat-icon>
              Documents
            </a>
          </mat-card-actions>
        </mat-card>

        @for (stat of stats; track stat.label) {
          <app-stat-card
            [icon]="stat.icon"
            [value]="stat.value"
            [label]="stat.label"
            [accent]="stat.accent"
          />
        }

        <div class="panels">
          <app-recent-activity [items]="activity" />
          <app-notifications-panel />
        </div>

        <mat-card>
          <mat-card-header>
            <mat-card-title>User information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.user.name }}</span>
                <span matListItemLine>Name</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.user.email }}</span>
                <span matListItemLine>Email</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.user.phone ?? '—' }}</span>
                <span matListItemLine>Phone</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>
                  {{ dashboard.user.member_since | date: 'mediumDate' }}
                </span>
                <span matListItemLine>Member since</span>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Role information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip>{{ dashboard.role.label }}</mat-chip>
              @if (dashboard.role.independent) {
                <mat-chip>Independent role</mat-chip>
              }
            </mat-chip-set>
            <p class="muted">{{ dashboard.role.description }}</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Account status</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip [highlighted]="dashboard.account_status.is_active">
                {{ dashboard.account_status.status }}
              </mat-chip>
              <mat-chip>
                Profile
                {{ dashboard.account_status.profile_complete ? 'complete' : 'incomplete' }}
              </mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [
    `
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        margin-top: 1rem;
      }
      .welcome,
      .panels {
        grid-column: 1 / -1;
      }
      .panels {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .muted {
        opacity: 0.75;
        margin-top: 0.75rem;
      }
      .error-card {
        margin-top: 1rem;
      }
    `,
  ],
})
export class ConnectorDashboardComponent implements OnInit {
  private readonly connectors = inject(ConnectorService);

  protected readonly data = signal<ConnectorDashboard | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly stats = CONNECTOR_STATS;
  protected readonly activity = recentActivityForRole('connector');

  ngOnInit(): void {
    this.loading.set(true);
    this.connectors.dashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the connector dashboard.');
        this.loading.set(false);
      },
    });
  }
}
