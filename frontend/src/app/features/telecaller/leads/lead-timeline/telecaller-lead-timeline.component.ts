import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadTimelineComponent } from '@features/manager/leads/lead-timeline/manager-lead-timeline.component';

/**
 * Lead Timeline, Telecaller-scoped — the full status-change history for one
 * lead, including her own follow-up/note/PD entries (all written into
 * `lead_status_history` by `TelecallerFollowUpService`/`completePd`).
 * Reuses `ManagerLeadTimelineComponent` unmodified, pointed at the
 * Telecaller's own route tree.
 */
@Component({
  selector: 'app-telecaller-lead-timeline',
  standalone: true,
  imports: [ManagerLeadTimelineComponent],
  template: `<app-manager-lead-timeline basePath="/telecaller/leads" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerLeadTimelineComponent {}
