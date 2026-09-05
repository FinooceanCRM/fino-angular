import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { CatalogueOption, Lead } from '@core/models/lead.model';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

/**
 * The Disbursements / loan register — every disbursed LoanLead, the single
 * source of truth every commission and ledger row traces back to (see
 * LeadService::changeStatus, the LedgerEntry `related_type=LoanLead` write
 * point). Read-only: reused across the app's `permission:leads.view` gate,
 * scoped platform-wide for Accounts the same way it is for Super Admin
 * (see EloquentLoanLeadRepository::visibleQuery).
 */
@Component({
  selector: 'app-accounts-disbursements',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    PageHeaderComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './accounts-disbursements.component.html',
  styleUrl: './accounts-disbursements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsDisbursementsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leads = inject(LeadService);

  protected readonly rows = signal<Lead[]>([]);
  protected readonly loanTypes = signal<CatalogueOption[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(15);

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    loan_type: '',
    created_from: '',
    created_to: '',
  });

  protected readonly columns: TableColumn<Lead>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'applicant', label: 'Applicant' },
    { key: 'loan', label: 'Loan' },
    { key: 'amount', label: 'Amount' },
    { key: 'connector', label: 'Connector' },
    { key: 'disbursed_on', label: 'Disbursed on' },
  ];

  ngOnInit(): void {
    this.leads.metadata().subscribe({
      next: (metadata) => this.loanTypes.set(metadata.loan_types),
      error: () => this.loanTypes.set([]),
    });
    this.load(0);
  }

  protected load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    const f = this.filters.getRawValue();

    this.leads
      .list({
        status: 'disbursed',
        search: f.search || undefined,
        loan_type: f.loan_type || undefined,
        created_from: f.created_from || undefined,
        created_to: f.created_to || undefined,
        page: pageIndex + 1,
        per_page: this.pageSize(),
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.total.set(result.meta.total ?? result.items.length);
          this.pageIndex.set((result.meta.current_page ?? 1) - 1);
          this.pageSize.set(result.meta.per_page ?? this.pageSize());
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Disbursed leads could not be loaded.');
          this.loading.set(false);
        },
      });
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.load(event.pageIndex);
  }

  protected payeeName(row: Lead): string {
    return row.connector?.name ?? 'No connector';
  }
}
