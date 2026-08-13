import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ConnectorDashboard,
  ConnectorProfile,
  UpdateConnectorProfilePayload,
} from '@core/models/connector.model';

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
}
