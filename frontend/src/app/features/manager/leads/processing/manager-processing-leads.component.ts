import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PROCESSING_STATUSES } from '../../data/models/lead-catalogue.model';
import { ManagerLeadStatusTableComponent } from '../lead-status-table/manager-lead-status-table.component';

@Component({
  selector: 'app-manager-processing-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [statuses]="statuses"
      title="Processing Leads"
      subtitle="In progress, documents pending or under review."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerProcessingLeadsComponent {
  protected readonly statuses = PROCESSING_STATUSES;
}
