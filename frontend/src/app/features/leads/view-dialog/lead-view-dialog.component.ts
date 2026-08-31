import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { Lead } from '@core/models/lead.model';
import { ModalComponent } from '@shared/components/modal.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

export interface LeadViewDialogData {
  lead: Lead;
  loanTypeLabel: string;
  employmentTypeLabel: string;
}

/**
 * Tidewater "Lead summary" quick-view (Phase 5, mockup 06): a lightweight
 * read-only snapshot of a lead — reference/loan/amount, contact + income
 * grid, and who it's assigned to — opened from the leads list without a
 * full page navigation. "Open full record" does the real navigation to the
 * lead detail page and closes itself; the caller doesn't need to react to
 * the dialog's result.
 */
@Component({
  selector: 'app-lead-view-dialog',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatIconModule, ModalComponent, StatusPillComponent],
  template: `
    <app-modal title="Lead summary" [showActions]="true">
      <div class="lead-view__top">
        <h3 class="lead-view__name">{{ data.lead.applicant_name }}</h3>
        <app-status-pill [label]="data.lead.status_label" [colour]="data.lead.status_colour" />
      </div>
      <p class="lead-view__subline">
        {{ data.lead.reference }} · {{ data.loanTypeLabel }} ·
        {{ data.lead.loan_amount | currency: 'INR' : 'symbol-narrow' : '1.0-0' }}
      </p>

      <dl class="lead-view__grid">
        <div class="lead-view__cell">
          <dt>Phone</dt>
          <dd>{{ data.lead.applicant_phone ?? '—' }}</dd>
        </div>
        <div class="lead-view__cell">
          <dt>Email</dt>
          <dd>{{ data.lead.applicant_email ?? '—' }}</dd>
        </div>

        <div class="lead-view__cell">
          <dt>City</dt>
          <dd>{{ data.lead.city ?? '—' }}</dd>
        </div>
        <div class="lead-view__cell">
          <dt>Employment</dt>
          <dd>{{ data.employmentTypeLabel }}</dd>
        </div>

        <div class="lead-view__cell">
          <dt>Monthly income</dt>
          <dd>
            {{
              data.lead.monthly_income != null
                ? (data.lead.monthly_income | currency: 'INR' : 'symbol-narrow' : '1.0-0')
                : '—'
            }}
          </dd>
        </div>
        <div class="lead-view__cell">
          <dt>Credit score</dt>
          <dd>{{ data.lead.credit_score ?? '—' }}</dd>
        </div>
      </dl>

      <p class="lead-view__meta">
        Assigned to <strong>{{ assigneeName() }}</strong> · Created
        {{ data.lead.created_at | date: 'mediumDate' }}
      </p>

      <button modal-actions mat-stroked-button type="button" (click)="dialogRef.close()">Close</button>
      <button
        modal-actions
        mat-flat-button
        color="primary"
        class="tide-cta-pill"
        type="button"
        (click)="openFullRecord()"
      >
        <mat-icon>chevron_right</mat-icon>
        Open full record
      </button>
    </app-modal>
  `,
  styles: [
    `
      .lead-view__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--app-space-3);
      }
      .lead-view__name {
        margin: 0;
      }
      .lead-view__subline {
        margin: var(--app-space-1) 0 var(--app-space-4);
        color: var(--mat-sys-on-surface-variant);
      }
      .lead-view__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--app-space-4);
        margin: 0 0 var(--app-space-4);
      }
      .lead-view__cell dt {
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.8rem;
      }
      .lead-view__cell dd {
        margin: var(--app-space-1) 0 0;
        font-weight: 600;
        min-width: 0;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .lead-view__meta {
        margin: 0;
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.85rem;
      }
      .tide-cta-pill {
        display: inline-flex;
        align-items: center;
        gap: var(--app-space-1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadViewDialogComponent {
  protected readonly data = inject<LeadViewDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<LeadViewDialogComponent, void>);
  private readonly router = inject(Router);

  /** Same "first assignee that's set" fallback the leads list's Assigned-to column uses, extended to cover every assignment role a lead can carry. */
  protected readonly assigneeName = computed(() => {
    const lead = this.data.lead;
    return (
      lead.assigned_employee?.name ??
      lead.assigned_banker?.name ??
      lead.assigned_relationship_manager?.name ??
      lead.assigned_manager?.name ??
      lead.assigned_telecaller?.name ??
      '—'
    );
  });

  protected openFullRecord(): void {
    this.dialogRef.close();
    this.router.navigate(['/leads', this.data.lead.id]);
  }
}
