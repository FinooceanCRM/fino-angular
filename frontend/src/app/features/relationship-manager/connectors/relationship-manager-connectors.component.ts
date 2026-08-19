import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AssignedConnector } from '@core/models/relationship-manager.model';
import { RelationshipManagerService } from '@core/services/relationship-manager.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

@Component({
  selector: 'app-relationship-manager-connectors',
  standalone: true,
  imports: [
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
      title="My connectors"
      subtitle="Connectors assigned to you (read-only)"
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
        <mat-card-title>{{ total() }} connector(s)</mat-card-title>
        <mat-card-subtitle>
          Connectors stay outside the reporting hierarchy; you are their point
          of contact.
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <app-table
          [columns]="columns"
          [rows]="connectors()"
          [loading]="loading()"
          emptyMessage="No connectors are assigned to you yet."
          itemLabel="connectors"
        >
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
export class RelationshipManagerConnectorsComponent implements OnInit {
  private readonly relationshipManagers = inject(RelationshipManagerService);

  protected readonly columns: TableColumn<AssignedConnector>[] = [
    { key: 'name', label: 'Name', formatter: (row) => row.name ?? '—' },
    { key: 'company', label: 'Company', formatter: (row) => row.company_name ?? '—' },
    { key: 'contact', label: 'Contact person', formatter: (row) => row.contact_person ?? '—' },
    { key: 'email', label: 'Email', formatter: (row) => row.email ?? '—' },
    { key: 'city', label: 'City', formatter: (row) => row.city ?? '—' },
    { key: 'status', label: 'Status' },
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
