import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LeadStatusTableComponent } from '../lead-status-table/lead-status-table.component';

@Component({
  selector: 'app-super-admin-disbursed-leads',
  standalone: true,
  imports: [LeadStatusTableComponent],
  template: `
    <app-super-admin-lead-status-table
      [statuses]="['disbursed']"
      title="Disbursed Leads"
      subtitle="Loan amount has been paid out."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminDisbursedLeadsComponent {}
