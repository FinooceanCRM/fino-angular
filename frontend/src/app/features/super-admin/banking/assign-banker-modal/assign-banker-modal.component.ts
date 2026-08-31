import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { ModalComponent } from '@shared/components/modal.component';

import { Lead, UserSummary, loanTypeLabel } from '../../data/models/lead.model';

export interface AssignBankerModalData {
  lead: Lead;
  bankers: UserSummary[];
}

/** Banker assignment interface — resolves with the chosen banker, or `null` to unassign. */
@Component({
  selector: 'app-assign-banker-modal',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    ModalComponent,
  ],
  templateUrl: './assign-banker-modal.component.html',
  styleUrl: './assign-banker-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignBankerModalComponent {
  protected readonly data = inject<AssignBankerModalData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<AssignBankerModalComponent, UserSummary | null>);

  protected readonly selectedId = signal<number | null>(this.data.lead.assigned_banker?.id ?? null);

  protected readonly loanTypeLabel = loanTypeLabel;

  protected confirm(): void {
    const banker = this.data.bankers.find((candidate) => candidate.id === this.selectedId()) ?? null;
    this.dialogRef.close(banker);
  }
}
