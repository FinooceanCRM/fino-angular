import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { ModalComponent } from '@shared/components/modal.component';

import { LeadDocument } from '../../../data/models/document.model';

export interface DocumentPreviewModalData {
  document: LeadDocument;
}

const TYPE_ICON: Record<string, string> = {
  'PAN Card': 'badge',
  'Aadhaar Card': 'fingerprint',
  'Income Proof': 'payments',
  'Bank Statement (6 months)': 'account_balance',
  'Property Papers': 'home_work',
  'Address Proof': 'home',
  Photograph: 'portrait',
};

/**
 * Document preview — there's no real file storage in this build, so this is
 * an honest metadata preview (type, size, uploader) with a placeholder
 * visual, not a fabricated document viewer.
 */
@Component({
  selector: 'app-document-preview-modal',
  standalone: true,
  imports: [DatePipe, MatIconModule, ModalComponent],
  templateUrl: './document-preview-modal.component.html',
  styleUrl: './document-preview-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentPreviewModalComponent {
  protected readonly data = inject<DocumentPreviewModalData>(MAT_DIALOG_DATA);

  protected readonly icon = TYPE_ICON[this.data.document.document_type] ?? 'description';
}
