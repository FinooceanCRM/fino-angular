import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

import { ManagedEmployee } from '@core/models/manager.model';
import { ManagerService } from '@core/services/manager.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-manager-employees',
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTableModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="My employees"
      subtitle="Employees belonging to your Relationship Managers"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (error(); as message) {
      <mat-card class="notice">
        <mat-card-content>{{ message }}</mat-card-content>
      </mat-card>
    }

    <mat-card class="card">
      <mat-card-header>
        <mat-card-title>{{ total() }} employee(s)</mat-card-title>
        <mat-card-subtitle>Read-only view scoped to your subtree.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (rows().length === 0 && !loading()) {
          <p class="muted">No employees are assigned under your team yet.</p>
        } @else {
          <table mat-table [dataSource]="rows()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let row">{{ row.email }}</td>
            </ng-container>

            <ng-container matColumnDef="rm">
              <th mat-header-cell *matHeaderCellDef>Relationship Manager</th>
              <td mat-cell *matCellDef="let row">
                {{ row.relationship_manager?.name ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="department">
              <th mat-header-cell *matHeaderCellDef>Department</th>
              <td mat-cell *matCellDef="let row">{{ row.department ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip [highlighted]="row.is_active">{{ row.status }}</mat-chip>
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
      .card,
      .notice {
        margin-top: 1rem;
      }
      .full-width {
        width: 100%;
      }
      .muted {
        opacity: 0.75;
      }
    `,
  ],
})
export class ManagerEmployeesComponent implements OnInit {
  private readonly managers = inject(ManagerService);

  protected readonly columns = ['name', 'email', 'rm', 'department', 'status'];
  protected readonly rows = signal<ManagedEmployee[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.managers.employees().subscribe({
      next: (result) => {
        this.rows.set(result.employees);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load employees.');
        this.loading.set(false);
      },
    });
  }
}
