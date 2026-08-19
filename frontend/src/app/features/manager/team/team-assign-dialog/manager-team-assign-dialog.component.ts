import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ModalComponent } from '@shared/components/modal.component';

import { ManagedUser } from '@features/super-admin/data/models/user.model';

export interface ManagerTeamAssignDialogData {
  employeeName: string;
  relationshipManagers: ManagedUser[];
  currentRmId: number | null;
}

export interface ManagerTeamAssignDialogResult {
  relationshipManagerId: number;
  remarks: string;
}

/** Team Assignment workflow — moves one employee to a different Relationship Manager. */
@Component({
  selector: 'app-manager-team-assign-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="'Reassign ' + data.employeeName" [showActions]="true">
      <mat-form-field appearance="outline" class="field">
        <mat-label>Relationship Manager</mat-label>
        <mat-select [ngModel]="rmId()" (ngModelChange)="rmId.set($event)">
          @for (rm of data.relationshipManagers; track rm.id) {
            <mat-option [value]="rm.id" [disabled]="rm.id === data.currentRmId">
              {{ rm.name }} @if (rm.id === data.currentRmId) {
                (current)
              }
            </mat-option>
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
        [disabled]="!rmId()"
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
export class ManagerTeamAssignDialogComponent {
  protected readonly data = inject<ManagerTeamAssignDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ManagerTeamAssignDialogComponent, ManagerTeamAssignDialogResult>);

  protected readonly rmId = signal<number | null>(null);
  protected readonly remarks = signal('');

  protected submit(): void {
    const id = this.rmId();
    if (!id) {
      return;
    }

    this.dialogRef.close({ relationshipManagerId: id, remarks: this.remarks() });
  }
}
