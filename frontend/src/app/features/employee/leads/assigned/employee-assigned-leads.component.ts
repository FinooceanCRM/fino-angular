import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentEmployeeId } from '../../current-employee';
import { EmployeeLeadBucketNavComponent } from '../lead-bucket-nav/employee-lead-bucket-nav.component';

@Component({
  selector: 'app-employee-assigned-leads',
  standalone: true,
  imports: [EmployeeLeadBucketNavComponent, ManagerLeadStatusTableComponent],
  template: `
    <app-employee-lead-bucket-nav />
    <app-manager-lead-status-table
      [statuses]="statuses"
      [scopeToEmployeeId]="employeeId"
      [allowReassign]="false"
      basePath="/employee/leads"
      title="Assigned Leads"
      subtitle="Assigned to you, not yet started."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAssignedLeadsComponent {
  protected readonly employeeId = currentEmployeeId();
  protected readonly statuses = ['assigned'];
}
