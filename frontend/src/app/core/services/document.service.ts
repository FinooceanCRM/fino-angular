import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  DocumentTypeOption,
  LeadDocument,
} from '@core/models/document.model';

import { ApiService } from './api.service';

/** Transport for lead documents (Phase 9). */
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly api = inject(ApiService);

  listForLead(
    leadId: number,
  ): Observable<{ items: LeadDocument[]; types: DocumentTypeOption[] }> {
    return this.api.getEnvelope<LeadDocument[]>(`leads/${leadId}/documents`).pipe(
      map((response) => ({
        items: response.data ?? [],
        types: ((response.meta?.['document_types'] as DocumentTypeOption[]) ??
          []) as DocumentTypeOption[],
      })),
    );
  }

  upload(
    leadId: number,
    file: File,
    documentType: string,
    remarks?: string,
  ): Observable<LeadDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('document_type', documentType);
    if (remarks?.trim()) {
      form.append('remarks', remarks.trim());
    }

    return this.api.upload<LeadDocument>(`leads/${leadId}/documents`, form);
  }

  download(document: LeadDocument): Observable<Blob> {
    return this.api.download(`documents/${document.id}/download`);
  }

  remove(id: number): Observable<null> {
    return this.api.delete<null>(`documents/${id}`);
  }
}
