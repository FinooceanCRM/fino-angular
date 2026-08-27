import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '@env/environment';

export interface PublicLeadPayload {
  applicant_name: string;
  applicant_email?: string;
  applicant_phone: string;
  loan_type: string;
  loan_amount: number;
  city: string;
  referral_code?: string;
  captcha_token: string;
  /** Honeypot — must stay empty; a bot filling it is dropped server-side. */
  website: string;
}

interface PublicLeadApiResponse {
  success: boolean;
  message: string | null;
}

/**
 * Bare HttpClient wrapper for the public referral lead form
 * (POST /public/leads). Deliberately independent of ApiService: this call
 * is unauthenticated by design, always returns null `data` (only the
 * message matters), and has no business being coupled to the plumbing the
 * rest of the authenticated SPA's services share.
 */
@Injectable({ providedIn: 'root' })
export class PublicLeadService {
  private readonly http = inject(HttpClient);

  submit(payload: PublicLeadPayload): Observable<string | null> {
    return this.http
      .post<PublicLeadApiResponse>(`${environment.apiBaseUrl}/public/leads`, payload)
      .pipe(map((response) => response.message));
  }
}
