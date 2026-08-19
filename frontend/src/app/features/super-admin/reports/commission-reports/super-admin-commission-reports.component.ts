import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { exportToCsv } from '../../data/csv-export.util';
import { LedgerEntry } from '../../data/models/commission.model';
import { BarDatum } from '../../data/models/report.model';
import { CommissionDataProvider } from '../../data/providers/commission-data.provider';
import { bucketByWeek, defaultFrom, defaultTo, inRange } from '../../data/report-date-range.util';
import { HorizontalBarListComponent } from '../charts/horizontal-bar-list.component';
import { TrendChartComponent, TrendPoint } from '../charts/trend-chart.component';

/** Commission Reports — accrual/payout trend and connector/affiliate split, sourced from the accounting ledger. */
@Component({
  selector: 'app-super-admin-commission-reports',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    HorizontalBarListComponent,
    PageHeaderComponent,
    StatCardComponent,
    TableCellDirective,
    TableComponent,
    TrendChartComponent,
  ],
  templateUrl: './super-admin-commission-reports.component.html',
  styleUrl: './super-admin-commission-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminCommissionReportsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly commissionData = inject(CommissionDataProvider);

  protected readonly range = this.fb.nonNullable.group({
    from: defaultFrom(180),
    to: defaultTo(),
  });

  private readonly rangeValues = toSignal(this.range.valueChanges, { initialValue: this.range.getRawValue() });

  protected readonly filteredLedger = computed(() => {
    const { from = defaultFrom(180), to = defaultTo() } = this.rangeValues();
    return this.commissionData.ledger().filter((entry) => inRange(entry.date, from, to));
  });

  protected readonly summary = computed(() => {
    const entries = this.filteredLedger();
    const connectorAccrued = entries
      .filter((e) => e.type === 'connector_commission_accrued')
      .reduce((sum, e) => sum + (e.credit ?? 0), 0);
    const affiliateAccrued = entries
      .filter((e) => e.type === 'affiliate_commission_accrued')
      .reduce((sum, e) => sum + (e.credit ?? 0), 0);
    const totalPaid = entries
      .filter((e) => e.type === 'connector_commission_paid' || e.type === 'affiliate_commission_paid')
      .reduce((sum, e) => sum + (e.debit ?? 0), 0);

    return {
      totalAccrued: connectorAccrued + affiliateAccrued,
      connectorAccrued,
      affiliateAccrued,
      totalPaid,
    };
  });

  protected readonly typeBreakdown = computed<BarDatum[]>(() => [
    { label: 'Connector', value: this.summary().connectorAccrued, colour: 'var(--mat-sys-primary)' },
    { label: 'Affiliate', value: this.summary().affiliateAccrued, colour: 'var(--mat-sys-tertiary)' },
  ]);

  protected readonly topConnectors = computed<BarDatum[]>(() => {
    const { from = defaultFrom(180), to = defaultTo() } = this.rangeValues();
    const inWindow = this.commissionData.connectorCommissions().filter((row) => inRange(row.earned_at, from, to));
    const byConnector = new Map<string, number>();
    for (const row of inWindow) {
      byConnector.set(row.connector_name, (byConnector.get(row.connector_name) ?? 0) + row.commission_amount);
    }
    return [...byConnector.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  });

  protected readonly trend = computed<TrendPoint[]>(() => {
    const { from = defaultFrom(180), to = defaultTo() } = this.rangeValues();
    return bucketByWeek(
      this.filteredLedger().filter(
        (e) => e.type === 'connector_commission_accrued' || e.type === 'affiliate_commission_accrued',
      ),
      (entry) => entry.date,
      from,
      to,
      (bucketEntries) => bucketEntries.reduce((sum, e) => sum + (e.credit ?? 0), 0),
    );
  });

  protected readonly columns: TableColumn<LedgerEntry>[] = [
    { key: 'date', label: 'Date' },
    { key: 'description', label: 'Description' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Credit' },
  ];

  protected export(): void {
    exportToCsv(
      'commission-report',
      this.filteredLedger().map((entry) => ({
        date: entry.date,
        type: entry.type,
        description: entry.description,
        debit: entry.debit ?? '',
        credit: entry.credit ?? '',
      })),
    );
  }
}
