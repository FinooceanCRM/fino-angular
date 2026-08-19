import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PROCESSING_STATUSES } from '../../data/models/lead.model';
import { LeadStatusTableComponent } from '../lead-status-table/lead-status-table.component';

@Component({
  selector: 'app-super-admin-processing-leads',
  standalone: true,
  imports: [LeadStatusTableComponent],
  template: `
    <app-super-admin-lead-status-table
      [statuses]="statuses"
      title="Processing Leads"
      subtitle="In progress, awaiting documents, or under credit review."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminProcessingLeadsComponent {
  protected readonly statuses = PROCESSING_STATUSES;
}
