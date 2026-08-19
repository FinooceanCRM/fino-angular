import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '../lead-status-table/manager-lead-status-table.component';

@Component({
  selector: 'app-manager-all-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      title="All Leads"
      subtitle="Every lead under your Relationship Managers and employees."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerAllLeadsComponent {}
