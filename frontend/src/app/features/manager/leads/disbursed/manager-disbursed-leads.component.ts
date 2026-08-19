import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '../lead-status-table/manager-lead-status-table.component';

@Component({
  selector: 'app-manager-disbursed-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [statuses]="['disbursed']"
      title="Disbursed Leads"
      subtitle="Loan amount disbursed to the applicant."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerDisbursedLeadsComponent {}
