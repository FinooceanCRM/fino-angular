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

import { Lead, UserSummary, loanTypeLabel } from '../../data/models/lead.model';
import { LeadDataProvider } from '../../data/providers/lead-data.provider';
import { UserDataProvider } from '../../data/providers/user-data.provider';
import { AssignBankerModalComponent, AssignBankerModalData } from '../assign-banker-modal/assign-banker-modal.component';

/** Banker assignment interface — reads/writes the centralized Lead and User state, no HTTP. */
@Component({
  selector: 'app-super-admin-assigned-leads',
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
  templateUrl: './super-admin-assigned-leads.component.html',
  styleUrl: './super-admin-assigned-leads.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminAssignedLeadsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly leadData = inject(LeadDataProvider);
  private readonly userData = inject(UserDataProvider);

  protected readonly bankers = computed(() =>
    this.userData
      .users()
      .filter((user) => user.role === 'banker' && user.is_active)
      .map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role })),
  );

  protected readonly rows = this.leadData.leads;

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    banker: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly filteredRows = computed(() => {
    const f = this.filterValues();
    const search = (f.search ?? '').trim().toLowerCase();

    return this.rows().filter((lead) => {
      const matchesSearch =
        !search ||
        lead.applicant_name.toLowerCase().includes(search) ||
        lead.reference.toLowerCase().includes(search);

      const matchesBanker =
        !f.banker || (f.banker === 'assigned' ? !!lead.assigned_banker : !lead.assigned_banker);

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
        data: { lead: row, bankers: this.bankers() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === undefined) {
          return;
        }

        this.leadData.assignBanker(row.id, result);

        this.snackBar.open(
          result ? `${row.reference} assigned to ${result.name}.` : `${row.reference} is now unassigned.`,
          'Dismiss',
          { duration: 4000 },
        );
      });
  }
}
