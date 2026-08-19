import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LeadStatusTableComponent } from '../lead-status-table/lead-status-table.component';

@Component({
  selector: 'app-super-admin-rejected-leads',
  standalone: true,
  imports: [LeadStatusTableComponent],
  template: `
    <app-super-admin-lead-status-table
      [statuses]="['rejected']"
      title="Rejected Leads"
      subtitle="Did not meet eligibility criteria."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminRejectedLeadsComponent {}
