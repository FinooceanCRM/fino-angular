import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CustomerDocument, DocumentTypeOption } from '@core/models/customer.model';

import { ApiService } from './api.service';

/** Transport for customer-attached documents (Phase 3). */
@Injectable({ providedIn: 'root' })
export class CustomerDocumentService {
  private readonly api = inject(ApiService);

  forCustomer(
    customerId: number,
  ): Observable<{ items: CustomerDocument[]; types: DocumentTypeOption[] }> {
    return this.api.getEnvelope<CustomerDocument[]>(`customers/${customerId}/documents`).pipe(
      map((response) => ({
        items: response.data ?? [],
        types: ((response.meta?.['document_types'] as DocumentTypeOption[]) ??
          []) as DocumentTypeOption[],
      })),
    );
  }

  upload(
    customerId: number,
    file: File,
    documentType: string,
    remarks?: string,
  ): Observable<CustomerDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('document_type', documentType);
    if (remarks?.trim()) {
      form.append('remarks', remarks.trim());
    }

    return this.api.upload<CustomerDocument>(`customers/${customerId}/documents`, form);
  }

  download(document: CustomerDocument): Observable<Blob> {
    return this.api.download(`customers/documents/${document.id}/download`);
  }

  verify(document: CustomerDocument): Observable<CustomerDocument> {
    return this.api.post<CustomerDocument>(`customers/documents/${document.id}/verify`);
  }

  reject(document: CustomerDocument, reason?: string): Observable<CustomerDocument> {
    return this.api.post<CustomerDocument>(`customers/documents/${document.id}/reject`, {
      reason: reason ?? null,
    });
  }
}
