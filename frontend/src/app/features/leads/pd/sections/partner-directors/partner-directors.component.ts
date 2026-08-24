import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PdCondition, pdConditionsMet, watchFormForVisibilityChanges } from '../../pd-visibility.util';
import { buildPartnerDirectorRow } from '../../pd-repeater-factories';

const YES_NO = ['YES', 'NO'];

/**
 * Partner / Director Information repeater (FormArray) — only relevant when
 * the applicant's business is a Partnership (`Partnership_Business` and
 * `PARTNERSHIP` both = YES), same as the original Form 39.
 */
@Component({
  selector: 'app-pd-partner-directors',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './partner-directors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdPartnerDirectorsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = input.required<FormGroup>();

  protected readonly yesNo = YES_NO;

  ngOnInit(): void {
    watchFormForVisibilityChanges(this.form(), this.cdr, this.destroyRef);
  }

  protected get rows(): FormArray {
    return this.form().get('partner_directors') as FormArray;
  }

  protected pdVisible(conditions: PdCondition[]): boolean {
    return pdConditionsMet(this.form(), conditions);
  }

  protected addRow(): void {
    this.rows.push(buildPartnerDirectorRow(this.fb));
  }

  protected removeRow(index: number): void {
    this.rows.removeAt(index);
  }
}
