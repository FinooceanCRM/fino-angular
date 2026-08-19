import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentEmployeeId } from '../../current-employee';
import { EmployeeLeadBucketNavComponent } from '../lead-bucket-nav/employee-lead-bucket-nav.component';

/** Closed — the terminal status (`LeadStatus::isTerminal()` on the backend). Reassignment is hidden for these rows even when `allowReassign` is otherwise true, enforced in `ManagerLeadStatusTableComponent` itself. */
@Component({
  selector: 'app-employee-closed-leads',
  standalone: true,
  imports: [EmployeeLeadBucketNavComponent, ManagerLeadStatusTableComponent],
  template: `
    <app-employee-lead-bucket-nav />
    <app-manager-lead-status-table
      [statuses]="statuses"
      [scopeToEmployeeId]="employeeId"
      [allowReassign]="false"
      basePath="/employee/leads"
      title="Closed"
      subtitle="Loan file closed — no further action required."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeClosedLeadsComponent {
  protected readonly employeeId = currentEmployeeId();
  protected readonly statuses = ['closed'];
}
