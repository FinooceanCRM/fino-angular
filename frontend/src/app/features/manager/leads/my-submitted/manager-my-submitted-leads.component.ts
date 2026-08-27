import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '../lead-status-table/manager-lead-status-table.component';

import { currentManagerId } from '../../current-manager';

/** Leads submitted through this Manager's personal lead-referral link. */
@Component({
  selector: 'app-manager-my-submitted-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [scopeToCreatedBy]="managerId"
      basePath="/manager/leads"
      title="My Submitted Leads"
      subtitle="Every lead submitted through your personal lead link."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerMySubmittedLeadsComponent {
  protected readonly managerId = currentManagerId();
}
