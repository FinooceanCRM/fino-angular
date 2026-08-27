import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AffiliateReferral } from '@core/models/affiliate.model';
import { AffiliateService } from '@core/services/affiliate.service';
import { PaginationMeta } from '@core/models/lead.model';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

/** Leads submitted through this affiliate's referral link. */
@Component({
  selector: 'app-affiliate-referrals',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatProgressBarModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="My referrals" subtitle="Leads submitted through your referral link" />

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
          emptyMessage="No referrals yet — share your referral link to get started."
          itemLabel="referrals"
          (pageChange)="onPage($event)"
        >
          <ng-template appTableCell="status" let-row>
            <app-status-pill [label]="row.status_label" [colour]="row.status_colour" />
          </ng-template>
          <ng-template appTableCell="created_at" let-row>
            {{ row.created_at | date: 'mediumDate' }}
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
export class AffiliateReferralsComponent implements OnInit {
  private readonly affiliates = inject(AffiliateService);

  protected readonly columns: TableColumn<AffiliateReferral>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'applicant_name', label: 'Applicant' },
    { key: 'loan_type', label: 'Loan type' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Submitted' },
  ];

  protected readonly rows = signal<AffiliateReferral[]>([]);
  protected readonly meta = signal<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load(0);
  }

  protected load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.affiliates.referrals({ page: pageIndex + 1, per_page: this.meta().per_page }).subscribe({
      next: (result) => {
        this.rows.set(result.items);
        this.meta.set(result.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your referrals.');
        this.loading.set(false);
      },
    });
  }

  protected onPage(event: PageEvent): void {
    this.meta.update((current) => ({ ...current, per_page: event.pageSize }));
    this.load(event.pageIndex);
  }
}
