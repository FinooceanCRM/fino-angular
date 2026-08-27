import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentEmployeeId } from '../../current-employee';

/** Leads submitted through this Employee's personal lead-referral link. */
@Component({
  selector: 'app-employee-my-submitted-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [scopeToCreatedBy]="employeeId"
      [allowReassign]="false"
      basePath="/employee/leads"
      title="My Submitted Leads"
      subtitle="Every lead submitted through your personal lead link."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeMySubmittedLeadsComponent {
  protected readonly employeeId = currentEmployeeId();
}
