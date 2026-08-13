import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { EmployeeTeam } from '@core/models/employee.model';
import { EmployeeService } from '@core/services/employee.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-employee-team',
  standalone: true,
  imports: [
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
      title="My team"
      subtitle="Your details and reporting Relationship Manager"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (error(); as message) {
      <mat-card class="error-card">
        <mat-card-content>{{ message }}</mat-card-content>
      </mat-card>
    }

    @if (data(); as team) {
      <div class="grid">
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>person</mat-icon>
            <mat-card-title>{{ team.employee.name }}</mat-card-title>
            <mat-card-subtitle>{{ team.employee.role_label }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item>
                <span matListItemTitle>{{ team.employee.email }}</span>
                <span matListItemLine>Email</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ team.employee.phone ?? '—' }}</span>
                <span matListItemLine>Phone</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ team.employee.employee_code ?? '—' }}</span>
                <span matListItemLine>Employee code</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ team.employee.designation ?? '—' }}</span>
                <span matListItemLine>Designation</span>
              </mat-list-item>
              <mat-list-item>
                <span matListItemTitle>{{ team.employee.department ?? '—' }}</span>
                <span matListItemLine>Department</span>
              </mat-list-item>
            </mat-list>
            <mat-chip-set>
              <mat-chip [highlighted]="team.employee.is_active">
                {{ team.employee.is_active ? 'Active' : 'Inactive' }}
              </mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>supervisor_account</mat-icon>
            <mat-card-title>Reporting Relationship Manager</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (team.relationship_manager; as rm) {
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
          </mat-card-content>
        </mat-card>

        <mat-card class="chain">
          <mat-card-header>
            <mat-card-title>Reporting chain</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (team.reporting_chain.length) {
              <mat-chip-set>
                @for (person of team.reporting_chain; track person.id) {
                  <mat-chip>{{ person.role_label }}: {{ person.name }}</mat-chip>
                }
                <mat-chip [highlighted]="true">
                  {{ team.employee.role_label }}: {{ team.employee.name }}
                </mat-chip>
              </mat-chip-set>
            } @else {
              <p class="muted">Reporting chain is not configured yet.</p>
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
      .chain {
        grid-column: 1 / -1;
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
export class EmployeeTeamComponent implements OnInit {
  private readonly employees = inject(EmployeeService);

  protected readonly data = signal<EmployeeTeam | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.employees.team().subscribe({
      next: (team) => {
        this.data.set(team);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your team information.');
        this.loading.set(false);
      },
    });
  }
}
