import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DeskBank,
  DeskDocument,
  DeskKyc,
  DeskMessage,
  VerificationSummary,
} from '@core/models/telecaller-verification.model';

import { ApiService } from './api.service';

const BASE = 'telecallers/verification';

/** Transport for the telecaller verification desk (see TelecallerVerificationController). */
@Injectable({ providedIn: 'root' })
export class TelecallerVerificationService {
  private readonly api = inject(ApiService);

  summary(): Observable<VerificationSummary> {
    return this.api.get<VerificationSummary>(`${BASE}/summary`);
  }

  documents(): Observable<DeskDocument[]> {
    return this.api.get<DeskDocument[]>(`${BASE}/documents`);
  }

  kyc(): Observable<DeskKyc[]> {
    return this.api.get<DeskKyc[]>(`${BASE}/kyc`);
  }

  banks(): Observable<DeskBank[]> {
    return this.api.get<DeskBank[]>(`${BASE}/bank-accounts`);
  }

  messages(): Observable<DeskMessage[]> {
    return this.api.get<DeskMessage[]>(`${BASE}/messages`);
  }

  verifyDocument(id: number): Observable<unknown> {
    return this.api.post(`${BASE}/documents/${id}/verify`);
  }

  rejectDocument(id: number, reason: string): Observable<unknown> {
    return this.api.post(`${BASE}/documents/${id}/reject`, { reason });
  }

  verifyKyc(id: number): Observable<unknown> {
    return this.api.post(`${BASE}/kyc/${id}/verify`);
  }

  rejectKyc(id: number, reason: string): Observable<unknown> {
    return this.api.post(`${BASE}/kyc/${id}/reject`, { reason });
  }

  verifyBank(id: number): Observable<unknown> {
    return this.api.post(`${BASE}/bank-accounts/${id}/verify`);
  }

  handleMessage(id: number): Observable<unknown> {
    return this.api.post(`${BASE}/messages/${id}/handled`);
  }

  /** Opens a file in a new tab; it is fetched with the auth header, so it cannot be a plain link. */
  open(kind: 'documents' | 'kyc', id: number): void {
    this.api.download(`${BASE}/${kind}/${id}/download`).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }
}
