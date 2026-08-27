import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Paginated, PaginationMeta } from '@core/models/lead.model';

import { ApiService } from './api.service';

export type ApiLedgerEntryType =
  | 'disbursement'
  | 'connector_commission_accrued'
  | 'connector_commission_paid'
  | 'affiliate_commission_accrued'
  | 'affiliate_commission_paid';

export interface ApiLedgerEntry {
  id: number;
  date: string;
  type: ApiLedgerEntryType;
  type_label: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

export interface LedgerFilters {
  search?: string;
  type?: string;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

/** Transport for the Super Admin accounting ledger (Phase 2) — read-only. */
@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly api = inject(ApiService);
  private readonly base = 'super-admin/ledger';

  list(filters: LedgerFilters = {}): Observable<Paginated<ApiLedgerEntry>> {
    return this.api.getEnvelope<ApiLedgerEntry[]>(this.base, filters as Record<string, string | number>).pipe(
      map((response) => ({
        items: response.data ?? [],
        meta: (response.meta ?? {}) as unknown as PaginationMeta,
      })),
    );
  }
}
