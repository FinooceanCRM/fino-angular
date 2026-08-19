import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { SuperAdminDashboard } from '@core/models/super-admin.model';

import { ApiService } from './api.service';

/** Transport for the Super Admin platform-wide dashboard. */
@Injectable({ providedIn: 'root' })
export class SuperAdminService {
  private readonly api = inject(ApiService);

  dashboard(): Observable<SuperAdminDashboard> {
    return this.api.get<SuperAdminDashboard>('super-admin/dashboard');
  }
}
