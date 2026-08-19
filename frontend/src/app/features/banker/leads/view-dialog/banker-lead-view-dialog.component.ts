import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NormalizedApiError } from '@core/interceptors/error.interceptor';
import { Lead } from '@core/models/lead.model';
import { AccessRequestService } from '@core/services/access-request.service';
import { ModalComponent } from '@shared/components/modal.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

export interface BankerLeadViewDialogData {
  lead: Lead;
  loanTypeLabel: string;
}

/**
 * The Banker workspace's "View" action (spec §4): a quick, masked summary —
 * Loan Type, Amount, City, Status, Notes — with a "Request Full Details"
 * button when the lead isn't yet fully unlocked (spec §5). No extra
 * network round trip: the row's already-fetched `Lead` carries everything
 * this dialog shows, since the list endpoint applies the same masking.
 * Closes with `true` once a request is sent, so the caller can refresh the
 * row's "Requested" state.
 */
@Component({
  selector: 'app-banker-lead-view-dialog',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, ModalComponent, StatusPillComponent],
  template: `
    <app-modal [title]="data.lead.applicant_name" [showActions]="true">
      <dl class="lead-view__grid">
        <dt>Loan type</dt>
        <dd>{{ data.loanTypeLabel }}</dd>

        <dt>Amount</dt>
        <dd>₹{{ data.lead.loan_amount | number: '1.0-0' }}</dd>

        <dt>City</dt>
        <dd>{{ data.lead.city ?? '—' }}</dd>

        <dt>Status</dt>
        <dd><app-status-pill [label]="data.lead.status_label" [colour]="data.lead.status_colour" /></dd>

        <dt>Notes</dt>
        <dd>{{ data.lead.notes ?? '—' }}</dd>
      </dl>

      @if (!data.lead.full_access) {
        <p class="lead-view__locked">
          Contact details, documents and status updates are hidden until a Manager approves full access to this
          lead.
        </p>
      }

      <button modal-actions mat-button type="button" (click)="dialogRef.close(requested())">Close</button>

      @if (!data.lead.full_access) {
        <button
          modal-actions
          mat-flat-button
          color="primary"
          type="button"
          [disabled]="requesting() || requested()"
          (click)="requestFullDetails()"
        >
          {{ requested() ? 'Requested' : 'Request Full Details' }}
        </button>
      }
    </app-modal>
  `,
  styles: [
    `
      .lead-view__grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--app-space-2) var(--app-space-4);
        margin: 0;
      }
      .lead-view__grid dt {
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.8rem;
      }
      /* A grid item's 1fr track won't shrink below its content's intrinsic
         width by default — min-width: 0 plus wrapping is what stops one
         long unbroken value (e.g. a run-on Notes string) from pushing the
         dialog into a horizontal scrollbar. */
      .lead-view__grid dd {
        margin: 0;
        min-width: 0;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .lead-view__locked {
        margin-top: var(--app-space-4);
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.85rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerLeadViewDialogComponent {
  protected readonly data = inject<BankerLeadViewDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<BankerLeadViewDialogComponent, boolean>);
  private readonly accessRequests = inject(AccessRequestService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly requesting = signal(false);
  protected readonly requested = signal(false);

  protected requestFullDetails(): void {
    this.requesting.set(true);

    this.accessRequests.request(this.data.lead.id).subscribe({
      next: () => {
        this.requesting.set(false);
        this.requested.set(true);
        this.snackBar.open('Full details requested.', 'Dismiss', { duration: 4000 });
      },
      error: (err: NormalizedApiError) => {
        this.requesting.set(false);
        this.snackBar.open(err.message ?? 'The request could not be submitted.', 'Dismiss', { duration: 6000 });
      },
    });
  }
}
