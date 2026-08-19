import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadTimelineComponent } from '@features/manager/leads/lead-timeline/manager-lead-timeline.component';

/** Lead Timeline, RM-scoped. Reuses `ManagerLeadTimelineComponent` unmodified, pointed at the RM's own route tree. */
@Component({
  selector: 'app-relationship-manager-lead-timeline',
  standalone: true,
  imports: [ManagerLeadTimelineComponent],
  template: `<app-manager-lead-timeline basePath="/relationship-manager/leads" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerLeadTimelineComponent {}
