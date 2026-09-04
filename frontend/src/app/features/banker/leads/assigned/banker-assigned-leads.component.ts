import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { BucketNavComponent } from '@shared/components/bucket-nav.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { SearchInputComponent } from '@shared/components/search-input.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { CatalogueOption, Lead, PaginationMeta } from '@core/models/lead.model';
import { LeadService } from '@core/services/lead.service';

import { firstName, loanTypeLabel } from '../lead-name.util';
import { BANKER_LEAD_BUCKETS } from '../lead-buckets';
import {
  BankerLeadViewDialogComponent,
  BankerLeadViewDialogData,
} from '../view-dialog/banker-lead-view-dialog.component';

/**
 * Assigned Leads (spec §3) — leads assigned to this banker before an
 * approved direct-assignment detail request moves them to Priority Leads,
 * including leads reached through an approved Matched Lead request
 * (`banker_bucket: 'assigned'`).
 */
@Component({
  selector: 'app-banker-assigned-leads',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    BucketNavComponent,
    PageHeaderComponent,
    SearchInputComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './banker-assigned-leads.component.html',
  styleUrl: './banker-assigned-leads.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerAssignedLeadsComponent implements OnInit {
  private readonly leads = inject(LeadService);
  private readonly dialog = inject(MatDialog);

  protected readonly buckets = BANKER_LEAD_BUCKETS;
  protected readonly rows = signal<Lead[]>([]);
  protected readonly meta = signal<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  protected readonly loanTypes = signal<CatalogueOption[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly firstName = firstName;
  protected readonly loanTypeLabel = (value: string) => loanTypeLabel(this.loanTypes(), value);

  private search = '';

  protected readonly columns: TableColumn<Lead>[] = [
    { key: 'first_name', label: 'Lead First Name' },
    { key: 'loan', label: 'Loan Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_by', label: 'Assigned By' },
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
        banker_bucket: 'assigned',
        search: this.search,
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
          this.error.set('Assigned leads could not be loaded.');
          this.loading.set(false);
        },
      });
  }

  protected onSearch(term: string): void {
    this.search = term;
    this.load(0);
  }

  protected onPage(event: PageEvent): void {
    this.meta.update((current) => ({ ...current, per_page: event.pageSize }));
    this.load(event.pageIndex);
  }

  /** Best available proxy for "who assigned this lead": the hierarchy actor already on it who could have authorised the assignment. */
  protected assignedBy(row: Lead): string {
    return row.assigned_manager?.name ?? row.assigned_relationship_manager?.name ?? row.assigned_employee?.name ?? '—';
  }

  protected view(row: Lead): void {
    this.dialog.open<BankerLeadViewDialogComponent, BankerLeadViewDialogData, boolean>(
      BankerLeadViewDialogComponent,
      { data: { lead: row, loanTypeLabel: this.loanTypeLabel(row.loan_type) } },
    );
  }
}
