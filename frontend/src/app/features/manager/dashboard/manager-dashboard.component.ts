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

import { ManagerDashboard } from '@core/models/manager.model';
import { ManagerService } from '@core/services/manager.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { NotificationsPanelComponent } from '@shared/components/notifications-panel.component';
import { RecentActivityComponent } from '@shared/components/recent-activity.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { recentActivityForRole } from '@shared/mocks/dashboard-mocks';

@Component({
  selector: 'app-manager-dashboard',
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
      title="Manager dashboard"
      subtitle="Your Relationship Managers and their teams"
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
          icon="supervisor_account"
          [value]="dashboard.team_summary.relationship_manager_count"
          label="Relationship Managers"
          accent="primary"
        />

        <app-stat-card
          icon="groups"
          [value]="dashboard.team_summary.employee_count"
          label="Employees"
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
            <mat-card-title>Manager information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.manager.name }}</span>
                <span matListItemLine>Name</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.manager.email }}</span>
                <span matListItemLine>Email</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>
                  {{ dashboard.manager.manager_code ?? '—' }}
                </span>
                <span matListItemLine>Manager code</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.manager.branch ?? '—' }}</span>
                <span matListItemLine>Branch</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.manager.region ?? '—' }}</span>
                <span matListItemLine>Region</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>
                  {{
                    dashboard.manager.date_of_joining
                      ? (dashboard.manager.date_of_joining | date: 'mediumDate')
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
            @if (dashboard.reports_to; as parent) {
              <p class="muted">
                Reports to {{ parent.name }} ({{ parent.role_label }}).
              </p>
            }
            <p class="muted">
              {{ dashboard.team_summary.active_relationship_manager_count }} active RM(s),
              {{ dashboard.team_summary.active_employee_count }} active employee(s).
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card class="hierarchy">
          <mat-card-header>
            <mat-card-title>Team hierarchy</mat-card-title>
            <mat-card-subtitle>
              Relationship Managers and the employees assigned to them
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (dashboard.hierarchy.length === 0) {
              <p class="muted">No Relationship Managers report to you yet.</p>
            } @else {
              <ul class="tree">
                @for (node of dashboard.hierarchy; track node.id) {
                  <li>
                    <div class="node">
                      <mat-icon>supervisor_account</mat-icon>
                      <span class="node-name">{{ node.name }}</span>
                      <mat-chip [highlighted]="node.is_active">
                        {{ node.is_active ? 'Active' : 'Inactive' }}
                      </mat-chip>
                    </div>
                    @if (node.employees.length === 0) {
                      <ul class="tree">
                        <li class="muted">No employees assigned.</li>
                      </ul>
                    } @else {
                      <ul class="tree">
                        @for (employee of node.employees; track employee.id) {
                          <li>
                            <div class="node">
                              <mat-icon>person</mat-icon>
                              <span>{{ employee.name }}</span>
                              <span class="muted">{{ employee.email }}</span>
                            </div>
                          </li>
                        }
                      </ul>
                    }
                  </li>
                }
              </ul>
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
      .hierarchy,
      .panels {
        grid-column: 1 / -1;
      }
      .panels {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .tree {
        list-style: none;
        margin: 0;
        padding-left: 1rem;
        border-left: 1px solid rgba(0, 0, 0, 0.12);
      }
      .node {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0;
      }
      .node-name {
        font-weight: 500;
      }
      .muted {
        opacity: 0.75;
      }
      .error-card {
        margin-top: 1rem;
      }
    `,
  ],
})
export class ManagerDashboardComponent implements OnInit {
  private readonly managers = inject(ManagerService);

  protected readonly data = signal<ManagerDashboard | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly activity = recentActivityForRole('manager');

  ngOnInit(): void {
    this.loading.set(true);
    this.managers.dashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the Manager dashboard.');
        this.loading.set(false);
      },
    });
  }
}
