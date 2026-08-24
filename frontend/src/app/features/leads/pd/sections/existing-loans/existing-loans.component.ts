import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PdCondition, pdConditionsMet, watchFormForVisibilityChanges } from '../../pd-visibility.util';
import { buildExistingLoanRow } from '../../pd-repeater-factories';

const LOAN_TYPE_OPTIONS = [
  'Personal Loan', 'Business Loan', 'Instant App Loan', 'Home Loan', 'Mortgage Loan',
  'Gold Loan', 'Education Loan', 'Micro Finance Loan', 'Agriculture Loan', 'Crop Loan', 'Consumer Loan',
];
const STATUS_OPTIONS = ['Closed', 'Active', 'Foreclosed', 'Settled', 'Write off', 'Suit File'];
const REMARK_OPTIONS = ['STABLE', 'BT', 'OWEND CLOSE'];

/** Existing Loan / Obligations repeater (FormArray) — one row per existing loan the applicant is servicing. */
@Component({
  selector: 'app-pd-existing-loans',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './existing-loans.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdExistingLoansComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = input.required<FormGroup>();

  protected readonly loanTypeOptions = LOAN_TYPE_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly remarkOptions = REMARK_OPTIONS;

  ngOnInit(): void {
    watchFormForVisibilityChanges(this.form(), this.cdr, this.destroyRef);
  }

  protected pdVisible(conditions: PdCondition[]): boolean {
    return pdConditionsMet(this.form(), conditions);
  }

  protected get rows(): FormArray {
    return this.form().get('existing_loans') as FormArray;
  }

  protected addRow(): void {
    this.rows.push(buildExistingLoanRow(this.fb));
  }

  protected removeRow(index: number): void {
    this.rows.removeAt(index);
  }
}
