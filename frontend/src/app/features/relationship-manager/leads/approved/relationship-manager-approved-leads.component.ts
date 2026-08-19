import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentRmId } from '../current-rm';

@Component({
  selector: 'app-relationship-manager-approved-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [statuses]="['approved']"
      [scopeToRelationshipManagerId]="rmId"
      basePath="/relationship-manager/leads"
      title="Approved Leads"
      subtitle="Approved by the credit team, awaiting disbursement."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerApprovedLeadsComponent {
  protected readonly rmId = currentRmId();
}
