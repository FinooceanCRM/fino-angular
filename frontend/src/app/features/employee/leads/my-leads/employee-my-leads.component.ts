import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentEmployeeId } from '../../current-employee';
import { EmployeeLeadBucketNavComponent } from '../lead-bucket-nav/employee-lead-bucket-nav.component';

/**
 * My Leads, Employee-scoped. Reuses `ManagerLeadStatusTableComponent`
 * unmodified logic — same table, filters and pagination the Manager and RM
 * modules already use — pointed at the Employee's own leads via
 * `scopeToEmployeeId`, with reassignment hidden (an Employee works their own
 * leads; reassigning them is a Manager/RM action).
 */
@Component({
  selector: 'app-employee-my-leads',
  standalone: true,
  imports: [EmployeeLeadBucketNavComponent, ManagerLeadStatusTableComponent],
  template: `
    <app-employee-lead-bucket-nav />
    <app-manager-lead-status-table
      [scopeToEmployeeId]="employeeId"
      [allowReassign]="false"
      basePath="/employee/leads"
      title="My Leads"
      subtitle="Every lead currently assigned to you, across every stage."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeMyLeadsComponent {
  protected readonly employeeId = currentEmployeeId();
}
