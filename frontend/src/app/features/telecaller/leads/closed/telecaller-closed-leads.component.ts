import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentTelecallerId } from '../../current-telecaller';
import { TelecallerLeadBucketNavComponent } from '../lead-bucket-nav/telecaller-lead-bucket-nav.component';

/** Closed — the terminal status (`LeadStatus::isTerminal()` on the backend). */
@Component({
  selector: 'app-telecaller-closed-leads',
  standalone: true,
  imports: [TelecallerLeadBucketNavComponent, ManagerLeadStatusTableComponent],
  template: `
    <app-telecaller-lead-bucket-nav />
    <app-manager-lead-status-table
      [statuses]="statuses"
      [scopeToCreatedBy]="telecallerId"
      [allowReassign]="false"
      basePath="/telecaller/leads"
      title="Closed"
      subtitle="Loan file closed — no further action required."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerClosedLeadsComponent {
  protected readonly telecallerId = currentTelecallerId();
  protected readonly statuses = ['closed'];
}
