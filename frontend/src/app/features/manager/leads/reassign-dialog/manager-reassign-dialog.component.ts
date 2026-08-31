import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [title]="data.count === 1 ? 'Reassign lead' : 'Reassign ' + data.count + ' leads'"
      [showActions]="true"
    >
      <p class="reassign__context">
        {{
          data.count === 1
            ? 'Reassign this lead to a different employee.'
            : 'Reassign these ' + data.count + ' leads to a different employee.'
        }}
      </p>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Assign to employee</mat-label>
        <mat-select [ngModel]="assigneeId()" (ngModelChange)="assigneeId.set($event)">
          @for (person of data.staff; track person.id) {
            <mat-option [value]="person.id">{{ person.name }} — {{ person.role_label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Reason for reassignment</mat-label>
        <textarea
          matInput
          rows="3"
          placeholder="Explain why this lead is being reassigned…"
          [ngModel]="remarks()"
          (ngModelChange)="remarks.set($event)"
        ></textarea>
      </mat-form-field>

      <button modal-actions mat-stroked-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button
        modal-actions
        mat-flat-button
        color="primary"
        class="tide-cta-pill"
        type="button"
        [disabled]="!assigneeId()"
        (click)="submit()"
      >
        <mat-icon>check</mat-icon>
        Save assignment
      </button>
    </app-modal>
  `,
  styles: [
    `
      .field {
        display: block;
        width: 100%;
      }
      .reassign__context {
        margin: 0 0 var(--app-space-4);
        color: var(--mat-sys-on-surface-variant);
      }
      .tide-cta-pill {
        display: inline-flex;
        align-items: center;
        gap: var(--app-space-1);
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
