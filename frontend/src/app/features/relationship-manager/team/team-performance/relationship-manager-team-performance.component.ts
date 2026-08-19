import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { StatCardComponent } from '@shared/components/stat-card.component';

import { ManagerLeadDataProvider } from '@features/manager/leads/data/providers/lead-data.provider';

import { currentRmId } from '../../leads/current-rm';

interface EmployeePerformanceRow {
  id: number;
  name: string;
  leadsHandled: number;
  approved: number;
  disbursed: number;
  conversionRatePct: number;
}

/** Team Performance — real lead counts per employee, computed from the same `ManagerLeadDataProvider` the Leads pages use. */
@Component({
  selector: 'app-relationship-manager-team-performance',
  standalone: true,
  imports: [EmptyStateComponent, StatCardComponent],
  templateUrl: './relationship-manager-team-performance.component.html',
  styleUrl: './relationship-manager-team-performance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerTeamPerformanceComponent {
  private readonly leadData = inject(ManagerLeadDataProvider);
  private readonly rmId = currentRmId();

  protected readonly ranked = computed<EmployeePerformanceRow[]>(() => {
    const employees = this.leadData.employeesOfRm(this.rmId ?? 0);
    const leads = this.leadData.leads();

    return employees
      .map((employee) => {
        const rows = leads.filter((lead) => lead.assigned_employee?.id === employee.id);
        const approved = rows.filter((lead) => lead.status === 'approved' || lead.status === 'disbursed').length;
        const disbursed = rows.filter((lead) => lead.status === 'disbursed').length;

        return {
          id: employee.id,
          name: employee.name,
          leadsHandled: rows.length,
          approved,
          disbursed,
          conversionRatePct: rows.length === 0 ? 0 : Math.round((approved / rows.length) * 100),
        };
      })
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
}
