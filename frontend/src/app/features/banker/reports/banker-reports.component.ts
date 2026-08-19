import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ReportsComponent } from '@features/reports/reports.component';

/**
 * Reports, Banker-scoped route. Reuses the shared, real `ReportsComponent`
 * unmodified — `ReportService.dashboard()` already scopes its totals to
 * what the acting role can see, so for a Banker that's leads matched to or
 * assigned to them. Existing purely for a guarded route in the Banker
 * workspace; no mock data involved.
 */
@Component({
  selector: 'app-banker-reports',
  standalone: true,
  imports: [ReportsComponent],
  template: `<app-reports />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerReportsComponent {}
