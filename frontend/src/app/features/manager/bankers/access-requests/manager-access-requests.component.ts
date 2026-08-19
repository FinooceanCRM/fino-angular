import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PageHeaderComponent } from '@shared/components/page-header.component';

import { ManagerAccessRequestListComponent } from '../../approvals/access-request-list/manager-access-request-list.component';

/** Access Requests — bankers requesting access to your team's leads, backed by the real access-requests API. */
@Component({
  selector: 'app-manager-access-requests',
  standalone: true,
  imports: [PageHeaderComponent, ManagerAccessRequestListComponent],
  template: `
    <app-page-header title="Access Requests" subtitle="Bankers requesting access to your team's leads" />
    <app-manager-access-request-list />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerAccessRequestsComponent {}
