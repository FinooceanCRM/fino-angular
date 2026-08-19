import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadTimelineComponent } from '@features/manager/leads/lead-timeline/manager-lead-timeline.component';

/**
 * Lead Timeline, Employee-scoped — the full status-change history for one
 * lead (also satisfies "Status Changes"). Reuses `ManagerLeadTimelineComponent`
 * unmodified, pointed at the Employee's own route tree.
 *
 * There is no separate "Assignment History" page: unlike Manager, an
 * Employee cannot reassign leads (see `allowReassign=false` on the status
 * tables and the hidden Reassign action on Lead Details), so a dedicated
 * assignment page would only expose a reassignment form nobody in this role
 * is allowed to use — the same reasoning that already leaves RM without one.
 * The read-only "who last assigned this lead to you" fact remains visible on
 * Lead Details via its existing assignment-history summary.
 */
@Component({
  selector: 'app-employee-lead-timeline',
  standalone: true,
  imports: [ManagerLeadTimelineComponent],
  template: `<app-manager-lead-timeline basePath="/employee/leads" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeLeadTimelineComponent {}
