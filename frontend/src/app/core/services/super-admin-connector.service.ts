import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ConnectorPayout, ConnectorProfile } from '@core/models/connector.model';
import { Paginated, PaginationMeta } from '@core/models/lead.model';

import { ApiService } from './api.service';

export interface SuperAdminConnectorFilters {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface UpdateConnectorAdminPayload {
  commission_rate?: number | null;
  status?: string;
}

/** Transport for the Super Admin connector management + payout decision endpoints. */
@Injectable({ providedIn: 'root' })
export class SuperAdminConnectorService {
  private readonly api = inject(ApiService);
  private readonly base = 'super-admin/connectors';

  list(filters: SuperAdminConnectorFilters = {}): Observable<Paginated<ConnectorProfile>> {
    return this.api
      .getEnvelope<ConnectorProfile[]>(this.base, filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  update(connectorUserId: number, payload: UpdateConnectorAdminPayload): Observable<ConnectorProfile> {
    return this.api.put<ConnectorProfile>(`${this.base}/${connectorUserId}`, payload);
  }

  payouts(filters: SuperAdminConnectorFilters = {}): Observable<Paginated<ConnectorPayout>> {
    return this.api
      .getEnvelope<ConnectorPayout[]>(`${this.base}/payouts`, filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  approvePayout(payoutId: number): Observable<ConnectorPayout> {
    return this.api.post<ConnectorPayout>(`${this.base}/payouts/${payoutId}/approve`);
  }

  markPayoutPaid(payoutId: number): Observable<ConnectorPayout> {
    return this.api.post<ConnectorPayout>(`${this.base}/payouts/${payoutId}/mark-paid`);
  }

  rejectPayout(payoutId: number, reason: string): Observable<ConnectorPayout> {
    return this.api.post<ConnectorPayout>(`${this.base}/payouts/${payoutId}/reject`, { reason });
  }
}
