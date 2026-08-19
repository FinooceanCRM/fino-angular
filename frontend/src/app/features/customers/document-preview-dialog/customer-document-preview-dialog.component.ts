import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { ModalComponent } from '@shared/components/modal.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import { CustomerDocument, DocumentType, documentTypeLabel } from '../data/customer-document.provider';

export interface CustomerDocumentPreviewDialogData {
  document: CustomerDocument;
}

const TYPE_ICON: Record<DocumentType, string> = {
  aadhaar: 'fingerprint',
  pan: 'badge',
  bank_statement: 'account_balance',
  income_proof: 'payments',
  other: 'description',
};

const STATUS_LABEL: Record<CustomerDocument['status'], string> = { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' };
const STATUS_COLOUR: Record<CustomerDocument['status'], string> = { pending: 'accent', verified: 'success', rejected: 'warn' };

/**
 * Document preview — there's no real file storage in this build, so this is
 * an honest metadata preview (type, size, upload date) with a placeholder
 * visual, not a fabricated document viewer. Mirrors the same pattern already
 * used by Super Admin's Lead Details document preview.
 */
@Component({
  selector: 'app-customer-document-preview-dialog',
  standalone: true,
  imports: [DatePipe, DecimalPipe, MatIconModule, ModalComponent, StatusPillComponent],
  template: `
    <app-modal [title]="data.document.file_name" [showActions]="false">
      <div class="preview">
        <mat-icon class="preview__icon">{{ icon }}</mat-icon>
        <p class="preview__hint">No live preview in this demo — mock document, no file storage.</p>
      </div>

      <dl class="meta">
        <dt>Type</dt>
        <dd>{{ typeLabel }}</dd>
        <dt>Status</dt>
        <dd><app-status-pill [label]="statusLabel" [colour]="statusColour" /></dd>
        <dt>Size</dt>
        <dd>{{ data.document.size_bytes / 1024 | number: '1.0-0' }} KB</dd>
        <dt>Uploaded</dt>
        <dd>{{ data.document.uploaded_at | date: 'medium' }}</dd>
      </dl>
    </app-modal>
  `,
  styles: [
    `
      .preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem 1rem;
        border-radius: var(--app-radius-md);
        background: var(--mat-sys-surface-container-high);
        margin-bottom: 1.25rem;
      }
      .preview__icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        color: var(--mat-sys-primary);
      }
      .preview__hint {
        margin: 0;
        font-size: 0.8rem;
        color: var(--app-status-default-fg);
        text-align: center;
      }
      .meta {
        margin: 0;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.35rem 1rem;
      }
      .meta dt {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--app-status-default-fg);
        align-self: center;
      }
      .meta dd {
        margin: 0;
        font-size: 0.88rem;
        font-weight: 500;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDocumentPreviewDialogComponent {
  protected readonly data = inject<CustomerDocumentPreviewDialogData>(MAT_DIALOG_DATA);

  protected readonly icon = TYPE_ICON[this.data.document.document_type];
  protected readonly typeLabel = documentTypeLabel(this.data.document.document_type);
  protected readonly statusLabel = STATUS_LABEL[this.data.document.status];
  protected readonly statusColour = STATUS_COLOUR[this.data.document.status];
}
