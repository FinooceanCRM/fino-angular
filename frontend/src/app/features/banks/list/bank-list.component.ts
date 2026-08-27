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
  readonly employmentTypes = signal<CatalogueOption[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeFilter = signal('');
  readonly showAdvanced = signal(false);

  readonly filteredRows = computed(() => {
    const filter = this.activeFilter();
    return filter ? this.rows().filter((row) => row.loan_type === filter) : this.rows();
  });

  readonly form = this.fb.nonNullable.group({
    bank_name: ['', Validators.required],
    product_name: ['', Validators.required],
    loan_type: ['home', Validators.required],
    min_credit_score: [700],
    min_monthly_income: [25000, [Validators.required, Validators.min(0)]],
    interest_rate: [10.5],
    max_tenure_months: [null as number | null],
    max_loan_amount: [5000000],
    min_loan_amount: [100000, [Validators.required, Validators.min(0)]],
    processing_fee: [''],
    min_age: [null as number | null, [Validators.min(18), Validators.max(99)]],
    max_age: [null as number | null, [Validators.min(18), Validators.max(99)]],
    foir_dbr: [null as number | null, [Validators.min(0), Validators.max(100)]],
    employment_type: [''],
    business_vintage_years: [null as number | null, Validators.min(0)],
    eligible_locations: [''],
    negative_profile_rules: [''],
    special_conditions: [''],
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
      next: (metadata) => {
        this.loanTypes.set(metadata.loan_types);
        this.employmentTypes.set(metadata.employment_types);
      },
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

    const raw = this.form.getRawValue();
    const payload: BankCriteriaPayload = {
      bank_name: raw.bank_name,
      product_name: raw.product_name,
      loan_type: raw.loan_type,
      min_loan_amount: raw.min_loan_amount,
      max_loan_amount: raw.max_loan_amount || null,
      min_monthly_income: raw.min_monthly_income,
      min_credit_score: raw.min_credit_score || null,
      min_age: raw.min_age || null,
      max_age: raw.max_age || null,
      employment_type: raw.employment_type || null,
      interest_rate: raw.interest_rate || null,
      max_tenure_months: raw.max_tenure_months || null,
      processing_fee: raw.processing_fee.trim() || null,
      foir_dbr: raw.foir_dbr || null,
      business_vintage_years: raw.business_vintage_years || null,
      eligible_locations: raw.eligible_locations.trim() || null,
      negative_profile_rules: raw.negative_profile_rules.trim() || null,
      special_conditions: raw.special_conditions.trim() || null,
      is_active: raw.is_active,
    };

    this.banks.create(payload).subscribe({
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
