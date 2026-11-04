import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  AssignableManager,
  Inquiry,
  InquiryDetail,
  InquiryFilters,
  InquiryMeta,
  InquiryStats,
  RoutingRule,
} from '@core/models/inquiry.model';

import { ApiService } from './api.service';

export interface InquiryPage {
  items: Inquiry[];
  total: number;
  lastPage: number;
  perPage: number;
}

/** Customer Inquiries queue API (Telecaller + Super Admin only; enforced server-side). */
@Injectable({ providedIn: 'root' })
export class InquiryService {
  private readonly api = inject(ApiService);

  list(filters: InquiryFilters): Observable<InquiryPage> {
    const params: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '' || value === false) continue;
      params[key] = value === true ? 1 : (value as string | number);
    }

    return this.api.getEnvelope<Inquiry[]>('inquiries', params).pipe(
      map((r) => ({
        items: r.data,
        total: Number(r.meta?.['total'] ?? 0),
        lastPage: Number(r.meta?.['last_page'] ?? 1),
        perPage: Number(r.meta?.['per_page'] ?? 15),
      })),
    );
  }

  meta(): Observable<InquiryMeta> {
    return this.api.get<InquiryMeta>('inquiries/meta');
  }

  stats(): Observable<InquiryStats> {
    return this.api.get<InquiryStats>('inquiries/stats');
  }

  detail(id: number): Observable<InquiryDetail> {
    return this.api.get<InquiryDetail>(`inquiries/${id}`);
  }

  claim(id: number): Observable<Inquiry> {
    return this.api.post<Inquiry>(`inquiries/${id}/claim`);
  }

  updateStatus(id: number, body: { inquiry_status: string; remarks?: string; next_follow_up_at?: string | null }): Observable<Inquiry> {
    return this.api.put<Inquiry>(`inquiries/${id}/status`, body);
  }

  addActivity(id: number, body: { type: 'note' | 'contact'; body: string; next_follow_up_at?: string | null }): Observable<{ id: number }> {
    return this.api.post(`inquiries/${id}/activities`, body);
  }

  managers(id: number): Observable<AssignableManager[]> {
    return this.api.get<AssignableManager[]>(`inquiries/${id}/managers`);
  }

  assign(id: number, managerId: number, reason?: string): Observable<Inquiry> {
    return this.api.post<Inquiry>(`inquiries/${id}/assign`, { manager_id: managerId, reason });
  }

  routingRules(): Observable<RoutingRule[]> {
    return this.api.get<RoutingRule[]>('inquiries/routing-rules');
  }

  setRoutingRule(department: string, managerIds: number[]): Observable<RoutingRule[]> {
    return this.api.put<RoutingRule[]>(`inquiries/routing-rules/${department}`, { manager_ids: managerIds });
  }
}
