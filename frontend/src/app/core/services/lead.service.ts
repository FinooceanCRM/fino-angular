import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  AssignableUser,
  Lead,
  LeadDetail,
  LeadFilters,
  LeadMetadata,
  LeadPayload,
  MatchingResult,
  Paginated,
  PaginationMeta,
} from '@core/models/lead.model';
import { PdDetails, PdShowResponse } from '@core/models/pd.model';

import { ApiService } from './api.service';

/** Transport for the loan-management endpoints (Phase 9). */
@Injectable({ providedIn: 'root' })
export class LeadService {
  private readonly api = inject(ApiService);
  private readonly base = 'leads';

  list(filters: LeadFilters = {}): Observable<Paginated<Lead>> {
    return this.api
      .getEnvelope<Lead[]>(this.base, filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  detail(id: number): Observable<LeadDetail> {
    return this.api.get<LeadDetail>(`${this.base}/${id}`);
  }

  metadata(): Observable<LeadMetadata> {
    return this.api.get<LeadMetadata>(`${this.base}/metadata`);
  }

  assignableUsers(): Observable<AssignableUser[]> {
    return this.api.get<AssignableUser[]>(`${this.base}/assignable-users`);
  }

  create(payload: LeadPayload): Observable<Lead> {
    return this.api.post<Lead>(this.base, payload);
  }

  update(id: number, payload: Partial<LeadPayload>): Observable<Lead> {
    return this.api.put<Lead>(`${this.base}/${id}`, payload);
  }

  remove(id: number): Observable<null> {
    return this.api.delete<null>(`${this.base}/${id}`);
  }

  assign(id: number, assigneeId: number, remarks?: string): Observable<Lead> {
    return this.api.post<Lead>(`${this.base}/${id}/assign`, {
      assignee_id: assigneeId,
      remarks: remarks ?? null,
    });
  }

  changeStatus(id: number, status: string, remarks?: string): Observable<Lead> {
    return this.api.post<Lead>(`${this.base}/${id}/status`, {
      status,
      remarks: remarks ?? null,
    });
  }

  runMatching(id: number): Observable<MatchingResult> {
    return this.api.post<MatchingResult>(`${this.base}/${id}/match`);
  }

  /**
   * Telecaller PD (pre-disbursement verification call) workflow, Phase 6.
   * Superseded in the UI by {@see submitPd} (the Full PD data-entry form),
   * but left callable — nothing about this endpoint changed.
   */
  completePd(id: number, remarks?: string): Observable<Lead> {
    return this.api.post<Lead>(`${this.base}/${id}/pd-complete`, {
      remarks: remarks ?? null,
    });
  }

  /** Existing Full PD data for a lead, to pre-fill/resume the PD form. */
  getPd(id: number): Observable<PdShowResponse> {
    return this.api.get<PdShowResponse>(`${this.base}/${id}/pd`);
  }

  /** Full PD (pre-disbursement verification) data capture — Super Admin, Manager, Telecaller only. */
  submitPd(id: number, payload: PdDetails): Observable<Lead> {
    return this.api.post<Lead>(`${this.base}/${id}/pd`, payload);
  }
}
