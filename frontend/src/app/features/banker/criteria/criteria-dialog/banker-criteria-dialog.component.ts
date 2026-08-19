import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ModalComponent } from '@shared/components/modal.component';

import { BankCriteria, BankCriteriaPayload, EligibilityRule } from '@core/models/bank.model';
import { CatalogueOption } from '@core/models/lead.model';

export interface BankerCriteriaDialogData {
  /** null = creating a new product; set = editing this one, form pre-filled from it. */
  criteria: BankCriteria | null;
  loanTypes: CatalogueOption[];
  employmentTypes: CatalogueOption[];
}

/**
 * Fields a Matching Rule can compare against — must stay in sync with the
 * `$allowed` list in `LeadMatchingService::applyRule()` on the backend; a
 * rule on any other field is silently skipped there rather than rejected,
 * so keeping this list identical avoids ever configuring a rule that quietly
 * does nothing.
 */
const RULE_FIELD_OPTIONS: CatalogueOption[] = [
  { value: 'loan_amount', label: 'Loan amount' },
  { value: 'monthly_income', label: 'Monthly income' },
  { value: 'credit_score', label: 'Credit score' },
  { value: 'tenure_months', label: 'Tenure (months)' },
  { value: 'employment_type', label: 'Employment type' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'pincode', label: 'Pincode' },
  { value: 'loan_type', label: 'Loan type' },
];

/** Mirrors the operators `LeadMatchingService::applyRule()` understands. */
const RULE_OPERATOR_OPTIONS: CatalogueOption[] = [
  { value: '=', label: 'Equals' },
  { value: '!=', label: 'Not equals' },
  { value: '>=', label: 'Greater than or equal to' },
  { value: '<=', label: 'Less than or equal to' },
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: 'in', label: 'One of (comma-separated)' },
  { value: 'not_in', label: 'None of (comma-separated)' },
];

/**
 * Add / edit dialog for a single lending product on the Banker's own Bank
 * Criteria page — real `BankService`, not mock data. Beyond the core fields
 * the matching engine always scores (amount range, income, credit score,
 * employment type), this also edits `eligibility_rules` — the same
 * configurable "Matching Rules" `LeadMatchingService::applyRule()` already
 * evaluates for every lead, just with no editor built for it until now.
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
    MatTooltipModule,
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
  protected readonly ruleFields = RULE_FIELD_OPTIONS;
  protected readonly ruleOperators = RULE_OPERATOR_OPTIONS;
  protected readonly isEdit = this.data.criteria !== null;

  protected readonly form = this.fb.nonNullable.group({
    bank_name: [this.data.criteria?.bank_name ?? '', Validators.required],
    product_name: [this.data.criteria?.product_name ?? '', Validators.required],
    loan_type: [this.data.criteria?.loan_type ?? this.loanTypes[0]?.value ?? 'home', Validators.required],
    min_loan_amount: [this.data.criteria?.min_loan_amount ?? 100000, [Validators.required, Validators.min(0)]],
    max_loan_amount: [this.data.criteria?.max_loan_amount ?? null as number | null],
    min_monthly_income: [this.data.criteria?.min_monthly_income ?? 25000, [Validators.required, Validators.min(0)]],
    min_credit_score: [this.data.criteria?.min_credit_score ?? null as number | null, [Validators.min(0), Validators.max(900)]],
    employment_type: [this.data.criteria?.employment_type ?? ''],
    interest_rate: [this.data.criteria?.interest_rate ?? null as number | null],
    is_active: [this.data.criteria?.is_active ?? true],
  });

  protected readonly rules = this.fb.array<FormGroup>(
    (this.data.criteria?.eligibility_rules ?? []).map((rule) => this.ruleGroup(rule)),
  );

  protected addRule(): void {
    this.rules.push(this.ruleGroup());
  }

  protected removeRule(index: number): void {
    this.rules.removeAt(index);
  }

  protected submit(): void {
    if (this.form.invalid || this.rules.invalid) {
      this.form.markAllAsTouched();
      this.rules.markAllAsTouched();
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
      employment_type: raw.employment_type || null,
      interest_rate: raw.interest_rate || null,
      eligibility_rules: this.collectRules(),
      is_active: raw.is_active,
    });
  }

  private ruleGroup(rule?: EligibilityRule): FormGroup {
    return this.fb.nonNullable.group({
      field: [rule?.field ?? this.ruleFields[0].value, Validators.required],
      operator: [rule?.operator ?? '=', Validators.required],
      value: [this.stringifyRuleValue(rule?.value), Validators.required],
      label: [rule?.label ?? ''],
    });
  }

  private collectRules(): EligibilityRule[] {
    return this.rules.controls.map((group) => {
      const raw = group.getRawValue() as { field: string; operator: string; value: string; label: string };
      const isMulti = raw.operator === 'in' || raw.operator === 'not_in';
      const value = isMulti
        ? raw.value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : raw.value.trim();

      return {
        field: raw.field,
        operator: raw.operator,
        value,
        label: raw.label.trim() || undefined,
      };
    });
  }

  private stringifyRuleValue(value: EligibilityRule['value'] | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    return Array.isArray(value) ? value.join(', ') : String(value);
  }
}
