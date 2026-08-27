import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  AffiliateCommission,
  AffiliateDashboard,
  AffiliateListFilters,
  AffiliatePayout,
  AffiliateProfile,
  AffiliateReferral,
  UpdateAffiliateProfilePayload,
} from '@core/models/affiliate.model';
import { Paginated, PaginationMeta } from '@core/models/lead.model';

import { ApiService } from './api.service';

/** Transport for the Affiliate module endpoints. */
@Injectable({ providedIn: 'root' })
export class AffiliateService {
  private readonly api = inject(ApiService);

  dashboard(): Observable<AffiliateDashboard> {
    return this.api.get<AffiliateDashboard>('affiliates/dashboard');
  }

  profile(): Observable<AffiliateProfile> {
    return this.api.get<AffiliateProfile>('affiliates/profile');
  }

  updateProfile(
    payload: UpdateAffiliateProfilePayload,
  ): Observable<AffiliateProfile> {
    return this.api.put<AffiliateProfile>('affiliates/profile', payload);
  }

  referrals(filters: AffiliateListFilters = {}): Observable<Paginated<AffiliateReferral>> {
    return this.api
      .getEnvelope<AffiliateReferral[]>('affiliates/referrals', filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  commissions(filters: AffiliateListFilters = {}): Observable<Paginated<AffiliateCommission>> {
    return this.api
      .getEnvelope<AffiliateCommission[]>('affiliates/commissions', filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  payouts(filters: AffiliateListFilters = {}): Observable<Paginated<AffiliatePayout>> {
    return this.api
      .getEnvelope<AffiliatePayout[]>('affiliates/payouts', filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  requestPayout(): Observable<AffiliatePayout> {
    return this.api.post<AffiliatePayout>('affiliates/payouts');
  }
}
