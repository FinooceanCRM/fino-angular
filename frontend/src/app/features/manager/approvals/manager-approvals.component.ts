import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { AccessRequestService } from '@core/services/access-request.service';
import { ApprovalService } from '@core/services/approval.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

import { ManagerAccessRequestListComponent } from './access-request-list/manager-access-request-list.component';
import { ManagerApprovalListComponent } from './approval-list/manager-approval-list.component';

/**
 * Approval Center. Banker/Lead/Document tabs are backed by the real
 * Approval Center API (Phase 5, Part A); "Access approvals" is backed by
 * the real access-requests API.
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
  private readonly approvals = inject(ApprovalService);
  private readonly accessRequests = inject(AccessRequestService);

  protected readonly bankerPendingCount = signal(0);
  protected readonly leadPendingCount = signal(0);
  protected readonly documentPendingCount = signal(0);
  protected readonly accessPendingCount = signal(0);

  constructor() {
    this.approvals.pendingCount('banker').subscribe({
      next: (count) => this.bankerPendingCount.set(count),
      error: () => this.bankerPendingCount.set(0),
    });
    this.approvals.pendingCount('lead').subscribe({
      next: (count) => this.leadPendingCount.set(count),
      error: () => this.leadPendingCount.set(0),
    });
    this.approvals.pendingCount('document').subscribe({
      next: (count) => this.documentPendingCount.set(count),
      error: () => this.documentPendingCount.set(0),
    });
    this.accessRequests.pending('pending').subscribe({
      next: ({ meta }) => this.accessPendingCount.set(meta.total ?? 0),
      error: () => this.accessPendingCount.set(0),
    });
  }
}
