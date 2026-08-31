import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { AccessRequest, AccessRequestStatusFilter } from '@core/models/access-request.model';
import { AccessRequestService } from '@core/services/access-request.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { DetailsDrawerComponent } from '@shared/components/details-drawer.component';
import { ReasonDialogComponent } from '@shared/components/reason-dialog.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

/**
 * Bankers requesting access to a lead — the real "Banker requests access →
 * Manager approves" step, backed by `LeadAccessRequestController` via
 * `AccessRequestService`. Used by both the Approval Center's "Access
 * approvals" tab and the standalone Access Requests page.
 */
@Component({
  selector: 'app-manager-access-request-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSidenavModule,
    MatTooltipModule,
    DetailsDrawerComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './manager-access-request-list.component.html',
  styleUrl: './manager-access-request-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerAccessRequestListComponent {
  private readonly accessRequests = inject(AccessRequestService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly statusFilter = signal<'pending' | 'all'>('pending');
  protected readonly rows = signal<AccessRequest[]>([]);
  protected readonly loading = signal(false);

  protected readonly selected = signal<AccessRequest | undefined>(undefined);

  protected readonly columns: TableColumn<AccessRequest>[] = [
    { key: 'requested_by', label: 'Requested by' },
    { key: 'lead', label: 'Lead' },
    { key: 'details', label: 'Details' },
    { key: 'requested', label: 'Requested' },
  ];

  constructor() {
    this.load();
  }

  protected reload(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const status: AccessRequestStatusFilter | undefined =
      this.statusFilter() === 'pending' ? 'pending' : undefined;

    this.accessRequests.pending(status ?? 'pending').subscribe({
      next: ({ items }) => {
        this.rows.set(this.statusFilter() === 'all' ? items : items.filter((r) => r.status === 'pending'));
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }

  protected setStatusFilter(value: 'pending' | 'all'): void {
    this.statusFilter.set(value);
    this.load();
  }

  protected leadReference(row: AccessRequest): string | null {
    return row.lead ? row.lead.reference : null;
  }

  /** Title-cases the backend role string (e.g. "banker" -> "Banker") for the requester subtext. */
  protected roleLabel(role: string | undefined): string {
    return role ? role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Unknown';
  }

  /** Two-letter avatar initials for the requesting banker, mirroring EntityHeaderComponent's pattern. */
  protected initials(name: string | undefined): string {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  protected review(row: AccessRequest): void {
    this.selected.set(row);
  }

  protected closeReview(): void {
    this.selected.set(undefined);
  }

  protected approve(row: AccessRequest): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Approve request',
          message: `Approve ${row.banker?.name ?? 'this banker'}'s access request?`,
          confirmLabel: 'Approve',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.accessRequests.approve(row.id).subscribe({
          next: () => {
            this.closeReview();
            this.snackBar.open('Request approved.', 'Dismiss', { duration: 4000 });
            this.load();
          },
          error: () => this.snackBar.open('Could not approve this request.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  protected reject(row: AccessRequest): void {
    this.dialog
      .open(ReasonDialogComponent, {
        data: {
          title: 'Reject request',
          message: `Rejecting ${row.banker?.name ?? 'this banker'}'s access request. The reason is recorded on the request.`,
          reasonLabel: 'Reason for rejection',
          confirmLabel: 'Reject',
        },
      })
      .afterClosed()
      .subscribe((reason: string | undefined) => {
        if (!reason) {
          return;
        }

        this.accessRequests.reject(row.id, reason).subscribe({
          next: () => {
            this.closeReview();
            this.snackBar.open('Request rejected.', 'Dismiss', { duration: 4000 });
            this.load();
          },
          error: () => this.snackBar.open('Could not reject this request.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
