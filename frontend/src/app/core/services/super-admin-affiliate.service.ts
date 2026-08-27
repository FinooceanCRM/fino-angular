import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AffiliatePayout, AffiliateProfile } from '@core/models/affiliate.model';
import { Paginated, PaginationMeta } from '@core/models/lead.model';

import { ApiService } from './api.service';

export interface SuperAdminAffiliateFilters {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface UpdateAffiliateAdminPayload {
  commission_rate?: number | null;
  status?: string;
}

/** Transport for the Super Admin affiliate management + payout decision endpoints (Phase 6). */
@Injectable({ providedIn: 'root' })
export class SuperAdminAffiliateService {
  private readonly api = inject(ApiService);
  private readonly base = 'super-admin/affiliates';

  list(filters: SuperAdminAffiliateFilters = {}): Observable<Paginated<AffiliateProfile>> {
    return this.api
      .getEnvelope<AffiliateProfile[]>(this.base, filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  update(affiliateUserId: number, payload: UpdateAffiliateAdminPayload): Observable<AffiliateProfile> {
    return this.api.put<AffiliateProfile>(`${this.base}/${affiliateUserId}`, payload);
  }

  payouts(filters: SuperAdminAffiliateFilters = {}): Observable<Paginated<AffiliatePayout>> {
    return this.api
      .getEnvelope<AffiliatePayout[]>(`${this.base}/payouts`, filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  approvePayout(payoutId: number): Observable<AffiliatePayout> {
    return this.api.post<AffiliatePayout>(`${this.base}/payouts/${payoutId}/approve`);
  }

  markPayoutPaid(payoutId: number): Observable<AffiliatePayout> {
    return this.api.post<AffiliatePayout>(`${this.base}/payouts/${payoutId}/mark-paid`);
  }

  rejectPayout(payoutId: number, reason: string): Observable<AffiliatePayout> {
    return this.api.post<AffiliatePayout>(`${this.base}/payouts/${payoutId}/reject`, { reason });
  }
}
