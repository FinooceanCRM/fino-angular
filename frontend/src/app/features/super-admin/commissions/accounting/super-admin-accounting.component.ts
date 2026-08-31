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
import { LedgerEntry, LEDGER_TYPE_LABEL } from '../../data/models/commission.model';
import { CommissionDataProvider } from '../../data/providers/commission-data.provider';

interface LedgerRow extends LedgerEntry {
  balance: number;
}

const TYPE_COLOUR: Record<LedgerEntry['type'], StatusPillColour> = {
  disbursement: 'default',
  connector_commission_accrued: 'primary',
  connector_commission_paid: 'success',
  affiliate_commission_accrued: 'accent',
  affiliate_commission_paid: 'success',
};

/** Accounting — the commission-liability ledger. Disbursements are shown for context but don't move the balance. */
@Component({
  selector: 'app-super-admin-accounting',
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
  templateUrl: './super-admin-accounting.component.html',
  styleUrl: './super-admin-accounting.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminAccountingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly commissionData = inject(CommissionDataProvider);

  protected readonly typeLabel = LEDGER_TYPE_LABEL;
  protected readonly typeColour = TYPE_COLOUR;

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    type: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  /** Chronological entries with a running "commission payable" balance — disbursements carry the balance forward unchanged. */
  private readonly ledgerRows = computed<LedgerRow[]>(() => {
    let balance = 0;
    return [...this.commissionData.ledger()]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => {
        if (entry.type !== 'disbursement') {
          balance += (entry.credit ?? 0) - (entry.debit ?? 0);
        }
        return { ...entry, balance };
      })
      .reverse();
  });

  protected readonly filteredRows = computed(() => {
    const f = this.filterValues();
    const search = (f.search ?? '').trim().toLowerCase();

    return this.ledgerRows().filter((row) => {
      const matchesSearch = !search || row.description.toLowerCase().includes(search);
      const matchesType = !f.type || row.type === f.type;
      return matchesSearch && matchesType;
    });
  });

  protected labelFor(type: LedgerEntry['type']): string {
    return LEDGER_TYPE_LABEL[type];
  }

  protected colourFor(type: LedgerEntry['type']): StatusPillColour {
    return TYPE_COLOUR[type];
  }

  protected readonly summary = computed(() => {
    const entries = this.commissionData.ledger();
    const totalDisbursed = entries
      .filter((entry) => entry.type === 'disbursement')
      .reduce((sum, entry) => sum + (entry.debit ?? 0), 0);
    const totalAccrued = entries
      .filter((entry) => entry.type === 'connector_commission_accrued' || entry.type === 'affiliate_commission_accrued')
      .reduce((sum, entry) => sum + (entry.credit ?? 0), 0);
    const totalPaid = entries
      .filter((entry) => entry.type === 'connector_commission_paid' || entry.type === 'affiliate_commission_paid')
      .reduce((sum, entry) => sum + (entry.debit ?? 0), 0);

    return { totalDisbursed, totalAccrued, totalPaid, outstanding: totalAccrued - totalPaid };
  });

  protected readonly columns: TableColumn<LedgerRow>[] = [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'debit', label: 'Debit', align: 'right' },
    { key: 'credit', label: 'Credit', align: 'right' },
    { key: 'balance', label: 'Balance', align: 'right' },
  ];

  protected export(): void {
    exportToCsv(
      'accounting-ledger',
      this.filteredRows().map((row) => ({
        date: row.date,
        type: this.typeLabel[row.type],
        description: row.description,
        debit: row.debit ?? '',
        credit: row.credit ?? '',
        balance: row.balance,
      })),
    );
  }
}
