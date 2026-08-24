import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PdCondition, pdConditionsMet, watchFormForVisibilityChanges } from '../../pd-visibility.util';

/** One Full PD form section — a thin presentational slice of the shared master `form`. */
@Component({
  selector: 'app-pd-applicant-itr',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './applicant-itr.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdApplicantItrComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = input.required<FormGroup>();

  ngOnInit(): void {
    watchFormForVisibilityChanges(this.form(), this.cdr, this.destroyRef);
  }

  protected pdVisible(conditions: PdCondition[]): boolean {
    return pdConditionsMet(this.form(), conditions);
  }
}
