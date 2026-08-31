import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { initialsOf } from '@shared/components/org-chart.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { UserRole } from '@features/super-admin/data/models/user.model';

import { ManagerTeamDataProvider, TeamPerformance } from '../data/manager-team-data.provider';

interface RankedPerformance extends TeamPerformance {
  id: number;
  name: string;
}

/** Performance dashboard — ranks the manager's Relationship Managers or Employees by leads handled. */
@Component({
  selector: 'app-manager-team-performance',
  standalone: true,
  imports: [
    MatCardModule,
    EmptyStateComponent,
    StatCardComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './manager-team-performance.component.html',
  styleUrl: './manager-team-performance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerTeamPerformanceComponent {
  readonly role = input.required<UserRole>();

  private readonly team = inject(ManagerTeamDataProvider);

  protected readonly roleLabel = computed(() => this.team.roleLabel(this.role()));

  protected readonly ranked = computed<RankedPerformance[]>(() => {
    const rows = this.role() === 'employee' ? this.team.employees() : this.team.relationshipManagers();
    return rows
      .map((row) => ({ id: row.id, name: row.name, ...this.team.performanceFor(row.id) }))
      .sort((a, b) => b.leadsHandled - a.leadsHandled);
  });

  protected readonly totals = computed(() => {
    const rows = this.ranked();
    return {
      leadsHandled: rows.reduce((sum, row) => sum + row.leadsHandled, 0),
      disbursed: rows.reduce((sum, row) => sum + row.disbursed, 0),
      avgConversion:
        rows.length === 0 ? 0 : Math.round(rows.reduce((sum, row) => sum + row.conversionRatePct, 0) / rows.length),
    };
  });

  protected readonly columns = computed<TableColumn<RankedPerformance>[]>(() => [
    { key: 'employee', label: this.roleLabel() },
    { key: 'leads', label: 'Leads', formatter: (row) => `${row.leadsHandled} lead${row.leadsHandled === 1 ? '' : 's'}` },
    { key: 'approved', label: 'Approved' },
    { key: 'disbursed', label: 'Disbursed' },
    { key: 'approvalRate', label: 'Approval rate', formatter: (row) => `${row.conversionRatePct}% approval` },
    { key: 'turnaround', label: 'Avg. turnaround', formatter: (row) => `${row.avgTurnaroundDays} days` },
    { key: 'status', label: 'Status' },
  ]);

  protected initials(name: string): string {
    return initialsOf(name);
  }

  /**
   * Presentation-only derived status: "On track" at/above a 50% approval
   * rate, "Needs attention" below it. There is no backend status field for
   * team performance rows, so this reads an honest threshold off the real,
   * already-computed `conversionRatePct` (see
   * `ManagerTeamDataProvider.performanceFor`) rather than fabricating one.
   */
  protected status(row: RankedPerformance): { label: string; colour: 'success' | 'accent' } {
    return row.conversionRatePct >= 50
      ? { label: 'On track', colour: 'success' }
      : { label: 'Needs attention', colour: 'accent' };
  }
}
