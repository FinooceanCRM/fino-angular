import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '../lead-status-table/manager-lead-status-table.component';

@Component({
  selector: 'app-manager-rejected-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [statuses]="['rejected']"
      title="Rejected Leads"
      subtitle="Did not meet minimum eligibility criteria."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerRejectedLeadsComponent {}
