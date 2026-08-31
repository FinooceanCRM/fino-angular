import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Customer, CustomerDraft, CustomerSegment } from '@core/models/customer.model';
import { ModalComponent } from '@shared/components/modal.component';

export interface CustomerFormDialogData {
  customer?: Customer;
}

/**
 * Add or edit a customer. Editing pre-fills every field from the existing
 * record. The mockup also shows PAN number and Status fields, but neither
 * exists on `CustomerDraft` (the real update payload) — `status` is
 * read-only on `Customer` and PAN isn't captured at all here, so both are
 * left out rather than added as fields that would silently do nothing on
 * submit.
 */
@Component({
  selector: 'app-customer-form-dialog',
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
  template: `
    <app-modal [title]="data.customer ? 'Edit customer' : 'Add customer'" [showActions]="true">
      <div class="form-grid">
        <mat-form-field appearance="outline" class="field">
          <mat-label>Full name</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <input matInput [ngModel]="name()" (ngModelChange)="name.set($event)" placeholder="Enter customer name" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="field">
          <mat-label>Email</mat-label>
          <mat-icon matPrefix>mail</mat-icon>
          <input matInput type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" placeholder="customer@email.com" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="field">
          <mat-label>Phone</mat-label>
          <mat-icon matPrefix>call</mat-icon>
          <input matInput [ngModel]="phone()" (ngModelChange)="phone.set($event)" placeholder="+91 98xxxxxxxx" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="field">
          <mat-label>Segment</mat-label>
          <mat-select [ngModel]="segment()" (ngModelChange)="segment.set($event)">
            <mat-option value="Retail">Retail</mat-option>
            <mat-option value="SME">SME</mat-option>
            <mat-option value="Corporate">Corporate</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Notes (optional)</mat-label>
        <textarea matInput rows="2" [ngModel]="notes()" (ngModelChange)="notes.set($event)"></textarea>
      </mat-form-field>

      <button modal-actions mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button
        modal-actions
        mat-flat-button
        color="primary"
        type="button"
        class="tide-cta-pill"
        [disabled]="!canSubmit()"
        (click)="submit()"
      >
        <mat-icon>check</mat-icon>
        {{ data.customer ? 'Save changes' : 'Save customer' }}
      </button>
    </app-modal>
  `,
  styles: [
    `
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 1rem;
      }
      .field {
        display: block;
        width: 100%;
      }
      @media (max-width: 520px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormDialogComponent {
  protected readonly data = inject<CustomerFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<CustomerFormDialogComponent, CustomerDraft>);

  protected readonly name = signal(this.data.customer?.name ?? '');
  protected readonly email = signal(this.data.customer?.email ?? '');
  protected readonly phone = signal(this.data.customer?.phone ?? '');
  protected readonly segment = signal<CustomerSegment>(this.data.customer?.segment ?? 'Retail');
  protected readonly notes = signal(this.data.customer?.notes ?? '');

  protected readonly canSubmit = computed(
    () => this.name().trim().length > 0 && this.email().trim().length > 0 && this.phone().trim().length > 0,
  );

  protected submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.dialogRef.close({
      name: this.name().trim(),
      email: this.email().trim(),
      phone: this.phone().trim(),
      segment: this.segment(),
      notes: this.notes().trim() || null,
    });
  }
}
