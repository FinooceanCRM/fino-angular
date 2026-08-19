import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AssignedEmployee } from '@core/models/relationship-manager.model';
import { RelationshipManagerService } from '@core/services/relationship-manager.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

@Component({
  selector: 'app-relationship-manager-employees',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatProgressBarModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
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
      <mat-card class="notice">
        <mat-card-content>{{ message }}</mat-card-content>
      </mat-card>
    }

    <mat-card class="table-card">
      <mat-card-header>
        <mat-card-title>{{ total() }} employee(s)</mat-card-title>
        <mat-card-subtitle>
          You can only see employees assigned to you.
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <app-table
          [columns]="columns"
          [rows]="employees()"
          [loading]="loading()"
          emptyMessage="No employees are assigned to you yet."
          itemLabel="employees"
        >
          <ng-template appTableCell="joined" let-row>
            {{ row.date_of_joining ? (row.date_of_joining | date: 'mediumDate') : '—' }}
          </ng-template>

          <ng-template appTableCell="status" let-row>
            <app-status-pill
              [label]="row.is_active ? 'Active' : 'Inactive'"
              [colour]="row.is_active ? 'success' : 'default'"
            />
          </ng-template>
        </app-table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .table-card,
      .notice {
        margin-top: var(--app-space-4);
        border-radius: var(--app-radius-md);
      }
    `,
  ],
})
export class RelationshipManagerEmployeesComponent implements OnInit {
  private readonly relationshipManagers = inject(RelationshipManagerService);

  protected readonly columns: TableColumn<AssignedEmployee>[] = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code', formatter: (row) => row.employee_code ?? '—' },
    { key: 'designation', label: 'Designation', formatter: (row) => row.designation ?? '—' },
    { key: 'department', label: 'Department', formatter: (row) => row.department ?? '—' },
    { key: 'email', label: 'Email' },
    { key: 'joined', label: 'Joined' },
    { key: 'status', label: 'Status' },
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
