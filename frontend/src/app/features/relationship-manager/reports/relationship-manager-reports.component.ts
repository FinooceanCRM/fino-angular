import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadReportsComponent } from '@features/manager/reports/leads/manager-lead-reports.component';

import { currentRmId } from '../leads/current-rm';

/** Reports — reuses `ManagerLeadReportsComponent` scoped to this RM's own leads. */
@Component({
  selector: 'app-relationship-manager-reports',
  standalone: true,
  imports: [ManagerLeadReportsComponent],
  template: `
    <app-manager-lead-reports
      [scopeToRelationshipManagerId]="rmId"
      title="Reports"
      subtitle="Volume, status mix and loan-type breakdown of your own lead pipeline."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerReportsComponent {
  protected readonly rmId = currentRmId();
}
