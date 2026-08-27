import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadStatusTableComponent } from '@features/manager/leads/lead-status-table/manager-lead-status-table.component';

import { currentConnectorId } from '../../current-connector';

/**
 * Leads submitted through this Connector's personal lead-referral link.
 * Connectors have no role-scoped lead-detail page of their own, so row
 * actions point at the shared `/leads/:id` detail page (open to every
 * authenticated role).
 */
@Component({
  selector: 'app-connector-my-submitted-leads',
  standalone: true,
  imports: [ManagerLeadStatusTableComponent],
  template: `
    <app-manager-lead-status-table
      [scopeToConnectorId]="connectorId"
      [allowReassign]="false"
      basePath="/leads"
      title="My Submitted Leads"
      subtitle="Every lead submitted through your personal lead link."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorMySubmittedLeadsComponent {
  protected readonly connectorId = currentConnectorId();
}
