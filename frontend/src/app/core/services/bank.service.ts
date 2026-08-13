import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { BankCriteria, BankCriteriaPayload } from '@core/models/bank.model';
import { Paginated, PaginationMeta } from '@core/models/lead.model';

import { ApiService } from './api.service';

/** Transport for bank criteria management (Phase 9). */
@Injectable({ providedIn: 'root' })
export class BankService {
  private readonly api = inject(ApiService);
  private readonly base = 'banks';

  list(
    filters: Record<string, string | number> = {},
  ): Observable<Paginated<BankCriteria>> {
    return this.api.getEnvelope<BankCriteria[]>(this.base, filters).pipe(
      map((response) => ({
        items: response.data ?? [],
        meta: (response.meta ?? {}) as unknown as PaginationMeta,
      })),
    );
  }

  create(payload: BankCriteriaPayload): Observable<BankCriteria> {
    return this.api.post<BankCriteria>(this.base, payload);
  }

  update(
    id: number,
    payload: Partial<BankCriteriaPayload>,
  ): Observable<BankCriteria> {
    return this.api.put<BankCriteria>(`${this.base}/${id}`, payload);
  }

  remove(id: number): Observable<null> {
    return this.api.delete<null>(`${this.base}/${id}`);
  }
}
