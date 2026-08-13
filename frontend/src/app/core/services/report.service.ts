import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DashboardReport } from '@core/models/report.model';

import { ApiService } from './api.service';

/** Role-aware dashboard statistics (Phase 9). */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiService);

  dashboard(): Observable<DashboardReport> {
    return this.api.get<DashboardReport>('reports/dashboard');
  }
}
