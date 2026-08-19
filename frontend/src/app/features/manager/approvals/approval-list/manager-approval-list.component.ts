import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { DetailsDrawerComponent } from '@shared/components/details-drawer.component';
import { ReasonDialogComponent } from '@shared/components/reason-dialog.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { ManagerLeadDataProvider } from '../../leads/data/providers/lead-data.provider';
import { ApprovalRequest, ApprovalType, ManagerApprovalDataProvider } from '../data/manager-approval.provider';

/**
 * Shared list + Review drawer for one approval bucket (Banker / Lead /
 * Document / Access). Used both by the Approval Center's tabs and by Banker
 * Management's Access Requests page (same data, browsed instead of queued),
 * so Approve / Reject / Review / Add comments only need to be built once.
 */
@Component({
  selector: 'app-manager-approval-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSidenavModule,
    MatTooltipModule,
    DetailsDrawerComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './manager-approval-list.component.html',
  styleUrl: './manager-approval-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerApprovalListComponent {
  readonly type = input.required<ApprovalType>();

  protected readonly approvals = inject(ManagerApprovalDataProvider);
  private readonly leadData = inject(ManagerLeadDataProvider);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly statusFilter = signal<'pending' | 'all'>('pending');

  protected readonly rows = computed(() => {
    const all = this.approvals.byType(this.type());
    return this.statusFilter() === 'pending' ? all.filter((row) => row.status === 'pending') : all;
  });

  protected readonly selectedId = signal<number | null>(null);
  protected readonly selected = computed<ApprovalRequest | undefined>(() =>
    this.selectedId() === null ? undefined : this.approvals.getById(this.selectedId()!),
  );
  protected readonly commentDraft = signal('');

  protected readonly columns: TableColumn<ApprovalRequest>[] = [
    { key: 'title', label: 'Request' },
    { key: 'requestedBy', label: 'Requested by' },
    { key: 'requestedAt', label: 'Requested' },
    { key: 'status', label: 'Status' },
  ];

  protected leadReference(row: ApprovalRequest): string | null {
    if (row.leadId === null) {
      return null;
    }
    const lead = this.leadData.leads().find((item) => item.id === row.leadId);
    return lead ? `${lead.reference} — ${lead.applicant_name}` : null;
  }

  protected statusColour(status: ApprovalRequest['status']): string {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'warn';
    return 'accent';
  }

  protected review(row: ApprovalRequest): void {
    this.selectedId.set(row.id);
    this.commentDraft.set('');
  }

  protected closeReview(): void {
    this.selectedId.set(null);
  }

  protected approve(row: ApprovalRequest): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Approve request',
          message: `Approve "${row.title}"?`,
          confirmLabel: 'Approve',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.approvals.approve(row.id);
        this.snackBar.open('Request approved.', 'Dismiss', { duration: 4000 });
      });
  }

  protected reject(row: ApprovalRequest): void {
    this.dialog
      .open(ReasonDialogComponent, {
        data: {
          title: 'Reject request',
          message: `Rejecting "${row.title}". The reason is recorded on the request.`,
          reasonLabel: 'Reason for rejection',
          confirmLabel: 'Reject',
        },
      })
      .afterClosed()
      .subscribe((reason: string | undefined) => {
        if (!reason) {
          return;
        }

        this.approvals.reject(row.id, reason);
        this.snackBar.open('Request rejected.', 'Dismiss', { duration: 4000 });
      });
  }

  protected addComment(): void {
    const id = this.selectedId();
    const body = this.commentDraft().trim();
    if (!id || !body) {
      return;
    }

    this.approvals.addComment(id, body);
    this.commentDraft.set('');
  }
}
