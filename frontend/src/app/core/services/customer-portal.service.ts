import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  ApplyPayload,
  CustomerApplication,
  CustomerDashboard,
  CustomerDocument,
  CustomerNotification,
  OtpSent,
} from '@core/models/customer-portal.model';
import { AuthenticatedUser } from '@core/models/user.model';

import { ApiService } from './api.service';
import { DownloadService } from './download.service';

export interface Page<T> {
  items: T[];
  total: number;
  lastPage: number;
  unread?: number;
}

/** Customer-portal API (`/customer/*`). Every call is scoped server-side to the signed-in customer. */
@Injectable({ providedIn: 'root' })
export class CustomerPortalService {
  private readonly api = inject(ApiService);
  private readonly downloads = inject(DownloadService);

  dashboard(): Observable<CustomerDashboard> {
    return this.api.get<CustomerDashboard>('customer/dashboard');
  }

  applications(page = 1, perPage = 10): Observable<Page<CustomerApplication>> {
    return this.api
      .getEnvelope<CustomerApplication[]>('customer/applications', { page, per_page: perPage })
      .pipe(map((r) => ({ items: r.data, total: Number(r.meta?.['total'] ?? 0), lastPage: Number(r.meta?.['last_page'] ?? 1) })));
  }

  application(id: number): Observable<CustomerApplication> {
    return this.api.get<CustomerApplication>(`customer/applications/${id}`);
  }

  apply(payload: ApplyPayload): Observable<CustomerApplication> {
    return this.api.post<CustomerApplication>('customer/applications', payload);
  }

  sendOtp(phone: string): Observable<OtpSent> {
    return this.api.post<OtpSent>('customer/otp/send', { phone });
  }

  /** Returns the token to pass as `otp_token` when applying. */
  verifyOtp(phone: string, code: string): Observable<{ otp_token: string }> {
    return this.api.post<{ otp_token: string }>('customer/otp/verify', { phone, code });
  }

  documents(): Observable<CustomerDocument[]> {
    return this.api.get<CustomerDocument[]>('customer/documents');
  }

  uploadDocument(leadId: number, documentType: string, file: File): Observable<{ id: number; status: string }> {
    const form = new FormData();
    form.append('document_type', documentType);
    form.append('file', file);

    return this.api.upload(`customer/applications/${leadId}/documents`, form);
  }

  /** Opens a document in a new tab (PDF / image) — fetched with the auth header, so it can't be a plain link. */
  viewDocument(doc: { id: number }): void {
    this.api.download(`customer/documents/${doc.id}/download`).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }

  downloadDocument(doc: { id: number; file_name: string | null }): void {
    this.api
      .download(`customer/documents/${doc.id}/download`)
      .subscribe((blob) => void this.downloads.save(blob, doc.file_name ?? 'document'));
  }

  notifications(unreadOnly = false): Observable<Page<CustomerNotification>> {
    return this.api
      .getEnvelope<CustomerNotification[]>('customer/notifications', unreadOnly ? { unread: 1 } : undefined)
      .pipe(
        map((r) => ({
          items: r.data,
          total: Number(r.meta?.['total'] ?? 0),
          lastPage: Number(r.meta?.['last_page'] ?? 1),
          unread: Number(r.meta?.['unread'] ?? 0),
        })),
      );
  }

  markRead(id: number): Observable<unknown> {
    return this.api.post(`customer/notifications/${id}/read`);
  }

  markAllRead(): Observable<unknown> {
    return this.api.post('customer/notifications/read-all');
  }

  updateProfile(payload: { name: string; phone: string }): Observable<AuthenticatedUser> {
    return this.api.put<AuthenticatedUser>('customer/profile', payload);
  }
}
