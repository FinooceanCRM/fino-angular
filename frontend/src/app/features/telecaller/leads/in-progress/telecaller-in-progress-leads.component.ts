import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentTelecallerId } from '../../current-telecaller';
import { TelecallerLeadBucketNavComponent } from '../lead-bucket-nav/telecaller-lead-bucket-nav.component';

@Component({
  selector: 'app-telecaller-in-progress-leads',
  standalone: true,
  imports: [TelecallerLeadBucketNavComponent, ManagerLeadStatusTableComponent],
  template: `
    <app-telecaller-lead-bucket-nav />
    <app-manager-lead-status-table
      [statuses]="statuses"
      [scopeToCreatedBy]="telecallerId"
      [allowReassign]="false"
      basePath="/telecaller/leads"
      title="In Progress"
      subtitle="Being actively worked on."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerInProgressLeadsComponent {
  protected readonly telecallerId = currentTelecallerId();
  protected readonly statuses = ['in_progress'];
}
