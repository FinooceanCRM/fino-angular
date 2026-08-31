import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { BankCriteria } from '@core/models/bank.model';
import { CatalogueOption, PaginationMeta } from '@core/models/lead.model';
import { BankService } from '@core/services/bank.service';
import { LeadService } from '@core/services/lead.service';

import { BankerCriteriaDialogComponent, BankerCriteriaDialogData } from './criteria-dialog/banker-criteria-dialog.component';

/**
 * Bank Criteria, Banker-scoped — real `BankService`, not mock data. The
 * backend already scopes `GET /banks` to the acting Banker's own rows
 * (`BankCriteriaService::paginate` forces `banker_id = actor.id` for that
 * role), so every row this page ever shows is one this Banker can edit and
 * delete — no separate "mine" filtering needed here. Create/Update send the
 * same `BankCriteriaPayload` the backend's `LeadMatchingService` reads
 * unmodified, so a saved product is scored exactly like every other one.
 */
@Component({
  selector: 'app-banker-criteria',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './banker-criteria.component.html',
  styleUrl: './banker-criteria.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerCriteriaComponent implements OnInit {
  private readonly banks = inject(BankService);
  private readonly leads = inject(LeadService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly rows = signal<BankCriteria[]>([]);
  protected readonly meta = signal<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  protected readonly loanTypes = signal<CatalogueOption[]>([]);
  protected readonly employmentTypes = signal<CatalogueOption[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    loan_type: '',
  });

  protected readonly columns: TableColumn<BankCriteria>[] = [
    { key: 'product', label: 'Product', formatter: (row) => `${row.bank_name} — ${row.product_name}` },
    { key: 'loan_type', label: 'Loan type', formatter: (row) => this.loanTypeLabel(row.loan_type) },
    {
      key: 'amount',
      label: 'Amount range',
      formatter: (row) =>
        `₹${row.min_loan_amount.toLocaleString('en-IN')} – ${row.max_loan_amount ? '₹' + row.max_loan_amount.toLocaleString('en-IN') : 'no max'}`,
      align: 'right',
    },
    { key: 'min_monthly_income', label: 'Min income', formatter: (row) => `₹${row.min_monthly_income.toLocaleString('en-IN')}`, align: 'right' },
    { key: 'min_credit_score', label: 'Min score', formatter: (row) => row.min_credit_score?.toString() ?? '—', align: 'right' },
    { key: 'employment_type', label: 'Employment', formatter: (row) => this.employmentTypeLabel(row.employment_type) },
    { key: 'interest_rate', label: 'Rate', formatter: (row) => (row.interest_rate ? `${row.interest_rate}%` : '—'), align: 'right' },
    { key: 'rules', label: 'Rules', formatter: (row) => `${row.eligibility_rules.length}`, align: 'right' },
    { key: 'status', label: 'Active' },
  ];

  ngOnInit(): void {
    this.leads.metadata().subscribe({
      next: (metadata) => {
        this.loanTypes.set(metadata.loan_types);
        this.employmentTypes.set(metadata.employment_types);
      },
      error: () => undefined,
    });

    this.load(0);
  }

  protected load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.banks
      .list({ ...this.filters.getRawValue(), page: pageIndex + 1, per_page: this.meta().per_page })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.meta.set({
            current_page: result.meta?.current_page ?? 1,
            per_page: result.meta?.per_page ?? this.meta().per_page,
            total: result.meta?.total ?? result.items.length,
            last_page: result.meta?.last_page ?? 1,
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Bank criteria could not be loaded.');
          this.loading.set(false);
        },
      });
  }

  protected applyFilters(): void {
    this.load(0);
  }

  protected onPage(event: PageEvent): void {
    this.meta.update((current) => ({ ...current, per_page: event.pageSize }));
    this.load(event.pageIndex);
  }

  protected loanTypeLabel(value: string): string {
    return this.loanTypes().find((option) => option.value === value)?.label ?? value;
  }

  protected employmentTypeLabel(value: string | null): string {
    if (!value) {
      return 'Any';
    }
    return this.employmentTypes().find((option) => option.value === value)?.label ?? value;
  }

  protected addCriteria(): void {
    this.openDialog(null);
  }

  protected editCriteria(row: BankCriteria): void {
    this.openDialog(row);
  }

  protected toggle(row: BankCriteria): void {
    this.banks.update(row.id, { is_active: !row.is_active }).subscribe({
      next: () => this.load(this.meta().current_page - 1),
      error: () => this.snackBar.open('The product could not be updated.', 'Dismiss', { duration: 4000 }),
    });
  }

  protected deleteCriteria(row: BankCriteria): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete lending criteria',
          message: `Delete ${row.bank_name} — ${row.product_name}? Leads already matched against it keep their match history, but it will no longer be evaluated.`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.banks.remove(row.id).subscribe({
          next: () => {
            this.snackBar.open('Criteria deleted.', 'Dismiss', { duration: 4000 });
            this.load(0);
          },
          error: () => this.snackBar.open('The product could not be deleted.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  private openDialog(criteria: BankCriteria | null): void {
    this.dialog
      .open(BankerCriteriaDialogComponent, {
        data: {
          criteria,
          loanTypes: this.loanTypes(),
          employmentTypes: this.employmentTypes(),
        } satisfies BankerCriteriaDialogData,
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          return;
        }

        const request = criteria ? this.banks.update(criteria.id, payload) : this.banks.create(payload);
        request.subscribe({
          next: () => {
            this.snackBar.open(criteria ? 'Criteria updated.' : 'Criteria added.', 'Dismiss', { duration: 4000 });
            this.load(criteria ? this.meta().current_page - 1 : 0);
          },
          error: () => this.snackBar.open('The product could not be saved.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
