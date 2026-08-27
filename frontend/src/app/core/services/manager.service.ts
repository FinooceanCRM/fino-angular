import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateRelationshipManagerPayload,
  ManagedEmployeeList,
  ManagedRelationshipManagerList,
  ManagerDashboard,
  ManagerProfile,
  ReassignEmployeePayload,
  UpdateManagerProfilePayload,
  UpdateRelationshipManagerPayload,
} from '@core/models/manager.model';
import { AuthenticatedUser } from '@core/models/user.model';

import { ApiService } from './api.service';

/** Transport for the Manager module endpoints. */
@Injectable({ providedIn: 'root' })
export class ManagerService {
  private readonly api = inject(ApiService);
  private readonly base = 'managers';

  dashboard(): Observable<ManagerDashboard> {
    return this.api.get<ManagerDashboard>(`${this.base}/dashboard`);
  }

  profile(): Observable<ManagerProfile> {
    return this.api.get<ManagerProfile>(`${this.base}/profile`);
  }

  updateProfile(
    payload: UpdateManagerProfilePayload,
  ): Observable<ManagerProfile> {
    return this.api.put<ManagerProfile>(`${this.base}/profile`, payload);
  }

  relationshipManagers(): Observable<ManagedRelationshipManagerList> {
    return this.api.get<ManagedRelationshipManagerList>(
      `${this.base}/relationship-managers`,
    );
  }

  createRelationshipManager(
    payload: CreateRelationshipManagerPayload,
  ): Observable<AuthenticatedUser> {
    return this.api.post<AuthenticatedUser>(
      `${this.base}/relationship-managers`,
      payload,
    );
  }

  updateRelationshipManager(
    id: number,
    payload: UpdateRelationshipManagerPayload,
  ): Observable<AuthenticatedUser> {
    return this.api.put<AuthenticatedUser>(
      `${this.base}/relationship-managers/${id}`,
      payload,
    );
  }

  employees(): Observable<ManagedEmployeeList> {
    return this.api.get<ManagedEmployeeList>(`${this.base}/employees`);
  }

  /** Moves an employee to a different Relationship Manager under this Manager — the Team Assignment workflow. */
  reassignEmployee(
    employeeId: number,
    payload: ReassignEmployeePayload,
  ): Observable<AuthenticatedUser> {
    return this.api.put<AuthenticatedUser>(
      `${this.base}/employees/${employeeId}/reassign`,
      payload,
    );
  }
}
