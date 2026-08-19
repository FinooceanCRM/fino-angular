import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadDetailComponent } from '@features/manager/leads/lead-detail/manager-lead-detail.component';

/**
 * Lead Details, RM-scoped. Reuses `ManagerLeadDetailComponent` unmodified
 * (same `ActivatedRoute`, since this wrapper is what the router actually
 * instantiates for `relationship-manager/leads/:id`), pointed at the RM's
 * own route tree and with the Reassign entry points hidden — an RM
 * reassigns from the list's row action, not a dedicated page.
 */
@Component({
  selector: 'app-relationship-manager-lead-detail',
  standalone: true,
  imports: [ManagerLeadDetailComponent],
  template: `
    <app-manager-lead-detail basePath="/relationship-manager/leads" [showReassign]="false" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerLeadDetailComponent {}
