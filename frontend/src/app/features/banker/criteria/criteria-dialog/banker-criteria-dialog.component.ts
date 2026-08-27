import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ModalComponent } from '@shared/components/modal.component';

import { BankCriteria, BankCriteriaPayload } from '@core/models/bank.model';
import { CatalogueOption } from '@core/models/lead.model';

export interface BankerCriteriaDialogData {
  /** null = creating a new product; set = editing this one, form pre-filled from it. */
  criteria: BankCriteria | null;
  loanTypes: CatalogueOption[];
  employmentTypes: CatalogueOption[];
}

/**
 * "Submit Bank Criteria" add/edit dialog — real `BankService`, not mock
 * data. Split into a Basic Criteria section (always visible) and an
 * Advanced Criteria section (collapsible, optional). Submitting notifies
 * Manager/Employee/Connector users (see `BankCriteriaService::create()`).
 */
@Component({
  selector: 'app-banker-criteria-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ModalComponent,
  ],
  templateUrl: './banker-criteria-dialog.component.html',
  styleUrl: './banker-criteria-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerCriteriaDialogComponent {
  protected readonly data = inject<BankerCriteriaDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<BankerCriteriaDialogComponent, BankCriteriaPayload>);
  private readonly fb = inject(FormBuilder);

  protected readonly loanTypes = this.data.loanTypes;
  protected readonly employmentTypes = this.data.employmentTypes;
  protected readonly isEdit = this.data.criteria !== null;
  protected readonly showAdvanced = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    bank_name: [this.data.criteria?.bank_name ?? '', Validators.required],
    product_name: [this.data.criteria?.product_name ?? '', Validators.required],
    loan_type: [this.data.criteria?.loan_type ?? this.loanTypes[0]?.value ?? 'home', Validators.required],
    min_credit_score: [this.data.criteria?.min_credit_score ?? null as number | null, [Validators.min(0), Validators.max(900)]],
    min_monthly_income: [this.data.criteria?.min_monthly_income ?? 25000, [Validators.required, Validators.min(0)]],
    interest_rate: [this.data.criteria?.interest_rate ?? null as number | null],
    max_tenure_months: [this.data.criteria?.max_tenure_months ?? null as number | null, Validators.min(0)],
    max_loan_amount: [this.data.criteria?.max_loan_amount ?? null as number | null],
    min_loan_amount: [this.data.criteria?.min_loan_amount ?? 100000, [Validators.required, Validators.min(0)]],
    processing_fee: [this.data.criteria?.processing_fee ?? ''],
    min_age: [this.data.criteria?.min_age ?? null as number | null, [Validators.min(18), Validators.max(99)]],
    max_age: [this.data.criteria?.max_age ?? null as number | null, [Validators.min(18), Validators.max(99)]],
    foir_dbr: [this.data.criteria?.foir_dbr ?? null as number | null, [Validators.min(0), Validators.max(100)]],
    employment_type: [this.data.criteria?.employment_type ?? ''],
    business_vintage_years: [this.data.criteria?.business_vintage_years ?? null as number | null, Validators.min(0)],
    eligible_locations: [this.data.criteria?.eligible_locations ?? ''],
    negative_profile_rules: [this.data.criteria?.negative_profile_rules ?? ''],
    special_conditions: [this.data.criteria?.special_conditions ?? ''],
    is_active: [this.data.criteria?.is_active ?? true],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.dialogRef.close({
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
    });
  }
}
