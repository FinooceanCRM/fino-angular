import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { buildFamilyMemberRow } from '../../pd-repeater-factories';

const RELATION_OPTIONS = [
  'Father', 'Mother', 'Brother', 'Sister', 'Son', 'Doughter', 'Spouse', 'Mother In Law', 'Father In Law',
];
const ACCOUNT_TYPE_OPTIONS = ['Saving A/C', 'Salary A/C', 'Current A/C', 'CC A/C', 'OD A/C'];
const INCOME_TYPE_OPTIONS = ['Bank salaried', 'Cash salaried', 'Business with itr', 'Business without itr', 'Professional', 'Other'];
const YES_NO = ['YES', 'NO'];

/** Income & Banking Details of Other Family Member repeater (FormArray). */
@Component({
  selector: 'app-pd-family-members',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './family-members.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdFamilyMembersComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = input.required<FormGroup>();

  protected readonly relationOptions = RELATION_OPTIONS;
  protected readonly accountTypeOptions = ACCOUNT_TYPE_OPTIONS;
  protected readonly incomeTypeOptions = INCOME_TYPE_OPTIONS;
  protected readonly yesNo = YES_NO;

  protected get rows(): FormArray {
    return this.form().get('family_members') as FormArray;
  }

  protected addRow(): void {
    this.rows.push(buildFamilyMemberRow(this.fb));
  }

  protected removeRow(index: number): void {
    this.rows.removeAt(index);
  }
}
