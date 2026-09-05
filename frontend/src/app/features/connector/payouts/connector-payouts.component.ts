import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NormalizedApiError } from '@core/interceptors/error.interceptor';
import { ConnectorPayout } from '@core/models/connector.model';
import { ConnectorService } from '@core/services/connector.service';
import { PaginationMeta } from '@core/models/lead.model';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

/**
 * Shown after a payout request is accepted — sets expectations up front
 * instead of leaving the connector to guess how long a "pending" payout
 * sits before money actually moves. The 45-working-day figure is the
 * platform's standard payout SLA; update here if that policy changes.
 */
const PAYOUT_REQUEST_SUCCESS_MESSAGE =
  'Your payout request has been submitted for approval. Once approved, payouts are typically credited within 45 working days.';

const OPEN_PAYOUT_STATUSES = new Set(['pending', 'processing']);

/**
 * Payout history + a "Request Payout" action. Disabled whenever the
 * accrued balance is zero, or whenever a payout is already
 * pending/processing — requesting again in that state would just be
 * rejected server-side, so the button reflects that up front rather than
 * surfacing a 422. Same shape as AffiliatePayoutsComponent.
 */
@Component({
  selector: 'app-connector-payouts',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="My payouts" subtitle="Request and track payouts of your accrued commissions" />

    @if (success(); as message) {
      <mat-card class="notice notice--success">
        <mat-card-content>
          <mat-icon>task_alt</mat-icon>
          <span>{{ message }}</span>
        </mat-card-content>
      </mat-card>
    }

    @if (error(); as message) {
      <mat-card class="notice notice--error">
        <mat-card-content>
          <mat-icon>error_outline</mat-icon>
          <span>{{ message }}</span>
        </mat-card-content>
      </mat-card>
    }

    <mat-card class="table-card">
      <mat-card-header>
        <mat-card-title>Accrued balance: ₹{{ pendingPayout() | number: '1.0-2' }}</mat-card-title>
        <mat-card-subtitle>{{ requestHint() }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="table-card__actions">
          <button
            mat-flat-button
            color="primary"
            type="button"
            [disabled]="requestDisabled()"
            [matTooltip]="requestHint()"
            (click)="requestPayout()"
          >
            <mat-icon>account_balance_wallet</mat-icon>
            Request payout
          </button>
        </div>

        <app-table
          [columns]="columns"
          [rows]="rows()"
          [loading]="loading()"
          [length]="meta().total"
          [pageIndex]="meta().current_page - 1"
          [pageSize]="meta().per_page"
          emptyMessage="You haven't requested a payout yet."
          itemLabel="payouts"
          (pageChange)="onPage($event)"
        >
          <ng-template appTableCell="amount" let-row>
            ₹{{ row.amount | number: '1.0-2' }}
          </ng-template>
          <ng-template appTableCell="status" let-row>
            <app-status-pill [label]="row.status_label" [colour]="row.status_colour" />
          </ng-template>
          <ng-template appTableCell="requested_at" let-row>
            {{ row.requested_at | date: 'mediumDate' }}
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
      .notice mat-card-content {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
      }
      .notice--success {
        color: var(--app-status-success-fg);
      }
      .notice--error {
        color: var(--app-status-warn-fg);
      }
      .table-card__actions {
        display: flex;
        justify-content: flex-end;
        margin-bottom: var(--app-space-3);
      }
    `,
  ],
})
export class ConnectorPayoutsComponent implements OnInit {
  private readonly connectors = inject(ConnectorService);

  protected readonly columns: TableColumn<ConnectorPayout>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'amount', label: 'Amount' },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status' },
    { key: 'requested_at', label: 'Requested' },
  ];

  protected readonly rows = signal<ConnectorPayout[]>([]);
  protected readonly meta = signal<PaginationMeta>({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  protected readonly loading = signal(false);
  protected readonly requesting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly pendingPayout = signal(0);

  private readonly hasOpenPayout = computed(() =>
    this.rows().some((payout) => OPEN_PAYOUT_STATUSES.has(payout.status)),
  );

  protected readonly requestDisabled = computed(
    () => this.requesting() || this.pendingPayout() <= 0 || this.hasOpenPayout(),
  );

  protected readonly requestHint = computed(() => {
    if (this.hasOpenPayout()) {
      return 'You already have a payout awaiting a decision.';
    }
    if (this.pendingPayout() <= 0) {
      return 'No accrued commissions available to request yet.';
    }
    return 'Request a payout for your accrued commissions.';
  });

  ngOnInit(): void {
    this.loadBalance();
    this.load(0);
  }

  protected load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.connectors.payouts({ page: pageIndex + 1, per_page: this.meta().per_page }).subscribe({
      next: (result) => {
        this.rows.set(result.items);
        this.meta.set(result.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load your payout history.');
        this.loading.set(false);
      },
    });
  }

  protected onPage(event: PageEvent): void {
    this.success.set(null);
    this.meta.update((current) => ({ ...current, per_page: event.pageSize }));
    this.load(event.pageIndex);
  }

  protected requestPayout(): void {
    this.requesting.set(true);
    this.error.set(null);
    this.success.set(null);

    this.connectors.requestPayout().subscribe({
      next: () => {
        this.requesting.set(false);
        this.success.set(PAYOUT_REQUEST_SUCCESS_MESSAGE);
        this.load(0);
        this.loadBalance();
      },
      error: (err: NormalizedApiError) => {
        this.requesting.set(false);
        // Surfaces the real reason (e.g. "Set a payout method on your
        // profile before requesting a payout.") instead of a generic
        // message that hides why the request was rejected.
        this.error.set(err.message || 'Could not request a payout. Please try again.');
      },
    });
  }

  private loadBalance(): void {
    this.connectors.dashboard().subscribe({
      next: (dashboard) => this.pendingPayout.set(dashboard.network_totals.pending_payout),
      error: () => undefined,
    });
  }
}
