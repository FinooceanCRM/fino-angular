import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { exportToCsv } from '../../data/csv-export.util';
import { BarDatum } from '../../data/models/report.model';
import { LeadDataProvider } from '../../data/providers/lead-data.provider';
import { bucketByWeek, defaultFrom, defaultTo, inRange } from '../../data/report-date-range.util';
import { HorizontalBarListComponent } from '@shared/components/horizontal-bar-list.component';
import { TrendChartComponent, TrendPoint } from '@shared/components/trend-chart.component';

const FUNNEL_STAGES: { value: string; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved', label: 'Approved' },
  { value: 'disbursed', label: 'Disbursed' },
];

interface TeamRow {
  employee: string;
  total: number;
  approved: number;
  disbursed: number;
  conversionRate: number;
}

/** Performance Reports — conversion funnel, team throughput and time-to-decision, derived from the lead timeline. */
@Component({
  selector: 'app-super-admin-performance-reports',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    HorizontalBarListComponent,
    PageHeaderComponent,
    StatCardComponent,
    TableComponent,
    TrendChartComponent,
  ],
  templateUrl: './super-admin-performance-reports.component.html',
  styleUrl: './super-admin-performance-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminPerformanceReportsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly leadData = inject(LeadDataProvider);

  protected readonly range = this.fb.nonNullable.group({
    from: defaultFrom(120),
    to: defaultTo(),
  });

  private readonly rangeValues = toSignal(this.range.valueChanges, { initialValue: this.range.getRawValue() });

  protected readonly filteredLeads = computed(() => {
    const { from = defaultFrom(120), to = defaultTo() } = this.rangeValues();
    return this.leadData.leads().filter((lead) => inRange(lead.created_at, from, to));
  });

  private readonly histories = computed(() =>
    this.filteredLeads().map((lead) => ({ lead, history: this.leadData.historyFor(lead) })),
  );

  protected readonly summary = computed(() => {
    const leads = this.filteredLeads();
    const decisions = this.histories().flatMap(({ history }) =>
      history.filter((entry) => ['approved', 'disbursed', 'rejected'].includes(entry.to_status)),
    );
    const disbursed = leads.filter((lead) => lead.status === 'disbursed').length;
    const decided = decisions.length;

    const daySpans = this.histories()
      .map(({ lead, history }) => {
        const decision = history.find((entry) => ['approved', 'disbursed', 'rejected'].includes(entry.to_status));
        if (!decision || !lead.created_at || !decision.created_at) {
          return null;
        }
        return (new Date(decision.created_at).getTime() - new Date(lead.created_at).getTime()) / 86400000;
      })
      .filter((value): value is number => value !== null);

    const avgDays = daySpans.length ? daySpans.reduce((sum, value) => sum + value, 0) / daySpans.length : 0;
    const activeEmployees = new Set(leads.map((lead) => lead.assigned_employee?.name).filter(Boolean)).size;

    return {
      conversionRate: decided ? Math.round((disbursed / decided) * 1000) / 10 : 0,
      avgDaysToDecision: Math.round(avgDays * 10) / 10,
      activeEmployees,
      decisionsMade: decided,
    };
  });

  protected readonly funnel = computed<BarDatum[]>(() =>
    FUNNEL_STAGES.map((stage) => ({
      label: stage.label,
      value: this.histories().filter(({ history }) => history.some((entry) => entry.to_status === stage.value))
        .length,
    })),
  );

  protected readonly teamPerformance = computed<TeamRow[]>(() => {
    const byEmployee = new Map<string, { total: number; approved: number; disbursed: number }>();

    for (const lead of this.filteredLeads()) {
      const name = lead.assigned_employee?.name;
      if (!name) continue;
      const row = byEmployee.get(name) ?? { total: 0, approved: 0, disbursed: 0 };
      row.total += 1;
      if (lead.status === 'approved') row.approved += 1;
      if (lead.status === 'disbursed') row.disbursed += 1;
      byEmployee.set(name, row);
    }

    return [...byEmployee.entries()]
      .map(([employee, row]) => ({
        employee,
        ...row,
        conversionRate: row.total ? Math.round(((row.approved + row.disbursed) / row.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  });

  protected readonly teamBarData = computed<BarDatum[]>(() =>
    this.teamPerformance().map((row) => ({ label: row.employee, value: row.total })),
  );

  protected readonly trend = computed<TrendPoint[]>(() => {
    const { from = defaultFrom(120), to = defaultTo() } = this.rangeValues();
    const outcomeEvents = this.histories().flatMap(({ history }) =>
      history.filter((entry) => entry.to_status === 'approved' || entry.to_status === 'disbursed'),
    );
    return bucketByWeek(outcomeEvents, (entry) => entry.created_at, from, to);
  });

  protected readonly teamColumns: TableColumn<TeamRow>[] = [
    { key: 'employee', label: 'Employee' },
    { key: 'total', label: 'Leads handled' },
    { key: 'approved', label: 'Approved' },
    { key: 'disbursed', label: 'Disbursed' },
    { key: 'conversionRate', label: 'Conversion', formatter: (row) => `${row.conversionRate}%` },
  ];

  protected export(): void {
    exportToCsv(
      'performance-report',
      this.teamPerformance().map((row) => ({
        employee: row.employee,
        leads_handled: row.total,
        approved: row.approved,
        disbursed: row.disbursed,
        conversion_rate_pct: row.conversionRate,
      })),
    );
  }
}
