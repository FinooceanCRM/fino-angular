import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { LOAN_TYPE_CATALOGUE } from '../../data/models/lead.model';
import { BankCriteria } from '../../data/models/banker.model';
import { BankingDataProvider } from '../../data/providers/banking-data.provider';

/** Criteria management table — real bank products via `BankingDataProvider` (Phase 2). */
@Component({
  selector: 'app-super-admin-bank-criteria',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './super-admin-bank-criteria.component.html',
  styleUrl: './super-admin-bank-criteria.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminBankCriteriaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly bankingData = inject(BankingDataProvider);

  protected readonly loanTypes = LOAN_TYPE_CATALOGUE;
  protected readonly showForm = signal(false);

  protected readonly rows = this.bankingData.criteria;

  protected readonly searchControl = this.fb.nonNullable.control('');
  private readonly search = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  protected readonly activeFilter = signal('');

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const loanType = this.activeFilter();

    return this.rows().filter((row) => {
      const matchesSearch =
        !term || row.bank_name.toLowerCase().includes(term) || row.product_name.toLowerCase().includes(term);
      const matchesType = !loanType || row.loan_type === loanType;
      return matchesSearch && matchesType;
    });
  });

  protected readonly columns: TableColumn<BankCriteria>[] = [
    { key: 'bank_name', label: 'Bank' },
    { key: 'product_name', label: 'Product' },
    { key: 'loan_type', label: 'Loan type', formatter: (row) => this.loanTypeLabel(row.loan_type) },
    { key: 'amount', label: 'Amount range', align: 'right' },
    { key: 'income', label: 'Min. income', align: 'right' },
    { key: 'min_credit_score', label: 'Min. credit score', formatter: (row) => row.min_credit_score?.toString() ?? '—', align: 'right' },
    { key: 'interest_rate', label: 'Interest', formatter: (row) => (row.interest_rate ? `${row.interest_rate}%` : '—'), align: 'right' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    bank_name: ['', Validators.required],
    product_name: ['', Validators.required],
    loan_type: ['home', Validators.required],
    min_loan_amount: [100000, [Validators.required, Validators.min(0)]],
    max_loan_amount: [5000000],
    min_monthly_income: [25000, [Validators.required, Validators.min(0)]],
    min_credit_score: [700],
    interest_rate: [10.5],
    is_active: [true],
  });

  protected loanTypeLabel(value: string): string {
    return this.loanTypes.find((option) => option.value === value)?.label ?? value;
  }

  protected create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.bankingData.create({
      bank_name: raw.bank_name,
      product_name: raw.product_name,
      loan_type: raw.loan_type,
      min_loan_amount: raw.min_loan_amount,
      max_loan_amount: raw.max_loan_amount || null,
      min_monthly_income: raw.min_monthly_income,
      min_credit_score: raw.min_credit_score || null,
      interest_rate: raw.interest_rate || null,
      is_active: raw.is_active,
    });

    this.form.reset({
      bank_name: '',
      product_name: '',
      loan_type: 'home',
      min_loan_amount: 100000,
      max_loan_amount: 5000000,
      min_monthly_income: 25000,
      min_credit_score: 700,
      interest_rate: 10.5,
      is_active: true,
    });
    this.showForm.set(false);
  }

  protected toggle(row: BankCriteria): void {
    this.bankingData.toggleActive(row.id);
  }
}
