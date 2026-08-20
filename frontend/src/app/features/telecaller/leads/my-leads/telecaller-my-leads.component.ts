import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentTelecallerId } from '../../current-telecaller';
import { TelecallerLeadBucketNavComponent } from '../lead-bucket-nav/telecaller-lead-bucket-nav.component';

/**
 * My Submitted Leads, Telecaller-scoped. Reuses `ManagerLeadStatusTableComponent`
 * unmodified logic — same table, filters and pagination the Manager and RM
 * modules already use — pointed at leads the Telecaller personally created
 * via `scopeToCreatedBy`, with reassignment hidden (a Telecaller may never
 * assign or reassign a lead).
 */
@Component({
  selector: 'app-telecaller-my-leads',
  standalone: true,
  imports: [TelecallerLeadBucketNavComponent, ManagerLeadStatusTableComponent],
  template: `
    <app-telecaller-lead-bucket-nav />
    <app-manager-lead-status-table
      [scopeToCreatedBy]="telecallerId"
      [allowReassign]="false"
      basePath="/telecaller/leads"
      title="My Submitted Leads"
      subtitle="Every lead you have submitted, across every stage."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerMyLeadsComponent {
  protected readonly telecallerId = currentTelecallerId();
}
