import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AccessRequest, AccessRequestStatusFilter, Paginated, PaginationMeta } from '@core/models/access-request.model';

import { ApiService } from './api.service';

/** Transport for the banker access-request submit/approve/reject workflow. */
@Injectable({ providedIn: 'root' })
export class AccessRequestService {
  private readonly api = inject(ApiService);

  /** All access requests raised against a given lead, any status. */
  forLead(leadId: number): Observable<AccessRequest[]> {
    return this.api.get<AccessRequest[]>(`leads/${leadId}/access-requests`);
  }

  /** A banker requests access to a lead matched against their own criteria. */
  request(leadId: number, remarks?: string): Observable<AccessRequest> {
    return this.api.post<AccessRequest>(`leads/${leadId}/access-requests`, {
      remarks: remarks ?? null,
    });
  }

  /**
   * Requests in one status the current actor may see — the same list either
   * way, just narrowed by `status` (defaults to "pending", this method's
   * original — and until now, only — behaviour): the actor's own requests
   * if they're a Banker, or requests against leads they can see otherwise.
   */
  pending(
    status: AccessRequestStatusFilter = 'pending',
    page = 1,
    perPage = 15,
  ): Observable<Paginated<AccessRequest>> {
    return this.api
      .getEnvelope<AccessRequest[]>('access-requests', { status, page, per_page: perPage })
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  approve(id: number, remarks?: string): Observable<AccessRequest> {
    return this.api.post<AccessRequest>(`access-requests/${id}/approve`, {
      remarks: remarks ?? null,
    });
  }

  reject(id: number, remarks: string): Observable<AccessRequest> {
    return this.api.post<AccessRequest>(`access-requests/${id}/reject`, { remarks });
  }
}
