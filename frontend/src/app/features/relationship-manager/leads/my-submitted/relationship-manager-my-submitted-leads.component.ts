import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentRmId } from '../current-rm';

/** Leads submitted through this Relationship Manager's personal lead-referral link. */
@Component({
  selector: 'app-relationship-manager-my-submitted-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [scopeToCreatedBy]="rmId"
      basePath="/relationship-manager/leads"
      title="My Submitted Leads"
      subtitle="Every lead submitted through your personal lead link."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerMySubmittedLeadsComponent {
  protected readonly rmId = currentRmId();
}
