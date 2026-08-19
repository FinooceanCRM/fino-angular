import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LeadStatusTableComponent } from './lead-status-table/lead-status-table.component';

@Component({
  selector: 'app-super-admin-leads',
  standalone: true,
  imports: [LeadStatusTableComponent],
  template: `
    <app-super-admin-lead-status-table
      title="All Leads"
      subtitle="Every lead across the platform."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminLeadsComponent {}
