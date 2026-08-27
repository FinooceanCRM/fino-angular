import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  ConnectorCommission,
  ConnectorDashboard,
  ConnectorListFilters,
  ConnectorNetworkMember,
  ConnectorPayout,
  ConnectorProfile,
  UpdateConnectorProfilePayload,
} from '@core/models/connector.model';
import { Paginated, PaginationMeta } from '@core/models/lead.model';

import { ApiService } from './api.service';

/** Transport for the Connector module endpoints. */
@Injectable({ providedIn: 'root' })
export class ConnectorService {
  private readonly api = inject(ApiService);

  dashboard(): Observable<ConnectorDashboard> {
    return this.api.get<ConnectorDashboard>('connectors/dashboard');
  }

  profile(): Observable<ConnectorProfile> {
    return this.api.get<ConnectorProfile>('connectors/profile');
  }

  updateProfile(
    payload: UpdateConnectorProfilePayload,
  ): Observable<ConnectorProfile> {
    return this.api.put<ConnectorProfile>('connectors/profile', payload);
  }

  network(filters: ConnectorListFilters = {}): Observable<Paginated<ConnectorNetworkMember>> {
    return this.api
      .getEnvelope<ConnectorNetworkMember[]>('connectors/network', filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  commissions(filters: ConnectorListFilters = {}): Observable<Paginated<ConnectorCommission>> {
    return this.api
      .getEnvelope<ConnectorCommission[]>('connectors/commissions', filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  payouts(filters: ConnectorListFilters = {}): Observable<Paginated<ConnectorPayout>> {
    return this.api
      .getEnvelope<ConnectorPayout[]>('connectors/payouts', filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  requestPayout(): Observable<ConnectorPayout> {
    return this.api.post<ConnectorPayout>('connectors/payouts');
  }
}
