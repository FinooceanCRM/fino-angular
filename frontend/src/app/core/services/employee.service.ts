import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  EmployeeDashboard,
  EmployeeProfile,
  EmployeeTeam,
  UpdateEmployeeProfilePayload,
} from '@core/models/employee.model';

import { ApiService } from './api.service';

/** Transport for the Employee module endpoints. */
@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly api = inject(ApiService);

  dashboard(): Observable<EmployeeDashboard> {
    return this.api.get<EmployeeDashboard>('employees/dashboard');
  }

  profile(): Observable<EmployeeProfile> {
    return this.api.get<EmployeeProfile>('employees/profile');
  }

  updateProfile(
    payload: UpdateEmployeeProfilePayload,
  ): Observable<EmployeeProfile> {
    return this.api.put<EmployeeProfile>('employees/profile', payload);
  }

  team(): Observable<EmployeeTeam> {
    return this.api.get<EmployeeTeam>('employees/team');
  }
}
