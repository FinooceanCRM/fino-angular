import { CurrencyPipe, DatePipe } from '@angular/common';
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

import {
  BankerDetailsDialogComponent,
  BankerDetailsDialogData,
} from '../../manager/approvals/access-request-list/banker-details-dialog.component';

/**
 * Bankers requesting full contact details on a lead — Super Admin's review
 * of the same `LeadAccessRequestController` workflow the Manager's "Access
 * approvals" tab already handles. Mirrors ManagerAccessRequestListComponent,
 * with lead links pointed at the Super Admin lead-detail route.
 */
@Component({
  selector: 'app-super-admin-approvals',
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
    MatSelectModule,
    MatSidenavModule,
    MatTooltipModule,
    DetailsDrawerComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './super-admin-approvals.component.html',
  styleUrl: './super-admin-approvals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminApprovalsComponent {
  private readonly accessRequests = inject(AccessRequestService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly statusFilter = signal<'pending' | 'all'>('pending');
  protected readonly rows = signal<AccessRequest[]>([]);
  protected readonly loading = signal(false);

  protected readonly selected = signal<AccessRequest | undefined>(undefined);

  protected readonly columns: TableColumn<AccessRequest>[] = [
    { key: 'name', label: 'Name' },
    { key: 'loan_type', label: 'Loan type' },
    { key: 'loan_amount', label: 'Loan amount' },
    { key: 'city', label: 'City' },
    { key: 'banker', label: 'Banker' },
    { key: 'status', label: 'Status' },
  ];

  constructor() {
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

  protected reload(): void {
    this.load();
  }

  protected leadReference(row: AccessRequest): string | null {
    return row.lead ? row.lead.reference : null;
  }

  protected loanTypeLabel(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected labelise(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }

  protected initials(name: string | undefined): string {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
    return parts.length === 0 ? '?' : (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  protected roleLabel(role: string | undefined): string {
    return role ? this.labelise(role) : 'Unknown';
  }

  protected viewBanker(row: AccessRequest): void {
    if (!row.banker) {
      return;
    }

    this.dialog.open<BankerDetailsDialogComponent, BankerDetailsDialogData>(BankerDetailsDialogComponent, {
      data: { banker: row.banker },
      width: 'min(520px, calc(100vw - 32px))',
      maxWidth: 'calc(100vw - 32px)',
    });
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
