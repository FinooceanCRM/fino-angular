import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ModalComponent } from './modal.component';

export interface ReasonDialogData {
  title: string;
  message: string;
  reasonLabel?: string;
  confirmLabel?: string;
}

/**
 * Confirmation dialog that requires a written reason before proceeding —
 * used for reject flows (lead status, access requests) where the person on
 * the other end needs to know why. Resolves `afterClosed()` with the typed
 * reason, or `undefined` if cancelled.
 */
@Component({
  selector: 'app-reason-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, ModalComponent],
  templateUrl: './reason-dialog.component.html',
  styleUrl: './reason-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReasonDialogComponent {
  protected readonly data = inject<ReasonDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ReasonDialogComponent>);

  protected readonly reason = signal('');

  protected submit(): void {
    const value = this.reason().trim();
    if (!value) {
      return;
    }

    this.dialogRef.close(value);
  }
}
