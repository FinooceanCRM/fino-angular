import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '../lead-status-table/manager-lead-status-table.component';

@Component({
  selector: 'app-manager-new-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [statuses]="['new']"
      title="New Leads"
      subtitle="Leads not yet assigned to anyone."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerNewLeadsComponent {}
