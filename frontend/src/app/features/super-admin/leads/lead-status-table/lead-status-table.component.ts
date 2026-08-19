import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { Lead, LEAD_STATUS_CATALOGUE, LOAN_TYPE_CATALOGUE } from '../../data/models/lead.model';

/**
 * Reusable list page for one lead-status bucket (All / New / Assigned /
 * Processing / Approved / Disbursed / Rejected). Backed by the real
 * `GET leads` endpoint via `LeadService` — Super Admin is unscoped
 * server-side, so this sees every lead in the platform.
 */
@Component({
  selector: 'app-super-admin-lead-status-table',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
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
  templateUrl: './lead-status-table.component.html',
  styleUrl: './lead-status-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadStatusTableComponent {
  /** null = All Leads (also the only bucket that shows the extra status filter). */
  readonly statuses = input<string[] | null>(null);
  readonly title = input.required<string>();
  readonly subtitle = input('');

  private readonly fb = inject(FormBuilder);
  private readonly leads = inject(LeadService);

  protected readonly loanTypes = LOAN_TYPE_CATALOGUE;
  protected readonly statusOptions = LEAD_STATUS_CATALOGUE;
  protected readonly showAdvanced = signal(false);

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    loanType: '',
    city: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
    status: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  protected readonly rows = signal<Lead[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly columns: TableColumn<Lead>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'applicant_name', label: 'Applicant' },
    { key: 'loan', label: 'Loan' },
    { key: 'city', label: 'City', formatter: (row) => row.city ?? '—' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created' },
  ];

  constructor() {
    effect(() => {
      const f = this.filterValues();
      const bucket = this.statuses();
      const page = this.pageIndex();
      const size = this.pageSize();
      this.load(f, bucket, page, size);
    });
  }

  private load(
    f: ReturnType<typeof this.filterValues>,
    bucket: string[] | null,
    page: number,
    size: number,
  ): void {
    this.loading.set(true);
    this.error.set(null);
    const status = bucket ? bucket.join(',') : f.status || undefined;

    this.leads
      .list({
        search: f.search || undefined,
        status,
        loan_type: f.loanType || undefined,
        city: f.city || undefined,
        min_amount: f.minAmount || undefined,
        max_amount: f.maxAmount || undefined,
        created_from: f.dateFrom || undefined,
        created_to: f.dateTo || undefined,
        page: page + 1,
        per_page: size,
      })
      .subscribe({
        next: ({ items, meta }) => {
          this.rows.set(items);
          this.total.set(meta.total ?? items.length);
          this.loading.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.error.set('Could not load leads.');
          this.loading.set(false);
        },
      });
  }

  protected loanTypeLabel(value: string): string {
    return this.loanTypes.find((option) => option.value === value)?.label ?? value;
  }

  protected resetAdvanced(): void {
    this.filters.patchValue({
      loanType: '',
      city: '',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: '',
      status: '',
    });
    this.pageIndex.set(0);
  }

  protected applyFilters(): void {
    this.pageIndex.set(0);
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }
}
