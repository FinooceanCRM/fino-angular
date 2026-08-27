import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AffiliateProfile } from '@core/models/affiliate.model';
import { ModalComponent } from '@shared/components/modal.component';

export interface AffiliateEditDialogData {
  affiliate: AffiliateProfile;
}

export interface AffiliateEditDialogResult {
  commission_rate: number | null;
  status: string;
}

/**
 * Commission-rate override + status editor for one affiliate — the
 * frontend for PUT super-admin/affiliates/{id} (Phase 6).
 */
@Component({
  selector: 'app-affiliate-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal title="Edit affiliate" [showActions]="true">
      <form [formGroup]="form" class="edit-form">
        <mat-form-field appearance="outline">
          <mat-label>Commission rate override (%)</mat-label>
          <input
            matInput
            type="number"
            step="0.01"
            min="0"
            formControlName="commission_rate"
            placeholder="Leave blank to use the global default"
          />
          <mat-hint>Leave blank to fall back to the platform-wide default rate.</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="pending_verification">Pending verification</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="inactive">Inactive</mat-option>
            <mat-option value="suspended">Suspended</mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      <button modal-actions mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button modal-actions mat-flat-button color="primary" type="button" (click)="save()">
        Save
      </button>
    </app-modal>
  `,
  styles: [
    `
      .edit-form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        min-width: 320px;
      }
    `,
  ],
})
export class AffiliateEditDialogComponent {
  protected readonly data = inject<AffiliateEditDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(
    MatDialogRef<AffiliateEditDialogComponent, AffiliateEditDialogResult>,
  );
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    commission_rate: this.fb.control<number | null>(this.data.affiliate.commission_rate),
    status: this.fb.nonNullable.control(this.data.affiliate.status, Validators.required),
  });

  protected save(): void {
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();

    this.dialogRef.close({
      commission_rate: raw.commission_rate === null || raw.commission_rate === undefined
        ? null
        : Number(raw.commission_rate),
      status: raw.status,
    });
  }
}
