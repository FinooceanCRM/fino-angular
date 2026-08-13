import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';

import { AssignedConnector } from '@core/models/relationship-manager.model';
import { RelationshipManagerService } from '@core/services/relationship-manager.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-relationship-manager-connectors',
  standalone: true,
  imports: [
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
      title="My connectors"
      subtitle="Connectors assigned to you (read-only)"
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
        <mat-card-title>{{ total() }} connector(s)</mat-card-title>
        <mat-card-subtitle>
          Connectors stay outside the reporting hierarchy; you are their point
          of contact.
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (connectors().length === 0 && !loading()) {
          <p class="muted">No connectors are assigned to you yet.</p>
        } @else {
          <table mat-table [dataSource]="connectors()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.name ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="company">
              <th mat-header-cell *matHeaderCellDef>Company</th>
              <td mat-cell *matCellDef="let row">{{ row.company_name ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="contact">
              <th mat-header-cell *matHeaderCellDef>Contact person</th>
              <td mat-cell *matCellDef="let row">{{ row.contact_person ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let row">{{ row.email ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="city">
              <th mat-header-cell *matHeaderCellDef>City</th>
              <td mat-cell *matCellDef="let row">{{ row.city ?? '—' }}</td>
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
export class RelationshipManagerConnectorsComponent implements OnInit {
  private readonly relationshipManagers = inject(RelationshipManagerService);

  protected readonly columns = [
    'name',
    'company',
    'contact',
    'email',
    'city',
    'status',
  ];
  protected readonly connectors = signal<AssignedConnector[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.relationshipManagers.connectors().subscribe({
      next: (result) => {
        this.connectors.set(result.connectors);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your connectors.');
        this.loading.set(false);
      },
    });
  }
}
