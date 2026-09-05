import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { AccountsDashboard } from '@core/models/accounts.model';
import { AccountsService } from '@core/services/accounts.service';
import { BarDatum, HorizontalBarListComponent } from '@shared/components/horizontal-bar-list.component';
import { DashboardHeroComponent } from '@shared/components/dashboard-hero.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';
import { TrendChartComponent, TrendPoint } from '@shared/components/trend-chart.component';

const LEDGER_TYPE_ICON: Record<string, string> = {
  disbursement: 'payments',
  connector_commission_accrued: 'trending_up',
  connector_commission_paid: 'account_balance_wallet',
  affiliate_commission_accrued: 'trending_up',
  affiliate_commission_paid: 'account_balance_wallet',
};

/**
 * Accounts module home page — KPI totals, a 6-month disbursement trend,
 * accrued-vs-paid commission, the payout queue split by status, and the
 * most recent ledger activity. Every figure comes straight from
 * GET accounts/dashboard (see App\Services\AccountsService::dashboardFor) —
 * nothing here is computed independently of the ledger/payout tables the
 * Commissions pages already read from.
 */
@Component({
  selector: 'app-accounts-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    RouterLink,
    DashboardHeroComponent,
    HorizontalBarListComponent,
    StatCardComponent,
    TimelineComponent,
    TrendChartComponent,
  ],
  templateUrl: './accounts-dashboard.component.html',
  styleUrl: './accounts-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsDashboardComponent implements OnInit {
  private readonly accounts = inject(AccountsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<AccountsDashboard | null>(null);
  protected readonly asOfLabel = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Formatted here rather than via a `currency` pipe in the template —
  // `CurrencyPipe.transform()` returns `string | null`, which the plain
  // `string`/`string | number` inputs on StatCardComponent/
  // DashboardHeroComponent don't accept under strictTemplates. Uses the
  // app's actual configured locale (DI), not a hardcoded locale string —
  // Angular throws if a locale's data was never registered.
  private readonly currency = new CurrencyPipe(inject(LOCALE_ID));
  private formatInr(value: number): string {
    return this.currency.transform(value, 'INR', 'symbol-narrow', '1.0-0') ?? '₹0';
  }

  protected readonly disbursedThisMonth = computed(() =>
    this.formatInr(this.data()?.kpis?.disbursed_this_month ?? 0),
  );
  protected readonly disbursedYtd = computed(() => this.formatInr(this.data()?.kpis?.disbursed_ytd ?? 0));
  protected readonly commissionPayable = computed(() =>
    this.formatInr(this.data()?.kpis?.commission_payable ?? 0),
  );
  protected readonly paidThisMonth = computed(() => this.formatInr(this.data()?.kpis?.paid_this_month ?? 0));
  protected readonly pendingPayoutsCount = computed(() => this.data()?.kpis?.pending_payouts_count ?? 0);
  protected readonly pendingPayoutsTrend = computed(
    () => this.formatInr(this.data()?.kpis?.pending_payouts_amount ?? 0) + ' pending',
  );

  protected readonly disbursementTrend = computed<TrendPoint[]>(() =>
    (this.data()?.disbursement_trend ?? []).map((point) => ({ label: point.month, value: point.value })),
  );

  protected readonly commissionAccruedTrend = computed<TrendPoint[]>(() =>
    (this.data()?.commission_trend.accrued ?? []).map((point) => ({ label: point.month, value: point.value })),
  );

  protected readonly commissionPaidTrend = computed<TrendPoint[]>(() =>
    (this.data()?.commission_trend.paid ?? []).map((point) => ({ label: point.month, value: point.value })),
  );

  protected readonly payoutStatusBars = computed<BarDatum[]>(() => {
    const breakdown = this.data()?.payout_status_breakdown;
    if (!breakdown) {
      return [];
    }
    return [
      { label: 'Pending', value: breakdown.pending.count, colour: 'var(--app-status-accent-fg)' },
      { label: 'Processing', value: breakdown.processing.count, colour: 'var(--mat-sys-primary)' },
      { label: 'Paid', value: breakdown.paid.count, colour: 'var(--app-status-success-fg)' },
      { label: 'Failed', value: breakdown.failed.count, colour: 'var(--app-status-warn-fg)' },
    ];
  });

  protected readonly recentActivity = computed<TimelineEntry[]>(() =>
    (this.data()?.recent_activity ?? []).map((entry) => ({
      icon: LEDGER_TYPE_ICON[entry.type] ?? 'receipt_long',
      title: entry.description,
      subtitle: entry.type_label,
      time: entry.date ?? undefined,
    })),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accounts.dashboard().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The accounts dashboard could not be loaded.');
        this.loading.set(false);
      },
    });
  }
}
