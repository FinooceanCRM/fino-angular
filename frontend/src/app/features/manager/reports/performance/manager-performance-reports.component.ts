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

import { exportToCsv } from '@features/super-admin/data/csv-export.util';
import { BarDatum } from '@features/super-admin/data/models/report.model';
import { bucketByWeek, defaultFrom, defaultTo, inRange } from '@features/super-admin/data/report-date-range.util';
import { HorizontalBarListComponent } from '@features/super-admin/reports/charts/horizontal-bar-list.component';
import { TrendChartComponent, TrendPoint } from '@features/super-admin/reports/charts/trend-chart.component';

import { ManagerLeadsDataProvider } from '../../data/providers/manager-leads.provider';

const FUNNEL_STAGES: { value: string; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved', label: 'Approved' },
  { value: 'disbursed', label: 'Disbursed' },
];

/**
 * How far each status is along the pipeline, mirroring the same ordering the
 * mock's per-status PROGRESSION table encoded. A lead currently in a given
 * status is inferred to have passed through every earlier-ranked stage —
 * real, derived from the lead's actual current status rather than a
 * synthesised history — since `GET leads` (a list endpoint) doesn't carry
 * each lead's full status-history (only the detail endpoint does, and
 * fetching that per-lead here would mean one request per lead). `rejected`
 * shares `under_review`'s rank: a rejected lead reached review but never
 * "approved".
 */
const STAGE_RANK: Record<string, number> = {
  new: 0,
  assigned: 1,
  in_progress: 2,
  documents_pending: 3,
  under_review: 4,
  rejected: 4,
  approved: 5,
  disbursed: 6,
  closed: 6,
};

interface TeamRow {
  employee: string;
  total: number;
  approved: number;
  disbursed: number;
  conversionRate: number;
}

/** Performance Reports — conversion funnel, team throughput and time-to-decision, derived from the lead timeline. */
@Component({
  selector: 'app-manager-performance-reports',
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
  templateUrl: './manager-performance-reports.component.html',
  styleUrl: './manager-performance-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerPerformanceReportsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly leadData = inject(ManagerLeadsDataProvider);

  protected readonly range = this.fb.nonNullable.group({
    from: defaultFrom(120),
    to: defaultTo(),
  });

  private readonly rangeValues = toSignal(this.range.valueChanges, { initialValue: this.range.getRawValue() });

  protected readonly filteredLeads = computed(() => {
    const { from = defaultFrom(120), to = defaultTo() } = this.rangeValues();
    return this.leadData.leads().filter((lead) => inRange(lead.created_at, from, to));
  });

  /** Leads that have reached a final decision (approved, rejected or disbursed). */
  private readonly decidedLeads = computed(() =>
    this.filteredLeads().filter((lead) => ['approved', 'disbursed', 'rejected'].includes(lead.status)),
  );

  protected readonly summary = computed(() => {
    const leads = this.filteredLeads();
    const decided = this.decidedLeads();
    const disbursed = leads.filter((lead) => lead.status === 'disbursed').length;

    // Approximates "days to decision" as `updated_at - created_at` for a
    // decided lead — real timestamps, not synthesised ones, though it can
    // overstate the span if a lead was edited again after its decision.
    const daySpans = decided
      .map((lead) => {
        if (!lead.created_at || !lead.updated_at) {
          return null;
        }
        return (new Date(lead.updated_at).getTime() - new Date(lead.created_at).getTime()) / 86400000;
      })
      .filter((value): value is number => value !== null && value >= 0);

    const avgDays = daySpans.length ? daySpans.reduce((sum, value) => sum + value, 0) / daySpans.length : 0;
    const activeEmployees = new Set(leads.map((lead) => lead.assigned_employee?.name).filter(Boolean)).size;

    return {
      conversionRate: decided.length ? Math.round((disbursed / decided.length) * 1000) / 10 : 0,
      avgDaysToDecision: Math.round(avgDays * 10) / 10,
      activeEmployees,
      decisionsMade: decided.length,
    };
  });

  /** Stage-reached counts inferred from each lead's current status — see `STAGE_RANK` above. */
  protected readonly funnel = computed<BarDatum[]>(() => {
    const leads = this.filteredLeads();
    return FUNNEL_STAGES.map((stage) => ({
      label: stage.label,
      value: leads.filter((lead) => (STAGE_RANK[lead.status] ?? 0) >= STAGE_RANK[stage.value]).length,
    }));
  });

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

  /** Weekly count of leads that reached Approved or Disbursed, bucketed by `updated_at` (see `summary` above for the same approximation). */
  protected readonly trend = computed<TrendPoint[]>(() => {
    const { from = defaultFrom(120), to = defaultTo() } = this.rangeValues();
    const outcomeLeads = this.filteredLeads().filter((lead) => lead.status === 'approved' || lead.status === 'disbursed');
    return bucketByWeek(outcomeLeads, (lead) => lead.updated_at, from, to);
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
      'manager-performance-report',
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
