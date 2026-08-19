import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadDetailComponent } from '@features/manager/leads/lead-detail/manager-lead-detail.component';

/**
 * Lead Details, Employee-scoped. Reuses `ManagerLeadDetailComponent`
 * unmodified (same `ActivatedRoute`, since this wrapper is what the router
 * actually instantiates for `employee/leads/:id`), pointed at the Employee's
 * own route tree with the Reassign entry point hidden.
 */
@Component({
  selector: 'app-employee-lead-detail',
  standalone: true,
  imports: [ManagerLeadDetailComponent],
  template: `
    <app-manager-lead-detail basePath="/employee/leads" [showReassign]="false" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeLeadDetailComponent {}
