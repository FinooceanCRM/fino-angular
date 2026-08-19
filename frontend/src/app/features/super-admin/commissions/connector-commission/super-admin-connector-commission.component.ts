import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillColour, StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { exportToCsv } from '../../data/csv-export.util';
import { ConnectorCommissionRow } from '../../data/models/commission.model';
import { CommissionDataProvider } from '../../data/providers/commission-data.provider';

const STATUS_COLOUR: Record<ConnectorCommissionRow['status'], StatusPillColour> = {
  paid: 'success',
  accrued: 'primary',
  pending: 'default',
};

/** Connector Commission — mock ledger derived from disbursed/approved leads, no HTTP. */
@Component({
  selector: 'app-super-admin-connector-commission',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    StatCardComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './super-admin-connector-commission.component.html',
  styleUrl: './super-admin-connector-commission.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminConnectorCommissionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly commissionData = inject(CommissionDataProvider);

  protected readonly rows = this.commissionData.connectorCommissions;

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    status: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly filteredRows = computed(() => {
    const f = this.filterValues();
    const search = (f.search ?? '').trim().toLowerCase();

    return this.rows().filter((row) => {
      const matchesSearch =
        !search ||
        row.connector_name.toLowerCase().includes(search) ||
        row.lead_reference.toLowerCase().includes(search) ||
        row.applicant_name.toLowerCase().includes(search);
      const matchesStatus = !f.status || row.status === f.status;
      return matchesSearch && matchesStatus;
    });
  });

  protected colourFor(status: ConnectorCommissionRow['status']): StatusPillColour {
    return STATUS_COLOUR[status];
  }

  protected readonly summary = computed(() => {
    const rows = this.rows();
    const total = rows.reduce((sum, row) => sum + row.commission_amount, 0);
    const paid = rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.commission_amount, 0);
    const outstanding = total - paid;
    const activeConnectors = new Set(rows.map((row) => row.connector_id)).size;

    return { total, paid, outstanding, activeConnectors };
  });

  protected readonly columns: TableColumn<ConnectorCommissionRow>[] = [
    { key: 'connector_name', label: 'Connector' },
    { key: 'lead_reference', label: 'Lead' },
    { key: 'applicant_name', label: 'Applicant' },
    { key: 'loan', label: 'Loan' },
    { key: 'commission', label: 'Commission' },
    { key: 'status', label: 'Status' },
    { key: 'earned_at', label: 'Earned' },
  ];

  protected export(): void {
    exportToCsv(
      'connector-commission',
      this.filteredRows().map((row) => ({
        connector: row.connector_name,
        lead_reference: row.lead_reference,
        applicant: row.applicant_name,
        loan_type: row.loan_type,
        loan_amount: row.loan_amount,
        commission_rate_pct: row.commission_rate,
        commission_amount: row.commission_amount,
        status: row.status,
        earned_at: row.earned_at,
        paid_at: row.paid_at ?? '',
      })),
    );
  }
}
