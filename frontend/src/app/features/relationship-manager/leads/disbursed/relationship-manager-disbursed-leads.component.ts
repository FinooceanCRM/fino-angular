import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentRmId } from '../current-rm';

@Component({
  selector: 'app-relationship-manager-disbursed-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [statuses]="['disbursed']"
      [scopeToRelationshipManagerId]="rmId"
      basePath="/relationship-manager/leads"
      title="Disbursed Leads"
      subtitle="Loan amount disbursed to the applicant."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerDisbursedLeadsComponent {
  protected readonly rmId = currentRmId();
}
