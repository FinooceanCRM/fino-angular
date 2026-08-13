import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { EmployeeDashboard } from '@core/models/employee.model';
import { EmployeeService } from '@core/services/employee.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-employee-dashboard',
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Employee dashboard"
      subtitle="Your personal workspace"
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

        <mat-card>
          <mat-card-header>
            <mat-card-title>Employee information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.employee.name }}</span>
                <span matListItemLine>Name</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.employee.email }}</span>
                <span matListItemLine>Email</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.employee.phone ?? '—' }}</span>
                <span matListItemLine>Phone</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.employee.employee_code ?? '—' }}</span>
                <span matListItemLine>Employee code</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.employee.designation ?? '—' }}</span>
                <span matListItemLine>Designation</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ dashboard.employee.department ?? '—' }}</span>
                <span matListItemLine>Department</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>
                  {{
                    dashboard.employee.date_of_joining
                      ? (dashboard.employee.date_of_joining | date: 'mediumDate')
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
            <mat-card-title>Assigned Relationship Manager</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (dashboard.relationship_manager; as rm) {
              <mat-list>
                <mat-list-item>
                  <span matListItemTitle>{{ rm.name }}</span>
                  <span matListItemLine>{{ rm.role_label }}</span>
                </mat-list-item>
                <mat-list-item>
                  <span matListItemTitle>{{ rm.email }}</span>
                  <span matListItemLine>Email</span>
                </mat-list-item>
                <mat-list-item>
                  <span matListItemTitle>{{ rm.phone ?? '—' }}</span>
                  <span matListItemLine>Phone</span>
                </mat-list-item>
              </mat-list>
            } @else {
              <p class="muted">No Relationship Manager assigned yet.</p>
            }
            <a mat-button routerLink="/employee/team">View my team</a>
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
      .welcome {
        grid-column: 1 / -1;
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
export class EmployeeDashboardComponent implements OnInit {
  private readonly employees = inject(EmployeeService);

  protected readonly data = signal<EmployeeDashboard | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.employees.dashboard().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load the employee dashboard.');
        this.loading.set(false);
      },
    });
  }
}
