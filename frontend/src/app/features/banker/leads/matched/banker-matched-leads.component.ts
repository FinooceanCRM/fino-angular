import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BucketNavComponent } from '@shared/components/bucket-nav.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { SearchInputComponent } from '@shared/components/search-input.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { CatalogueOption, Lead, PaginationMeta } from '@core/models/lead.model';
import { AccessRequestService } from '@core/services/access-request.service';
import { LeadService } from '@core/services/lead.service';
import { NormalizedApiError } from '@core/interceptors/error.interceptor';

import { firstName, loanTypeLabel } from '../lead-name.util';
import { BANKER_LEAD_BUCKETS } from '../lead-buckets';
import {
  BankerLeadViewDialogComponent,
  BankerLeadViewDialogData,
} from '../view-dialog/banker-lead-view-dialog.component';

/**
 * Matched Leads — the funnel's entry point (spec §1). Leads scored ≥10%
 * against the banker's own bank criteria that aren't assigned to them yet;
 * "Send Request" raises a `LeadAccessRequest`, which a Manager then
 * approves into Assigned Leads. Reuses `LeadService.list()` /
 * `AccessRequestService.request()` unmodified — only the `banker_bucket`
 * filter and column set are new (replaces the old "Request Access" page).
 */
@Component({
  selector: 'app-banker-matched-leads',
  standalone: true,
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    BucketNavComponent,
    PageHeaderComponent,
    SearchInputComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './banker-matched-leads.component.html',
  styleUrl: './banker-matched-leads.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerMatchedLeadsComponent implements OnInit {
  private readonly leads = inject(LeadService);
  private readonly accessRequests = inject(AccessRequestService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly buckets = BANKER_LEAD_BUCKETS;
  protected readonly rows = signal<Lead[]>([]);
  protected readonly meta = signal<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  protected readonly loanTypes = signal<CatalogueOption[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Leads requested this session, so the action reflects it immediately without a full reload. */
  protected readonly justRequested = signal<ReadonlySet<number>>(new Set());

  protected readonly firstName = firstName;
  protected readonly loanTypeLabel = (value: string) => loanTypeLabel(this.loanTypes(), value);

  private search = '';
  private loanType = '';

  protected readonly columns: TableColumn<Lead>[] = [
    { key: 'id', label: 'ID' },
    { key: 'first_name', label: 'First Name' },
    { key: 'city', label: 'City', formatter: (row) => row.city ?? '—' },
    { key: 'loan', label: 'Loan Type' },
    { key: 'amount', label: 'Amount' },
  ];

  ngOnInit(): void {
    this.leads.metadata().subscribe({
      next: (metadata) => this.loanTypes.set(metadata.loan_types),
      error: () => undefined,
    });

    this.load(0);
  }

  protected load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.leads
      .list({
        banker_bucket: 'matched',
        search: this.search,
        loan_type: this.loanType,
        page: pageIndex + 1,
        per_page: this.meta().per_page,
      })
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
          this.error.set('Matched leads could not be loaded.');
          this.loading.set(false);
        },
      });
  }

  protected onSearch(term: string): void {
    this.search = term;
    this.load(0);
  }

  protected onLoanTypeChange(value: string): void {
    this.loanType = value;
    this.load(0);
  }

  protected onPage(event: PageEvent): void {
    this.meta.update((current) => ({ ...current, per_page: event.pageSize }));
    this.load(event.pageIndex);
  }

  protected hasRequested(row: Lead): boolean {
    return this.justRequested().has(row.id);
  }

  protected view(row: Lead): void {
    this.dialog.open<BankerLeadViewDialogComponent, BankerLeadViewDialogData, boolean>(
      BankerLeadViewDialogComponent,
      { data: { lead: row, loanTypeLabel: this.loanTypeLabel(row.loan_type) } },
    );
  }

  protected requestAccess(row: Lead): void {
    this.accessRequests.request(row.id).subscribe({
      next: () => {
        this.justRequested.update((current) => new Set(current).add(row.id));
        this.snackBar.open('Access requested.', 'Dismiss', { duration: 4000 });
      },
      error: (err: NormalizedApiError) => {
        this.snackBar.open(err.message ?? 'The access request could not be submitted.', 'Dismiss', {
          duration: 6000,
        });
      },
    });
  }
}
