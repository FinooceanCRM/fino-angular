import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DocumentsComponent } from '@features/documents/documents.component';

/**
 * Documents, Banker-scoped route. Reuses the shared, real `DocumentsComponent`
 * unmodified — same `DocumentService` (`GET/POST leads/{id}/documents`,
 * `GET documents/{id}/download`, `DELETE documents/{id}`), same lead picker,
 * upload dropzone and document-type catalogue (Aadhaar, PAN, Bank Statement,
 * Income Proof, Other) every role already uses. Existing purely so the
 * Banker workspace has its own guarded route into it.
 */
@Component({
  selector: 'app-banker-documents',
  standalone: true,
  imports: [DocumentsComponent],
  template: `<app-documents />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerDocumentsComponent {}
