import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentEmployeeId } from '../../current-employee';
import { EmployeeLeadBucketNavComponent } from '../lead-bucket-nav/employee-lead-bucket-nav.component';

@Component({
  selector: 'app-employee-documents-pending-leads',
  standalone: true,
  imports: [EmployeeLeadBucketNavComponent, ManagerLeadStatusTableComponent],
  template: `
    <app-employee-lead-bucket-nav />
    <app-manager-lead-status-table
      [statuses]="statuses"
      [scopeToEmployeeId]="employeeId"
      [allowReassign]="false"
      basePath="/employee/leads"
      title="Documents Pending"
      subtitle="Awaiting KYC or income documents from the applicant."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDocumentsPendingLeadsComponent {
  protected readonly employeeId = currentEmployeeId();
  protected readonly statuses = ['documents_pending'];
}
