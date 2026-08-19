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
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { BankCriteria } from '@features/super-admin/data/models/banker.model';

import { LOAN_TYPE_CATALOGUE, loanTypeLabel } from '../../leads/data/models/lead.model';
import { ManagerBankerDataProvider } from '../data/manager-banker.provider';

/** Banker Criteria — read-only reference view of the bank products leads are matched against. */
@Component({
  selector: 'app-manager-banker-criteria',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './manager-banker-criteria.component.html',
  styleUrl: './manager-banker-criteria.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerBankerCriteriaComponent {
  private readonly bankers = inject(ManagerBankerDataProvider);
  private readonly fb = inject(FormBuilder);

  protected readonly loanTypes = LOAN_TYPE_CATALOGUE;
  protected readonly loanTypeLabel = loanTypeLabel;

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    loanType: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly rows = computed(() => {
    const f = this.filterValues();
    const search = (f.search ?? '').trim().toLowerCase();

    return this.bankers.criteria().filter((row) => {
      const matchesSearch =
        !search || row.bank_name.toLowerCase().includes(search) || row.product_name.toLowerCase().includes(search);
      const matchesLoanType = !f.loanType || row.loan_type === f.loanType;
      return matchesSearch && matchesLoanType;
    });
  });

  protected readonly columns: TableColumn<BankCriteria>[] = [
    { key: 'bank_name', label: 'Bank' },
    { key: 'product_name', label: 'Product' },
    { key: 'loan_type', label: 'Loan type', formatter: (row) => loanTypeLabel(row.loan_type) },
    {
      key: 'amount',
      label: 'Amount range',
      formatter: (row) =>
        `₹${row.min_loan_amount.toLocaleString('en-IN')} – ${row.max_loan_amount ? '₹' + row.max_loan_amount.toLocaleString('en-IN') : 'no max'}`,
    },
    { key: 'min_monthly_income', label: 'Min income', formatter: (row) => `₹${row.min_monthly_income.toLocaleString('en-IN')}` },
    { key: 'interest_rate', label: 'Interest rate', formatter: (row) => (row.interest_rate ? `${row.interest_rate}%` : '—') },
    { key: 'status', label: 'Status' },
  ];

  protected applyFilters(): void {
    // Filtering is fully reactive via `filterValues`; nothing extra to do on submit.
  }
}
