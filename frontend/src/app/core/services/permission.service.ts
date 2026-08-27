import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PermissionAction, PermissionMatrix } from '@core/models/permission.model';

import { ApiService } from './api.service';

/** Transport for the Super Admin permissions matrix (Phase 0). Super Admin only, enforced server-side. */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly api = inject(ApiService);
  private readonly base = 'permissions';

  matrix(): Observable<PermissionMatrix> {
    return this.api.get<PermissionMatrix>(`${this.base}/matrix`);
  }

  /** Grants or revokes one `module.action` permission for a role; returns the refreshed matrix. */
  update(roleSlug: string, moduleKey: string, action: PermissionAction, granted: boolean): Observable<PermissionMatrix> {
    return this.api.put<PermissionMatrix>(`${this.base}/${roleSlug}/${moduleKey}/${action}`, { granted });
  }
}
