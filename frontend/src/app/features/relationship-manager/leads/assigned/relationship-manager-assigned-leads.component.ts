import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentRmId } from '../current-rm';

@Component({
  selector: 'app-relationship-manager-assigned-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [statuses]="['assigned']"
      [scopeToRelationshipManagerId]="rmId"
      basePath="/relationship-manager/leads"
      title="Assigned Leads"
      subtitle="Your leads handed off to an employee, awaiting follow-up."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerAssignedLeadsComponent {
  protected readonly rmId = currentRmId();
}
