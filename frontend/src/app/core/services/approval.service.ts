import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  Approval,
  ApprovalComment,
  ApprovalDraft,
  ApprovalFilters,
  Paginated,
  PaginationMeta,
} from '@core/models/approval.model';

import { ApiService } from './api.service';

/**
 * Transport for the Approval Center endpoints (Phase 5, Part A) — Banker /
 * Lead / Document approval types. The Access type is served by
 * `AccessRequestService`.
 */
@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private readonly api = inject(ApiService);
  private readonly base = 'approvals';

  list(filters: ApprovalFilters = {}): Observable<Paginated<Approval>> {
    return this.api
      .getEnvelope<Approval[]>(this.base, filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  /** Pending count for one type — reads `meta.total` off a narrow list call. */
  pendingCount(type: Approval['type']): Observable<number> {
    return this.list({ type, status: 'pending', per_page: 1 }).pipe(map(({ meta }) => meta.total ?? 0));
  }

  getById(id: number): Observable<Approval> {
    return this.api.get<Approval>(`${this.base}/${id}`);
  }

  create(draft: ApprovalDraft): Observable<Approval> {
    return this.api.post<Approval>(this.base, draft);
  }

  approve(id: number, remarks?: string): Observable<Approval> {
    return this.api.post<Approval>(`${this.base}/${id}/approve`, { remarks: remarks ?? null });
  }

  reject(id: number, remarks: string): Observable<Approval> {
    return this.api.post<Approval>(`${this.base}/${id}/reject`, { remarks });
  }

  comments(id: number): Observable<ApprovalComment[]> {
    return this.api.get<ApprovalComment[]>(`${this.base}/${id}/comments`);
  }

  addComment(id: number, body: string): Observable<ApprovalComment> {
    return this.api.post<ApprovalComment>(`${this.base}/${id}/comments`, { body });
  }
}
