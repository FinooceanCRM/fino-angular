import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ModalComponent } from '@shared/components/modal.component';

import { AssignableStaff } from '../../data/models/lead-catalogue.model';

export interface ManagerReassignDialogData {
  count: number;
  staff: AssignableStaff[];
}

export interface ManagerReassignDialogResult {
  assignee: AssignableStaff;
  remarks: string;
}

/** Reassignment dialog used by the bulk-action bar on every lead-status list. */
@Component({
  selector: 'app-manager-reassign-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [title]="data.count === 1 ? 'Reassign lead' : 'Reassign ' + data.count + ' leads'"
      [showActions]="true"
    >
      <mat-form-field appearance="outline" class="field">
        <mat-label>Assign to</mat-label>
        <mat-select [ngModel]="assigneeId()" (ngModelChange)="assigneeId.set($event)">
          @for (person of data.staff; track person.id) {
            <mat-option [value]="person.id">{{ person.name }} — {{ person.role_label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Remarks (optional)</mat-label>
        <textarea matInput rows="2" [ngModel]="remarks()" (ngModelChange)="remarks.set($event)"></textarea>
      </mat-form-field>

      <button modal-actions mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button
        modal-actions
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="!assigneeId()"
        (click)="submit()"
      >
        Reassign
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
export class ManagerReassignDialogComponent {
  protected readonly data = inject<ManagerReassignDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ManagerReassignDialogComponent, ManagerReassignDialogResult>);

  protected readonly assigneeId = signal<number | null>(null);
  protected readonly remarks = signal('');

  protected submit(): void {
    const assignee = this.data.staff.find((person) => person.id === this.assigneeId());
    if (!assignee) {
      return;
    }

    this.dialogRef.close({ assignee, remarks: this.remarks() });
  }
}
