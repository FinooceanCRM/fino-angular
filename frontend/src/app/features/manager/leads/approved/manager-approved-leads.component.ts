import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '../lead-status-table/manager-lead-status-table.component';

@Component({
  selector: 'app-manager-approved-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [statuses]="['approved']"
      title="Approved Leads"
      subtitle="Approved by the credit team, awaiting disbursement."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerApprovedLeadsComponent {}
