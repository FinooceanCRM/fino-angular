import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentRmId } from '../current-rm';

@Component({
  selector: 'app-relationship-manager-my-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [scopeToRelationshipManagerId]="rmId"
      basePath="/relationship-manager/leads"
      title="My Leads"
      subtitle="Every lead assigned to you or to one of your employees."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerMyLeadsComponent {
  protected readonly rmId = currentRmId();
}
