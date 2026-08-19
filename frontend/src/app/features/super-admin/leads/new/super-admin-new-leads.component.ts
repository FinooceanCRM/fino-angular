import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LeadStatusTableComponent } from '../lead-status-table/lead-status-table.component';

@Component({
  selector: 'app-super-admin-new-leads',
  standalone: true,
  imports: [LeadStatusTableComponent],
  template: `
    <app-super-admin-lead-status-table
      [statuses]="['new']"
      title="New Leads"
      subtitle="Leads not yet assigned to anyone."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminNewLeadsComponent {}
