import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentEmployeeId } from '../../current-employee';
import { EmployeeLeadBucketNavComponent } from '../lead-bucket-nav/employee-lead-bucket-nav.component';

@Component({
  selector: 'app-employee-disbursed-leads',
  standalone: true,
  imports: [EmployeeLeadBucketNavComponent, ManagerLeadStatusTableComponent],
  template: `
    <app-employee-lead-bucket-nav />
    <app-manager-lead-status-table
      [statuses]="statuses"
      [scopeToEmployeeId]="employeeId"
      [allowReassign]="false"
      basePath="/employee/leads"
      title="Disbursed"
      subtitle="Loan amount disbursed to the applicant."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDisbursedLeadsComponent {
  protected readonly employeeId = currentEmployeeId();
  protected readonly statuses = ['disbursed'];
}
