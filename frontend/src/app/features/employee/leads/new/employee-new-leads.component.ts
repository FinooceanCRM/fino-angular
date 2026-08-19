import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentEmployeeId } from '../../current-employee';
import { EmployeeLeadBucketNavComponent } from '../lead-bucket-nav/employee-lead-bucket-nav.component';

/**
 * New Leads — the unassigned pool, scoped the same way as every other
 * bucket. New leads have no `assigned_employee` yet by definition (a
 * Manager/RM assigns them), so this bucket is expected to stay empty for any
 * individual Employee until a lead is handed to them — that's the real
 * workflow, not a bug.
 */
@Component({
  selector: 'app-employee-new-leads',
  standalone: true,
  imports: [EmployeeLeadBucketNavComponent, ManagerLeadStatusTableComponent],
  template: `
    <app-employee-lead-bucket-nav />
    <app-manager-lead-status-table
      [statuses]="statuses"
      [scopeToEmployeeId]="employeeId"
      [allowReassign]="false"
      basePath="/employee/leads"
      title="New Leads"
      subtitle="Not yet assigned to anyone."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeNewLeadsComponent {
  protected readonly employeeId = currentEmployeeId();
  protected readonly statuses = ['new'];
}
