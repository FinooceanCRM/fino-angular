import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { BarDatum } from '@features/super-admin/data/models/report.model';
import { exportToCsv } from '@features/super-admin/data/csv-export.util';
import { bucketByWeek, defaultFrom, defaultTo, inRange } from '@features/super-admin/data/report-date-range.util';
import { HorizontalBarListComponent } from '@features/super-admin/reports/charts/horizontal-bar-list.component';
import { TrendChartComponent, TrendPoint } from '@features/super-admin/reports/charts/trend-chart.component';

import { Lead, LEAD_STATUS_CATALOGUE, LOAN_TYPE_CATALOGUE } from '../../leads/data/models/lead.model';
import { ManagerLeadDataProvider } from '../../leads/data/providers/lead-data.provider';

const PILL_COLOUR_VAR: Record<string, string> = {
  default: 'var(--app-status-default-fg)',
  primary: 'var(--app-status-primary-fg)',
  accent: 'var(--app-status-accent-fg)',
  success: 'var(--app-status-success-fg)',
  warn: 'var(--app-status-warn-fg)',
};

/** Lead Reports — status, loan-type and weekly-volume breakdowns of the manager's team's leads. */
@Component({
  selector: 'app-manager-lead-reports',
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
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
    TrendChartComponent,
  ],
  templateUrl: './manager-lead-reports.component.html',
  styleUrl: './manager-lead-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerLeadReportsComponent {
  /** When set, scopes the report to one Relationship Manager's leads — the RM-scoped view of this same page. */
  readonly scopeToRelationshipManagerId = input<number | null>(null);
  readonly title = input('Lead Reports');
  readonly subtitle = input("Volume, status mix and loan-type breakdown of your team's lead pipeline.");

  private readonly fb = inject(FormBuilder);
  private readonly leadData = inject(ManagerLeadDataProvider);

  protected readonly range = this.fb.nonNullable.group({
    from: defaultFrom(120),
    to: defaultTo(),
  });

  private readonly rangeValues = toSignal(this.range.valueChanges, { initialValue: this.range.getRawValue() });

  protected readonly filteredLeads = computed(() => {
    const { from = defaultFrom(120), to = defaultTo() } = this.rangeValues();
    const rmId = this.scopeToRelationshipManagerId();

    return this.leadData.leads().filter((lead) => {
      const inDateRange = inRange(lead.created_at, from, to);
      const inScope = rmId === null || lead.assigned_relationship_manager?.id === rmId;
      return inDateRange && inScope;
    });
  });

  protected readonly summary = computed(() => {
    const leads = this.filteredLeads();
    const approved = leads.filter((lead) => lead.status === 'approved').length;
    const disbursed = leads.filter((lead) => lead.status === 'disbursed').length;
    const rejected = leads.filter((lead) => lead.status === 'rejected').length;
    const decided = approved + disbursed + rejected;

    return {
      total: leads.length,
      disbursed,
      conversionRate: decided ? Math.round((disbursed / decided) * 1000) / 10 : 0,
      totalValue: leads.reduce((sum, lead) => sum + lead.loan_amount, 0),
    };
  });

  protected readonly statusBreakdown = computed<BarDatum[]>(() => {
    const leads = this.filteredLeads();
    return LEAD_STATUS_CATALOGUE.map((status) => ({
      label: status.label,
      value: leads.filter((lead) => lead.status === status.value).length,
      colour: PILL_COLOUR_VAR[status.colour ?? 'default'],
    })).filter((bar) => bar.value > 0);
  });

  protected readonly loanTypeBreakdown = computed<BarDatum[]>(() => {
    const leads = this.filteredLeads();
    return LOAN_TYPE_CATALOGUE.map((type) => ({
      label: type.label,
      value: leads.filter((lead) => lead.loan_type === type.value).length,
    })).filter((bar) => bar.value > 0);
  });

  protected readonly trend = computed<TrendPoint[]>(() => {
    const { from = defaultFrom(120), to = defaultTo() } = this.rangeValues();
    return bucketByWeek(this.filteredLeads(), (lead) => lead.created_at, from, to);
  });

  protected readonly columns: TableColumn<Lead>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'applicant_name', label: 'Applicant' },
    { key: 'loan', label: 'Loan' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created' },
  ];

  protected export(): void {
    exportToCsv(
      this.scopeToRelationshipManagerId() !== null ? 'my-lead-report' : 'manager-lead-report',
      this.filteredLeads().map((lead) => ({
        reference: lead.reference,
        applicant: lead.applicant_name,
        loan_type: lead.loan_type,
        loan_amount: lead.loan_amount,
        status: lead.status_label,
        city: lead.city ?? '',
        created_at: lead.created_at ?? '',
      })),
    );
  }
}
