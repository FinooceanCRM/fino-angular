import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
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

import { Approval, ApprovalType } from '@core/models/approval.model';
import { ApprovalService } from '@core/services/approval.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { DetailsDrawerComponent } from '@shared/components/details-drawer.component';
import { ReasonDialogComponent } from '@shared/components/reason-dialog.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

/**
 * Shared list + Review drawer for one approval bucket (Banker / Lead /
 * Document). Backed by the real Approval Center API (Phase 5, Part A) — the
 * Access type is rendered separately by `ManagerAccessRequestListComponent`,
 * backed by `AccessRequestService`.
 */
@Component({
  selector: 'app-manager-approval-list',
  standalone: true,
  imports: [
    CurrencyPipe,
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
export class ManagerApprovalListComponent implements OnInit {
  readonly type = input.required<ApprovalType>();

  private readonly approvalsApi = inject(ApprovalService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly statusFilter = signal<'pending' | 'all'>('pending');
  protected readonly rows = signal<Approval[]>([]);
  protected readonly loading = signal(false);

  protected readonly selected = signal<Approval | undefined>(undefined);
  protected readonly commentDraft = signal('');

  protected readonly columns: TableColumn<Approval>[] = [
    { key: 'name', label: 'Name' },
    { key: 'loan_type', label: 'Loan type' },
    { key: 'loan_amount', label: 'Loan amount', align: 'right' },
    { key: 'city', label: 'City' },
    { key: 'banker', label: 'Banker' },
    { key: 'status', label: 'Status' },
  ];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.approvalsApi
      .list({
        type: this.type(),
        status: this.statusFilter() === 'pending' ? 'pending' : undefined,
        per_page: 100,
      })
      .subscribe({
        next: ({ items }) => {
          this.rows.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.loading.set(false);
        },
      });
  }

  protected reload(): void {
    this.load();
  }

  protected setStatusFilter(value: 'pending' | 'all'): void {
    this.statusFilter.set(value);
    this.load();
  }

  protected leadReference(row: Approval): string | null {
    return row.lead ? row.lead.reference : null;
  }

  protected loanTypeLabel(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected statusColour(status: Approval['status']): string {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'warn';
    return 'accent';
  }

  protected review(row: Approval): void {
    this.commentDraft.set('');
    // The list response omits the comment thread — fetch full detail so the
    // drawer has it.
    this.approvalsApi.getById(row.id).subscribe({
      next: (full) => this.selected.set(full),
      // The list response omits the comment thread entirely — default it so
      // the drawer template's `row.comments.length` never sees `undefined`.
      error: () => this.selected.set({ ...row, comments: row.comments ?? [] }),
    });
  }

  protected closeReview(): void {
    this.selected.set(undefined);
  }

  protected approve(row: Approval): void {
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

        this.approvalsApi.approve(row.id).subscribe({
          next: () => {
            this.closeReview();
            this.snackBar.open('Request approved.', 'Dismiss', { duration: 4000 });
            this.reload();
          },
          error: () => this.snackBar.open('Could not approve this request.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  protected reject(row: Approval): void {
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

        this.approvalsApi.reject(row.id, reason).subscribe({
          next: () => {
            this.closeReview();
            this.snackBar.open('Request rejected.', 'Dismiss', { duration: 4000 });
            this.reload();
          },
          error: () => this.snackBar.open('Could not reject this request.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  protected addComment(): void {
    const row = this.selected();
    const body = this.commentDraft().trim();
    if (!row || !body) {
      return;
    }

    this.approvalsApi.addComment(row.id, body).subscribe({
      next: (comment) => {
        this.selected.set({ ...row, comments: [...row.comments, comment] });
        this.commentDraft.set('');
      },
      error: () => this.snackBar.open('Could not add the comment.', 'Dismiss', { duration: 4000 }),
    });
  }
}
