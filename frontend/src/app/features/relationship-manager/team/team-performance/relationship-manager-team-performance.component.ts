import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { StatCardComponent } from '@shared/components/stat-card.component';

import { ManagedUser } from '@core/models/user.model';
import { UserService } from '@core/services/user.service';

import { ManagerLeadsDataProvider } from '@features/manager/data/providers/manager-leads.provider';

interface EmployeePerformanceRow {
  id: number;
  name: string;
  leadsHandled: number;
  approved: number;
  disbursed: number;
  conversionRatePct: number;
}

/** Team Performance — real lead counts per employee, computed from `ManagerLeadsDataProvider` (`GET leads`, already scoped to this RM's own leads). */
@Component({
  selector: 'app-relationship-manager-team-performance',
  standalone: true,
  imports: [EmptyStateComponent, StatCardComponent],
  templateUrl: './relationship-manager-team-performance.component.html',
  styleUrl: './relationship-manager-team-performance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerTeamPerformanceComponent {
  private readonly leadData = inject(ManagerLeadsDataProvider);
  private readonly userService = inject(UserService);

  private readonly employees = signal<ManagedUser[]>([]);

  constructor() {
    // GET /users is already scoped server-side to this RM's own employees.
    this.userService.list({ role: 'employee', perPage: 200 }).subscribe({
      next: (employees) => this.employees.set(employees),
      error: () => this.employees.set([]),
    });
  }

  protected readonly ranked = computed<EmployeePerformanceRow[]>(() => {
    const employees = this.employees();
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
