import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AUDIT_EVENT_CATEGORY_LABEL, AuditLogEntry } from '@core/models/audit-log.model';
import { ModalComponent } from '@shared/components/modal.component';

export interface AuditLogDetailDialogData {
  entry: AuditLogEntry;
}

/**
 * Quick-view dialog for one audit entry, opened from the Audit Logs table
 * row's "View" action — reuses the row's already-loaded `AuditLogEntry`
 * (no extra fetch). This is additive: the existing routed detail page at
 * `/super-admin/audit-logs/:id` (still real, still linkable) is untouched;
 * this just gives the list a faster, matches-the-mockup quick-look instead
 * of a full navigation for the common case.
 *
 * The mockup's "Change details" block shows a structured before/after JSON
 * diff — `AuditLogEntry` has no such field (only a free-text
 * `description`), so rather than fabricate one, the real `description` is
 * shown in that same visual slot, honestly labelled.
 */
@Component({
  selector: 'app-super-admin-audit-log-detail-dialog',
  standalone: true,
  imports: [DatePipe, MatButtonModule, ModalComponent],
  template: `
    <app-modal title="Audit log detail" [showActions]="true">
      <div class="detail-dialog__grid">
        <div class="detail-dialog__field">
          <span class="detail-dialog__label">Actor</span>
          <strong>{{ data.entry.actor_name }} ({{ data.entry.actor_role }})</strong>
        </div>
        <div class="detail-dialog__field">
          <span class="detail-dialog__label">Action</span>
          <strong>{{ data.entry.action }}</strong>
        </div>
        <div class="detail-dialog__field">
          <span class="detail-dialog__label">Target</span>
          <strong>{{ data.entry.entity_type }} — {{ data.entry.entity_label }}</strong>
        </div>
        <div class="detail-dialog__field">
          <span class="detail-dialog__label">IP Address</span>
          <strong>{{ data.entry.ip_address ?? '—' }}</strong>
        </div>
        <div class="detail-dialog__field">
          <span class="detail-dialog__label">Event type</span>
          <strong>{{ categoryLabel[data.entry.category] }}</strong>
        </div>
        <div class="detail-dialog__field">
          <span class="detail-dialog__label">Timestamp</span>
          <strong>{{ data.entry.timestamp | date: 'd MMM y, h:mm a' }}</strong>
        </div>
      </div>

      <div class="detail-dialog__description">
        <span class="detail-dialog__label">Description</span>
        <pre class="detail-dialog__description-box">{{ data.entry.description }}</pre>
      </div>

      <button modal-actions mat-stroked-button type="button" mat-dialog-close>Close</button>
    </app-modal>
  `,
  styles: [
    `
      .detail-dialog__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--app-space-4) var(--app-space-5);
        margin-bottom: var(--app-space-4);
      }
      .detail-dialog__field {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .detail-dialog__label {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--app-status-default-fg);
      }
      .detail-dialog__description {
        display: flex;
        flex-direction: column;
        gap: var(--app-space-1);
      }
      .detail-dialog__description-box {
        margin: 0;
        padding: var(--app-space-3);
        border-radius: var(--app-radius-md);
        background: var(--mat-sys-surface-container-high);
        border: 1px solid var(--mat-sys-outline-variant);
        font-family: ui-monospace, 'SF Mono', Consolas, monospace;
        font-size: 0.82rem;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
      }
      @media (max-width: 520px) {
        .detail-dialog__grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminAuditLogDetailDialogComponent {
  protected readonly data = inject<AuditLogDetailDialogData>(MAT_DIALOG_DATA);
  protected readonly categoryLabel = AUDIT_EVENT_CATEGORY_LABEL;
}
