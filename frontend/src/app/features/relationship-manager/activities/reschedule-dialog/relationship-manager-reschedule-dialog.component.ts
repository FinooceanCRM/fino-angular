import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ModalComponent } from '@shared/components/modal.component';

export interface RescheduleDialogData {
  title: string;
  currentDueAt: string;
}

export interface RescheduleDialogResult {
  dueAt: string;
  notes: string;
}

/** Reschedule a call / meeting / task / reminder — new due date plus optional notes. */
@Component({
  selector: 'app-relationship-manager-reschedule-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="'Reschedule — ' + data.title" [showActions]="true">
      <mat-form-field appearance="outline" class="field">
        <mat-label>New date</mat-label>
        <input matInput type="date" [ngModel]="dueDate()" (ngModelChange)="dueDate.set($event)" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Notes (optional)</mat-label>
        <textarea matInput rows="2" [ngModel]="notes()" (ngModelChange)="notes.set($event)"></textarea>
      </mat-form-field>

      <button modal-actions mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button modal-actions mat-flat-button color="primary" type="button" [disabled]="!dueDate()" (click)="submit()">
        Reschedule
      </button>
    </app-modal>
  `,
  styles: [
    `
      .field {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class RelationshipManagerRescheduleDialogComponent {
  protected readonly data = inject<RescheduleDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<RelationshipManagerRescheduleDialogComponent, RescheduleDialogResult>);

  protected readonly dueDate = signal(this.data.currentDueAt.slice(0, 10));
  protected readonly notes = signal('');

  protected submit(): void {
    const date = this.dueDate();
    if (!date) {
      return;
    }

    this.dialogRef.close({ dueAt: new Date(date + 'T10:00:00').toISOString(), notes: this.notes() });
  }
}
