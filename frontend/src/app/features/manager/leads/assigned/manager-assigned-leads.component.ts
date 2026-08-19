import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '../lead-status-table/manager-lead-status-table.component';

@Component({
  selector: 'app-manager-assigned-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [statuses]="['assigned']"
      title="Assigned Leads"
      subtitle="Leads handed off to an employee, awaiting follow-up."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerAssignedLeadsComponent {}
