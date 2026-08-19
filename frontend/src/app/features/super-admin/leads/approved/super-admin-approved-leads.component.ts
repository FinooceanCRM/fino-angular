import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LeadStatusTableComponent } from '../lead-status-table/lead-status-table.component';

@Component({
  selector: 'app-super-admin-approved-leads',
  standalone: true,
  imports: [LeadStatusTableComponent],
  template: `
    <app-super-admin-lead-status-table
      [statuses]="['approved']"
      title="Approved Leads"
      subtitle="Approved by the credit team, awaiting disbursement."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminApprovedLeadsComponent {}
