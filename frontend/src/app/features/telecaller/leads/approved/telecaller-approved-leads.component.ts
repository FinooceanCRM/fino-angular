import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentTelecallerId } from '../../current-telecaller';
import { TelecallerLeadBucketNavComponent } from '../lead-bucket-nav/telecaller-lead-bucket-nav.component';

@Component({
  selector: 'app-telecaller-approved-leads',
  standalone: true,
  imports: [TelecallerLeadBucketNavComponent, ManagerLeadStatusTableComponent],
  template: `
    <app-telecaller-lead-bucket-nav />
    <app-manager-lead-status-table
      [statuses]="statuses"
      [scopeToCreatedBy]="telecallerId"
      [allowReassign]="false"
      basePath="/telecaller/leads"
      title="Approved"
      subtitle="Approved by the credit team."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerApprovedLeadsComponent {
  protected readonly telecallerId = currentTelecallerId();
  protected readonly statuses = ['approved'];
}
