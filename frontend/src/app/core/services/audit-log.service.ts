import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AuditLogEntry, AuditLogFilters } from '@core/models/audit-log.model';
import { PaginationMeta } from '@core/models/lead.model';

import { ApiService } from './api.service';

export interface AuditLogListMeta extends PaginationMeta {
  entity_types: string[];
}

export interface AuditLogList {
  items: AuditLogEntry[];
  meta: AuditLogListMeta;
}

/** Transport for the audit trail (Phase 0). Read-only — entries are written server-side by other Services. */
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly api = inject(ApiService);
  private readonly base = 'audit-logs';

  list(filters: AuditLogFilters = {}): Observable<AuditLogList> {
    return this.api
      .getEnvelope<AuditLogEntry[]>(this.base, filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? { entity_types: [] }) as unknown as AuditLogListMeta,
        })),
      );
  }

  detail(id: number): Observable<AuditLogEntry> {
    return this.api.get<AuditLogEntry>(`${this.base}/${id}`);
  }
}
