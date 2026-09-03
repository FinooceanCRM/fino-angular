import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { ModalComponent } from '@shared/components/modal.component';
import { BankCriteria, EligibilityRule } from '@core/models/bank.model';
import { CatalogueOption } from '@core/models/lead.model';

export interface BankerCriteriaDetailsDialogData {
  criteria: BankCriteria | BankCriteria[];
  loanTypes: CatalogueOption[];
  employmentTypes: CatalogueOption[];
}

@Component({
  selector: 'app-banker-criteria-details-dialog',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatIconModule, ModalComponent],
  templateUrl: './banker-criteria-details-dialog.component.html',
  styleUrl: './banker-criteria-details-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerCriteriaDetailsDialogComponent {
  protected readonly data = inject<BankerCriteriaDetailsDialogData>(MAT_DIALOG_DATA);
  protected readonly criteriaRows = Array.isArray(this.data.criteria) ? this.data.criteria : [this.data.criteria];
  protected readonly dialogRef = inject(MatDialogRef<BankerCriteriaDetailsDialogComponent>);

  protected loanTypeLabel(value: string): string {
    return this.data.loanTypes.find((option) => option.value === value)?.label ?? value;
  }

  protected employmentTypeLabel(value: string | null): string {
    if (!value) {
      return 'Any';
    }
    return this.data.employmentTypes.find((option) => option.value === value)?.label ?? value;
  }

  protected ruleValue(rule: EligibilityRule): string {
    if (rule.value === null || rule.value === '') {
      return 'Not specified';
    }
    return Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value);
  }
}
