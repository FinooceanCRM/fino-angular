import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ReasonDialogComponent } from '@shared/components/reason-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillColour, StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { exportToCsv } from '../../data/csv-export.util';
import { Payout } from '../../data/models/commission.model';
import { CommissionDataProvider } from '../../data/providers/commission-data.provider';

type PayoutView = 'all' | 'queue' | 'history' | 'failed';

const STATUS_COLOUR: Record<Payout['status'], StatusPillColour> = {
  pending: 'default',
  processing: 'accent',
  paid: 'success',
  failed: 'warn',
};

/** Payouts — the queue (pending/processing/failed) and the payment history (paid) live on one page. */
@Component({
  selector: 'app-super-admin-payouts',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    PageHeaderComponent,
    StatCardComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './super-admin-payouts.component.html',
  styleUrl: './super-admin-payouts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminPayoutsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly commissionData = inject(CommissionDataProvider);

  protected readonly view = signal<PayoutView>('all');

  protected readonly rows = this.commissionData.payouts;

  protected readonly searchControl = this.fb.nonNullable.control('');
  private readonly search = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  private readonly viewRows = computed(() => {
    const v = this.view();
    if (v === 'queue') return this.rows().filter((row) => row.status === 'pending' || row.status === 'processing');
    if (v === 'history') return this.rows().filter((row) => row.status === 'paid');
    if (v === 'failed') return this.rows().filter((row) => row.status === 'failed');
    return this.rows();
  });

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.viewRows();
    }
    return this.viewRows().filter(
      (row) => row.payee_name.toLowerCase().includes(term) || row.reference.toLowerCase().includes(term),
    );
  });

  protected readonly summary = computed(() => {
    const all = this.rows();
    const pendingAmount = all
      .filter((row) => row.status === 'pending' || row.status === 'processing')
      .reduce((sum, row) => sum + row.amount, 0);
    // Payouts are real (Super Admin connector/affiliate payout endpoints),
    // so "last 30 days" is measured against the real current date, not the
    // fixed MOCK_TODAY other still-mock report pages anchor to.
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const paidThisMonth = all
      .filter((row) => row.status === 'paid' && row.paid_at && new Date(row.paid_at).getTime() >= thirtyDaysAgo)
      .reduce((sum, row) => sum + row.amount, 0);
    const failedCount = all.filter((row) => row.status === 'failed').length;

    return { totalCount: all.length, pendingAmount, paidThisMonth, failedCount };
  });

  protected readonly columns: TableColumn<Payout>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'payee_name', label: 'Payee' },
    { key: 'payee_type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status' },
    { key: 'requested_at', label: 'Requested' },
  ];

  protected colourFor(status: Payout['status']): StatusPillColour {
    return STATUS_COLOUR[status];
  }

  protected approve(row: Payout): void {
    this.commissionData.decidePayout(row, 'approve').subscribe({
      next: () => this.snackBar.open(`${row.reference} approved.`, 'Dismiss', { duration: 4000 }),
      error: () => this.snackBar.open(`Could not approve ${row.reference}.`, 'Dismiss', { duration: 4000 }),
    });
  }

  protected markPaid(row: Payout): void {
    this.commissionData.decidePayout(row, 'markPaid').subscribe({
      next: () => this.snackBar.open(`${row.reference} marked as paid.`, 'Dismiss', { duration: 4000 }),
      error: () => this.snackBar.open(`Could not mark ${row.reference} as paid.`, 'Dismiss', { duration: 4000 }),
    });
  }

  protected reject(row: Payout): void {
    this.dialog
      .open(ReasonDialogComponent, {
        data: {
          title: 'Reject payout',
          message: `Rejecting payout ${row.reference} to ${row.payee_name}. The reason is recorded on the payout.`,
          reasonLabel: 'Reason for rejection',
          confirmLabel: 'Reject',
        },
      })
      .afterClosed()
      .subscribe((reason: string | undefined) => {
        if (!reason) {
          return;
        }

        this.commissionData.decidePayout(row, 'reject', reason).subscribe({
          next: () => this.snackBar.open(`${row.reference} rejected.`, 'Dismiss', { duration: 4000 }),
          error: () => this.snackBar.open(`Could not reject ${row.reference}.`, 'Dismiss', { duration: 4000 }),
        });
      });
  }

  protected export(): void {
    exportToCsv(
      'payouts',
      this.filteredRows().map((row) => ({
        reference: row.reference,
        payee: row.payee_name,
        payee_type: row.payee_type,
        amount: row.amount,
        method: row.method,
        status: row.status,
        requested_at: row.requested_at,
        paid_at: row.paid_at ?? '',
      })),
    );
  }
}
