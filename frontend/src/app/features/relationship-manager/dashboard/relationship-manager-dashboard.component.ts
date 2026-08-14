import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { RelationshipManagerDashboard } from '@core/models/relationship-manager.model';
import { RelationshipManagerService } from '@core/services/relationship-manager.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { NotificationsPanelComponent } from '@shared/components/notifications-panel.component';
import { RecentActivityComponent } from '@shared/components/recent-activity.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { recentActivityForRole } from '@shared/mocks/dashboard-mocks';

@Component({
  selector: 'app-relationship-manager-dashboard',
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
      title="Relationship Manager dashboard"
      subtitle="Your team at a glance"
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
            @for (action of dashboard.quick_actions; track action.label + action.route) {
              <a mat-stroked-button [routerLink]="action.route">
                <mat-icon>{{ action.icon }}</mat-icon>
                {{ action.label }}
              </a>
            }
          </mat-card-actions>
        </mat-card>

        <app-stat-card
          icon="groups"
          [value]="dashboard.team_summary.employee_count"
          label="Employees"
          accent="primary"
        />

        <app-stat-card
          icon="hub"
          [value]="dashboard.team_summary.connector_count"
          label="Connectors"
          accent="accent"
        />

        <app-stat-card
          icon="diversity_3"
          [value]="dashboard.team_summary.total_members"
          label="Total team members"
        />

        <div class="panels">
          <app-recent-activity [items]="activity" />
          <app-notifications-panel />
        </div>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Team summary</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.team_summary.employee_count }}</span>
                <span matListItemLine>Employees assigned to you</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>
                  {{ dashboard.team_summary.active_employee_count }}
                </span>
                <span matListItemLine>Active employees</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.team_summary.connector_count }}</span>
                <span matListItemLine>Connectors assigned to you</span>
              </mat-list-item>
            </mat-list>
            <a mat-button routerLink="/relationship-manager/employees">
              View employees
            </a>
            <a mat-button routerLink="/relationship-manager/connectors">
              View connectors
            </a>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>My information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.relationship_manager.name }}</span>
                <span matListItemLine>Name</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.relationship_manager.email }}</span>
                <span matListItemLine>Email</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>
                  {{ dashboard.relationship_manager.rm_code ?? '—' }}
                </span>
                <span matListItemLine>RM code</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>
                  {{ dashboard.relationship_manager.branch ?? '—' }}
                </span>
                <span matListItemLine>Branch</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>
                  {{ dashboard.relationship_manager.region ?? '—' }}
                </span>
                <span matListItemLine>Region</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>
                  {{
                    dashboard.relationship_manager.date_of_joining
                      ? (dashboard.relationship_manager.date_of_joining | date: 'mediumDate')
                      : '—'
                  }}
                </span>
                <span matListItemLine>Date of joining</span>
              </mat-list-item>
            </mat-list>
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
              <mat-chip>{{ dashboard.role.label }}</mat-chip>
              <mat-chip>
                Profile
                {{ dashboard.account_status.profile_complete ? 'complete' : 'incomplete' }}
              </mat-chip>
            </mat-chip-set>
            <p class="muted">{{ dashboard.role.description }}</p>
            @if (dashboard.manager; as manager) {
              <p class="muted">
                Reports to {{ manager.name }} ({{ manager.role_label }}).
              </p>
            }
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
export class RelationshipManagerDashboardComponent implements OnInit {
  private readonly relationshipManagers = inject(RelationshipManagerService);

  protected readonly data = signal<RelationshipManagerDashboard | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly activity = recentActivityForRole('relationship_manager');

  ngOnInit(): void {
    this.loading.set(true);
    this.relationshipManagers.dashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the Relationship Manager dashboard.');
        this.loading.set(false);
      },
    });
  }
}
