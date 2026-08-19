import { Injectable, signal } from '@angular/core';

/** Mirrors `App\Enums\DocumentType` on the backend. */
export type DocumentType = 'aadhaar' | 'pan' | 'bank_statement' | 'income_proof' | 'other';
export type DocumentStatus = 'pending' | 'verified' | 'rejected';

export const DOCUMENT_TYPE_CATALOGUE: { value: DocumentType; label: string }[] = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'income_proof', label: 'Income Proof' },
  { value: 'other', label: 'Other Document' },
];

export interface CustomerDocument {
  id: number;
  customer_id: number;
  document_type: DocumentType;
  file_name: string;
  size_bytes: number;
  status: DocumentStatus;
  uploaded_at: string;
}

const NOW = new Date('2026-08-15T10:00:00+05:30');

function daysAgoIso(days: number): string {
  const at = new Date(NOW);
  at.setDate(at.getDate() - days);
  return at.toISOString();
}

const SEED_DOCUMENTS: CustomerDocument[] = [
  { id: 1, customer_id: 1, document_type: 'aadhaar', file_name: 'rohan_kulkarni_aadhaar.pdf', size_bytes: 812_000, status: 'verified', uploaded_at: daysAgoIso(6) },
  { id: 2, customer_id: 1, document_type: 'pan', file_name: 'rohan_kulkarni_pan.pdf', size_bytes: 240_000, status: 'pending', uploaded_at: daysAgoIso(1) },
  { id: 3, customer_id: 3, document_type: 'bank_statement', file_name: 'yusuf_sheikh_bank_q2.pdf', size_bytes: 1_450_000, status: 'pending', uploaded_at: daysAgoIso(2) },
  { id: 4, customer_id: 4, document_type: 'income_proof', file_name: 'vikram_oberoi_gst_returns.pdf', size_bytes: 980_000, status: 'pending', uploaded_at: daysAgoIso(4) },
  { id: 5, customer_id: 5, document_type: 'aadhaar', file_name: 'simone_dsouza_aadhaar.pdf', size_bytes: 790_000, status: 'verified', uploaded_at: daysAgoIso(25) },
  { id: 6, customer_id: 5, document_type: 'bank_statement', file_name: 'simone_dsouza_bank_q1.pdf', size_bytes: 1_320_000, status: 'verified', uploaded_at: daysAgoIso(22) },
  { id: 7, customer_id: 5, document_type: 'income_proof', file_name: 'simone_dsouza_salary_slip.pdf', size_bytes: 310_000, status: 'verified', uploaded_at: daysAgoIso(20) },
  { id: 8, customer_id: 6, document_type: 'pan', file_name: 'kritika_suri_pan.pdf', size_bytes: 255_000, status: 'rejected', uploaded_at: daysAgoIso(19) },
];

/**
 * Centralized mock state for customer-attached documents. Kept separate from
 * `CustomerDataProvider` (single-responsibility), but a successful upload is
 * also logged to that provider's interaction timeline so Activity History
 * stays the one place that shows "everything that happened" for a customer.
 * There's no real file storage in this build — "uploading" records the
 * browser `File`'s name and size only, never its bytes.
 */
@Injectable({ providedIn: 'root' })
export class CustomerDocumentDataProvider {
  private readonly _documents = signal<CustomerDocument[]>(SEED_DOCUMENTS);
  private nextId = SEED_DOCUMENTS.length + 1;

  forCustomer(customerId: number): CustomerDocument[] {
    return this._documents().filter((doc) => doc.customer_id === customerId);
  }

  upload(customerId: number, type: DocumentType, fileName: string, sizeBytes: number): CustomerDocument {
    const document: CustomerDocument = {
      id: this.nextId++,
      customer_id: customerId,
      document_type: type,
      file_name: fileName,
      size_bytes: sizeBytes,
      status: 'pending',
      uploaded_at: NOW.toISOString(),
    };

    this._documents.update((current) => [document, ...current]);
    return document;
  }
}

export function documentTypeLabel(value: DocumentType): string {
  return DOCUMENT_TYPE_CATALOGUE.find((option) => option.value === value)?.label ?? value;
}
