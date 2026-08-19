import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { UserSummary } from '@core/models/lead.model';
import {
  AssignBankerModalComponent,
  AssignBankerModalData,
} from '@features/super-admin/banking/assign-banker-modal/assign-banker-modal.component';

import { Lead, loanTypeLabel } from '../../leads/data/models/lead.model';
import { ManagerBankerDataProvider } from '../data/manager-banker.provider';

/** Lead Requests — the manager's leads that need (or have) a banker, reusing Super Admin's assign-banker workflow. */
@Component({
  selector: 'app-manager-lead-requests',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './manager-lead-requests.component.html',
  styleUrl: './manager-lead-requests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerLeadRequestsComponent {
  protected readonly bankers = inject(ManagerBankerDataProvider);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loanTypeLabel = loanTypeLabel;

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    banker: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly rows = computed(() => {
    const f = this.filterValues();
    const search = (f.search ?? '').trim().toLowerCase();

    return this.bankers.leads().filter((lead) => {
      const matchesSearch =
        !search || lead.applicant_name.toLowerCase().includes(search) || lead.reference.toLowerCase().includes(search);
      const matchesBanker = !f.banker || (f.banker === 'assigned' ? !!lead.assigned_banker : !lead.assigned_banker);
      return matchesSearch && matchesBanker;
    });
  });

  protected readonly columns: TableColumn<Lead>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'applicant_name', label: 'Applicant' },
    {
      key: 'loan',
      label: 'Loan',
      formatter: (row) => `${loanTypeLabel(row.loan_type)} · ₹${row.loan_amount.toLocaleString('en-IN')}`,
    },
    { key: 'status', label: 'Status' },
    { key: 'banker', label: 'Banker' },
  ];

  protected assign(row: Lead): void {
    this.dialog
      .open<AssignBankerModalComponent, AssignBankerModalData, UserSummary | null>(AssignBankerModalComponent, {
        data: { lead: row, bankers: this.bankers.assignableBankers() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === undefined) {
          return;
        }

        this.bankers.assignBanker(row.id, result);
        this.snackBar.open(
          result ? `${row.reference} assigned to ${result.name}.` : `${row.reference} is now unassigned.`,
          'Dismiss',
          { duration: 4000 },
        );
      });
  }
}
