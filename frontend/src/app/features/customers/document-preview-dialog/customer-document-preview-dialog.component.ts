import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { CustomerDocument, DocumentType } from '@core/models/customer.model';
import { CustomerDocumentService } from '@core/services/customer-document.service';
import { ModalComponent } from '@shared/components/modal.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

export interface CustomerDocumentPreviewDialogData {
  document: CustomerDocument;
}

const TYPE_ICON: Partial<Record<DocumentType, string>> = {
  aadhaar: 'fingerprint',
  aadhaar_front: 'fingerprint',
  aadhaar_back: 'fingerprint',
  pan: 'badge',
  pan_card: 'badge',
  bank_statement: 'account_balance',
  income_proof: 'payments',
  other: 'description',
};

const STATUS_LABEL: Record<CustomerDocument['status'], string> = { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' };
const STATUS_COLOUR: Record<CustomerDocument['status'], string> = { pending: 'accent', verified: 'success', rejected: 'warn' };

/**
 * Document preview — real file storage since Phase 3 (unlike the earlier
 * mock), so this offers an actual Download alongside the metadata summary.
 * Still no in-browser rendering, mirroring the same pattern already used by
 * Super Admin's Lead Details document preview.
 */
@Component({
  selector: 'app-customer-document-preview-dialog',
  standalone: true,
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatIconModule, ModalComponent, StatusPillComponent],
  template: `
    <app-modal [title]="data.document.original_name" [showActions]="true">
      <div class="preview">
        <mat-icon class="preview__icon">{{ icon }}</mat-icon>
      </div>

      <dl class="meta">
        <dt>Type</dt>
        <dd>{{ typeLabel }}</dd>
        <dt>Status</dt>
        <dd><app-status-pill [label]="statusLabel" [colour]="statusColour" /></dd>
        <dt>Size</dt>
        <dd>{{ data.document.size_bytes / 1024 | number: '1.0-0' }} KB</dd>
        <dt>Uploaded</dt>
        <dd>{{ data.document.created_at | date: 'medium' }}</dd>
      </dl>

      <button modal-actions mat-flat-button color="primary" type="button" (click)="download()">
        <mat-icon>download</mat-icon>
        Download
      </button>
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
  private readonly documents = inject(CustomerDocumentService);

  protected readonly icon = TYPE_ICON[this.data.document.document_type] ?? 'description';
  protected readonly typeLabel = this.data.document.document_type_label;
  protected readonly statusLabel = STATUS_LABEL[this.data.document.status];
  protected readonly statusColour = STATUS_COLOUR[this.data.document.status];

  protected download(): void {
    this.documents.download(this.data.document).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = this.data.document.original_name;
      anchor.click();
      URL.revokeObjectURL(url);
    });
  }
}
