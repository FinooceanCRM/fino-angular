import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { LeadDocument } from '@core/models/document.model';
import {
  AssignedConnectorList,
  AssignedEmployeeList,
  RelationshipManagerDashboard,
  RelationshipManagerProfile,
  UpdateRelationshipManagerProfilePayload,
} from '@core/models/relationship-manager.model';

import { ApiService } from './api.service';

/** Transport for the Relationship Manager module endpoints. */
@Injectable({ providedIn: 'root' })
export class RelationshipManagerService {
  private readonly api = inject(ApiService);
  private readonly base = 'relationship-managers';

  dashboard(): Observable<RelationshipManagerDashboard> {
    return this.api.get<RelationshipManagerDashboard>(`${this.base}/dashboard`);
  }

  profile(): Observable<RelationshipManagerProfile> {
    return this.api.get<RelationshipManagerProfile>(`${this.base}/profile`);
  }

  updateProfile(
    payload: UpdateRelationshipManagerProfilePayload,
  ): Observable<RelationshipManagerProfile> {
    return this.api.put<RelationshipManagerProfile>(
      `${this.base}/profile`,
      payload,
    );
  }

  employees(): Observable<AssignedEmployeeList> {
    return this.api.get<AssignedEmployeeList>(`${this.base}/employees`);
  }

  connectors(): Observable<AssignedConnectorList> {
    return this.api.get<AssignedConnectorList>(`${this.base}/connectors`);
  }

  /** KYC review queue (Phase 5, Part B) — documents on this RM's own leads. */
  kycQueue(status?: 'pending' | 'verified' | 'rejected'): Observable<LeadDocument[]> {
    return this.api.get<LeadDocument[]>(`${this.base}/kyc-documents`, status ? { status } : undefined);
  }
}
