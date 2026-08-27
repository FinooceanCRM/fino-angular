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
import { defaultFrom, defaultTo, inRange } from '@features/super-admin/data/report-date-range.util';
import { HorizontalBarListComponent } from '@features/super-admin/reports/charts/horizontal-bar-list.component';

import { ManagerLeadsDataProvider } from '../../data/providers/manager-leads.provider';

interface EmployeeReportRow {
  employee: string;
  total: number;
  approved: number;
  disbursed: number;
  conversionRate: number;
}

/** Employee Reports — leads handled, approved and disbursed, broken down by employee. */
@Component({
  selector: 'app-manager-employee-reports',
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
  ],
  templateUrl: './manager-employee-reports.component.html',
  styleUrl: './manager-employee-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerEmployeeReportsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly leadData = inject(ManagerLeadsDataProvider);

  protected readonly range = this.fb.nonNullable.group({
    from: defaultFrom(120),
    to: defaultTo(),
  });

  private readonly rangeValues = toSignal(this.range.valueChanges, { initialValue: this.range.getRawValue() });

  private readonly filteredLeads = computed(() => {
    const { from = defaultFrom(120), to = defaultTo() } = this.rangeValues();
    return this.leadData.leads().filter((lead) => inRange(lead.created_at, from, to));
  });

  protected readonly rows = computed<EmployeeReportRow[]>(() => {
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
      .sort((a, b) => b.total - a.total);
  });

  protected readonly summary = computed(() => {
    const rows = this.rows();
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    const decided = rows.reduce((sum, row) => sum + row.approved + row.disbursed, 0);
    return {
      employees: rows.length,
      total,
      avgConversion: total ? Math.round((decided / total) * 1000) / 10 : 0,
    };
  });

  protected readonly barData = computed<BarDatum[]>(() =>
    this.rows().map((row) => ({ label: row.employee, value: row.total })),
  );

  protected readonly columns: TableColumn<EmployeeReportRow>[] = [
    { key: 'employee', label: 'Employee' },
    { key: 'total', label: 'Leads handled' },
    { key: 'approved', label: 'Approved' },
    { key: 'disbursed', label: 'Disbursed' },
    { key: 'conversionRate', label: 'Conversion', formatter: (row) => `${row.conversionRate}%` },
  ];

  protected export(): void {
    exportToCsv(
      'manager-employee-report',
      this.rows().map((row) => ({
        employee: row.employee,
        leads_handled: row.total,
        approved: row.approved,
        disbursed: row.disbursed,
        conversion_rate_pct: row.conversionRate,
      })),
    );
  }
}
