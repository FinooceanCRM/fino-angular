import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  ContactPayload,
  EligibilityPayload,
  EligibilityResult,
  InquiryPayload,
  InquiryReceipt,
  LoanProduct,
} from '@core/models/website.model';

import { ApiResponse, ApiService } from './api.service';

/** Public website data (no authentication required). */
@Injectable({ providedIn: 'root' })
export class WebsiteService {
  private readonly api = inject(ApiService);

  private cache: LoanProduct[] | null = null;
  disclaimer = '';

  products(): Observable<LoanProduct[]> {
    if (this.cache) {
      return new Observable((sub) => {
        sub.next(this.cache as LoanProduct[]);
        sub.complete();
      });
    }

    return this.api.getEnvelope<LoanProduct[]>('public/loan-products').pipe(
      map((res: ApiResponse<LoanProduct[]>) => {
        this.cache = res.data;
        this.disclaimer = String(res.meta?.['disclaimer'] ?? '');
        return res.data;
      }),
    );
  }

  checkEligibility(payload: EligibilityPayload): Observable<EligibilityResult> {
    return this.api.post<EligibilityResult>('public/eligibility', payload);
  }

  submitInquiry(payload: InquiryPayload): Observable<InquiryReceipt> {
    return this.api.post<InquiryReceipt>('public/inquiries', payload);
  }

  sendContact(payload: ContactPayload): Observable<null> {
    return this.api.post<null>('public/contact', payload);
  }

  subscribe(email: string, website = ''): Observable<null> {
    return this.api.post<null>('public/newsletter', { email, website });
  }
}
