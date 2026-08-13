import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

import { AssignedEmployee } from '@core/models/relationship-manager.model';
import { RelationshipManagerService } from '@core/services/relationship-manager.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-relationship-manager-employees',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="My employees"
      subtitle="Employees assigned to you (read-only)"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (error(); as message) {
      <mat-card class="error-card">
        <mat-card-content>{{ message }}</mat-card-content>
      </mat-card>
    }

    <mat-card class="card">
      <mat-card-header>
        <mat-card-title>{{ total() }} employee(s)</mat-card-title>
        <mat-card-subtitle>
          You can only see employees assigned to you.
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (employees().length === 0 && !loading()) {
          <p class="muted">No employees are assigned to you yet.</p>
        } @else {
          <table mat-table [dataSource]="employees()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Code</th>
              <td mat-cell *matCellDef="let row">{{ row.employee_code ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="designation">
              <th mat-header-cell *matHeaderCellDef>Designation</th>
              <td mat-cell *matCellDef="let row">{{ row.designation ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="department">
              <th mat-header-cell *matHeaderCellDef>Department</th>
              <td mat-cell *matCellDef="let row">{{ row.department ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let row">{{ row.email }}</td>
            </ng-container>

            <ng-container matColumnDef="joined">
              <th mat-header-cell *matHeaderCellDef>Joined</th>
              <td mat-cell *matCellDef="let row">
                {{
                  row.date_of_joining
                    ? (row.date_of_joining | date: 'mediumDate')
                    : '—'
                }}
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip [highlighted]="row.is_active">
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </mat-chip>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin-top: 1rem;
      }
      .full-width {
        width: 100%;
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
export class RelationshipManagerEmployeesComponent implements OnInit {
  private readonly relationshipManagers = inject(RelationshipManagerService);

  protected readonly columns = [
    'name',
    'code',
    'designation',
    'department',
    'email',
    'joined',
    'status',
  ];
  protected readonly employees = signal<AssignedEmployee[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.relationshipManagers.employees().subscribe({
      next: (result) => {
        this.employees.set(result.employees);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your employees.');
        this.loading.set(false);
      },
    });
  }
}
