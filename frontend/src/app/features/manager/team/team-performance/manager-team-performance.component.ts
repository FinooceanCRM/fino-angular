import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { StatCardComponent } from '@shared/components/stat-card.component';

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
  imports: [MatCardModule, EmptyStateComponent, StatCardComponent],
  templateUrl: './manager-team-performance.component.html',
  styleUrl: './manager-team-performance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerTeamPerformanceComponent {
  readonly role = input.required<UserRole>();

  private readonly team = inject(ManagerTeamDataProvider);

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
      avgConversion: rows.length === 0 ? 0 : Math.round(rows.reduce((sum, row) => sum + row.conversionRatePct, 0) / rows.length),
    };
  });
}
