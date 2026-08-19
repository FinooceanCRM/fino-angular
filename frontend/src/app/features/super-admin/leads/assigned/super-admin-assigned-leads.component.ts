import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LeadStatusTableComponent } from '../lead-status-table/lead-status-table.component';

@Component({
  selector: 'app-super-admin-assigned-leads',
  standalone: true,
  imports: [LeadStatusTableComponent],
  template: `
    <app-super-admin-lead-status-table
      [statuses]="['assigned']"
      title="Assigned Leads"
      subtitle="Leads handed off to an employee, awaiting follow-up."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminAssignedLeadsComponent {}
