import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { BankCriteria, BankCriteriaPayload } from '@core/models/bank.model';
import { CatalogueOption } from '@core/models/lead.model';
import { AuthService } from '@core/services/auth.service';
import { BankService } from '@core/services/bank.service';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

@Component({
  selector: 'app-bank-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    FormsModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    StatusPillComponent,
  ],
  templateUrl: './bank-list.component.html',
  styleUrl: './bank-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankListComponent implements OnInit {
  private readonly banks = inject(BankService);
  private readonly leads = inject(LeadService);
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly rows = signal<BankCriteria[]>([]);
  readonly loanTypes = signal<CatalogueOption[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeFilter = signal('');

  readonly filteredRows = computed(() => {
    const filter = this.activeFilter();
    return filter ? this.rows().filter((row) => row.loan_type === filter) : this.rows();
  });

  readonly form = this.fb.nonNullable.group({
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

  canManage(): boolean {
    return this.auth.hasRole('super_admin', 'banker');
  }

  isMine(row: BankCriteria): boolean {
    return this.auth.hasRole('banker') && row.banker_id === this.auth.user()?.id;
  }

  /** Super Admin can toggle any row; a Banker can only toggle their own. */
  canToggle(row: BankCriteria): boolean {
    return this.auth.hasRole('super_admin') || this.isMine(row);
  }

  ngOnInit(): void {
    this.load();
    this.leads.metadata().subscribe({
      next: (metadata) => this.loanTypes.set(metadata.loan_types),
      error: () => undefined,
    });
  }

  load(): void {
    this.loading.set(true);
    this.banks.list({ per_page: 50 }).subscribe({
      next: (result) => {
        this.rows.set(result.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Bank criteria could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.banks.create(this.form.getRawValue() as BankCriteriaPayload).subscribe({
      next: () => {
        this.form.reset({
          loan_type: 'home',
          min_loan_amount: 100000,
          max_loan_amount: 5000000,
          min_monthly_income: 25000,
          min_credit_score: 700,
          interest_rate: 10.5,
          is_active: true,
          bank_name: '',
          product_name: '',
        });
        this.load();
      },
      error: () => this.error.set('The bank product could not be saved.'),
    });
  }

  toggle(row: BankCriteria): void {
    this.banks.update(row.id, { is_active: !row.is_active }).subscribe({
      next: () => this.load(),
      error: () => this.error.set('The bank product could not be updated.'),
    });
  }
}
