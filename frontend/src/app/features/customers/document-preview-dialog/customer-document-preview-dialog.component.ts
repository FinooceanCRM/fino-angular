import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { CustomerDocument, DocumentType } from '@core/models/customer.model';
import { CustomerDocumentService } from '@core/services/customer-document.service';
import { DownloadService } from '@core/services/download.service';
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
 * Document preview — real file storage since Phase 3, so this offers an
 * actual Download alongside the metadata summary. There's no in-browser
 * rendering (mirroring the same pattern already used by Super Admin's Lead
 * Details document preview) — note the mockup's "no file storage" caption
 * describes an earlier mock-only version of this screen and doesn't apply
 * here, so it isn't reproduced; the real Download action is kept instead.
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
        <div class="meta__cell">
          <dt>Type</dt>
          <dd>{{ typeLabel }}</dd>
        </div>
        <div class="meta__cell">
          <dt>Status</dt>
          <dd><app-status-pill [label]="statusLabel" [colour]="statusColour" /></dd>
        </div>
        <div class="meta__cell">
          <dt>Size</dt>
          <dd>{{ data.document.size_bytes / 1024 | number: '1.0-0' }} KB</dd>
        </div>
        <div class="meta__cell">
          <dt>Uploaded</dt>
          <dd>{{ data.document.created_at | date: 'medium' }}</dd>
        </div>
      </dl>

      <button modal-actions mat-flat-button color="primary" type="button" class="tide-cta-pill" (click)="download()">
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
        justify-content: center;
        gap: 0.5rem;
        padding: 2.5rem 1rem;
        margin-bottom: 1.25rem;
      }
      .preview__icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: var(--tide-color-text-primary);
      }
      .meta {
        margin: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem 1.5rem;
      }
      .meta__cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .meta dt {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--app-status-default-fg);
      }
      .meta dd {
        margin: 0;
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--tide-color-text-primary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDocumentPreviewDialogComponent {
  protected readonly data = inject<CustomerDocumentPreviewDialogData>(MAT_DIALOG_DATA);
  private readonly documents = inject(CustomerDocumentService);
  private readonly downloads = inject(DownloadService);

  protected readonly icon = TYPE_ICON[this.data.document.document_type] ?? 'description';
  protected readonly typeLabel = this.data.document.document_type_label;
  protected readonly statusLabel = STATUS_LABEL[this.data.document.status];
  protected readonly statusColour = STATUS_COLOUR[this.data.document.status];

  protected download(): void {
    this.documents
      .download(this.data.document)
      .subscribe((blob) => void this.downloads.save(blob, this.data.document.original_name));
  }
}
