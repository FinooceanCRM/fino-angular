import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { AccessRequestService } from '@core/services/access-request.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

import { ManagerAccessRequestListComponent } from './access-request-list/manager-access-request-list.component';
import { ManagerApprovalListComponent } from './approval-list/manager-approval-list.component';
import { ManagerApprovalDataProvider } from './data/manager-approval.provider';

/**
 * Approval Center. "Access approvals" is backed by the real access-requests
 * API; Banker/Lead/Document approvals have no backing workflow on the
 * backend yet, so those three tabs remain on mock data until that feature
 * exists server-side.
 */
@Component({
  selector: 'app-manager-approvals',
  standalone: true,
  imports: [MatTabsModule, PageHeaderComponent, ManagerApprovalListComponent, ManagerAccessRequestListComponent],
  templateUrl: './manager-approvals.component.html',
  styleUrl: './manager-approvals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerApprovalsComponent {
  protected readonly approvals = inject(ManagerApprovalDataProvider);
  private readonly accessRequests = inject(AccessRequestService);

  protected readonly accessPendingCount = signal(0);

  constructor() {
    this.accessRequests.pending('pending').subscribe({
      next: ({ meta }) => this.accessPendingCount.set(meta.total ?? 0),
      error: () => this.accessPendingCount.set(0),
    });
  }
}
