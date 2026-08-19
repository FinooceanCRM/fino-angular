import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CatalogueOption, Lead, PaginationMeta } from '@core/models/lead.model';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
    StatusPillComponent,
  ],
  templateUrl: './lead-list.component.html',
  styleUrl: './lead-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadListComponent implements OnInit {
  private readonly leads = inject(LeadService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly columns = ['reference', 'applicant', 'loan', 'assignee', 'status', 'created', 'actions'];

  readonly rows = signal<Lead[]>([]);
  readonly meta = signal<PaginationMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });
  readonly statuses = signal<CatalogueOption[]>([]);
  readonly loanTypes = signal<CatalogueOption[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = this.fb.nonNullable.group({
    search: '',
    status: '',
    loan_type: '',
  });

  private pageSize = 15;

  ngOnInit(): void {
    this.leads.metadata().subscribe({
      next: (metadata) => {
        this.statuses.set(metadata.statuses);
        this.loanTypes.set(metadata.loan_types);
      },
      error: () => undefined,
    });

    const searchFromUrl = this.route.snapshot.queryParamMap.get('search');
    if (searchFromUrl) {
      this.filters.patchValue({ search: searchFromUrl });
    }

    this.load(0);
  }

  load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.leads
      .list({
        ...this.filters.getRawValue(),
        page: pageIndex + 1,
        per_page: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.meta.set({
            current_page: result.meta?.current_page ?? 1,
            per_page: result.meta?.per_page ?? this.pageSize,
            total: result.meta?.total ?? result.items.length,
            last_page: result.meta?.last_page ?? 1,
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Leads could not be loaded.');
          this.loading.set(false);
        },
      });
  }

  onPage(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.load(event.pageIndex);
  }
}
