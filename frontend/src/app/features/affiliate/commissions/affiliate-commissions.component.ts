import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AffiliateCommission } from '@core/models/affiliate.model';
import { AffiliateService } from '@core/services/affiliate.service';
import { PaginationMeta } from '@core/models/lead.model';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

/** Commission rows accrued (and eventually paid) on this affiliate's referred leads. */
@Component({
  selector: 'app-affiliate-commissions',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatProgressBarModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="My commissions" subtitle="Commission earned on your referred leads" />

    @if (error(); as message) {
      <mat-card class="notice">
        <mat-card-content>{{ message }}</mat-card-content>
      </mat-card>
    }

    <mat-card class="table-card">
      <mat-card-content>
        <app-table
          [columns]="columns"
          [rows]="rows()"
          [loading]="loading()"
          [length]="meta().total"
          [pageIndex]="meta().current_page - 1"
          [pageSize]="meta().per_page"
          emptyMessage="No commissions have been accrued yet."
          itemLabel="commissions"
          (pageChange)="onPage($event)"
        >
          <ng-template appTableCell="lead" let-row>
            {{ row.loan_lead?.reference ?? '—' }}
          </ng-template>
          <ng-template appTableCell="rate" let-row>
            {{ row.commission_rate }}%
          </ng-template>
          <ng-template appTableCell="amount" let-row>
            ₹{{ row.commission_amount | number: '1.0-2' }}
          </ng-template>
          <ng-template appTableCell="status" let-row>
            <app-status-pill [label]="row.status_label" [colour]="row.status_colour" />
          </ng-template>
          <ng-template appTableCell="accrued_at" let-row>
            {{ row.accrued_at | date: 'mediumDate' }}
          </ng-template>
        </app-table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .table-card,
      .notice {
        margin-top: var(--app-space-4);
        border-radius: var(--app-radius-md);
      }
    `,
  ],
})
export class AffiliateCommissionsComponent implements OnInit {
  private readonly affiliates = inject(AffiliateService);

  protected readonly columns: TableColumn<AffiliateCommission>[] = [
    { key: 'lead', label: 'Lead' },
    { key: 'rate', label: 'Rate' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'accrued_at', label: 'Accrued' },
  ];

  protected readonly rows = signal<AffiliateCommission[]>([]);
  protected readonly meta = signal<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load(0);
  }

  protected load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.affiliates.commissions({ page: pageIndex + 1, per_page: this.meta().per_page }).subscribe({
      next: (result) => {
        this.rows.set(result.items);
        this.meta.set(result.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your commissions.');
        this.loading.set(false);
      },
    });
  }

  protected onPage(event: PageEvent): void {
    this.meta.update((current) => ({ ...current, per_page: event.pageSize }));
    this.load(event.pageIndex);
  }
}
