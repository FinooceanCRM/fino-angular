import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';
import { PROCESSING_STATUSES } from '@features/manager/data/models/lead-catalogue.model';

import { currentRmId } from '../current-rm';

@Component({
  selector: 'app-relationship-manager-processing-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [statuses]="statuses"
      [scopeToRelationshipManagerId]="rmId"
      basePath="/relationship-manager/leads"
      title="Processing Leads"
      subtitle="In progress, documents pending or under review."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerProcessingLeadsComponent {
  protected readonly statuses = PROCESSING_STATUSES;
  protected readonly rmId = currentRmId();
}
