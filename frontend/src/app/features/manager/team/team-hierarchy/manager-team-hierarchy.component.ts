import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { OrgChartComponent, OrgChartNode } from '@shared/components/org-chart.component';

import { ManagerTeamDataProvider } from '../data/manager-team-data.provider';

/**
 * Team Hierarchy — Manager → Relationship Manager → Employee, shared by both
 * management pages. Rendered as one org chart tree rooted at this manager
 * (real `auth.user()`, via `ManagerTeamDataProvider.manager()`), with the
 * real Relationship Managers as its children and, under each, their real
 * assigned Employees — no relationship here is invented, all three tiers
 * come straight from `ManagerTeamDataProvider`.
 */
@Component({
  selector: 'app-manager-team-hierarchy',
  standalone: true,
  imports: [MatCardModule, EmptyStateComponent, OrgChartComponent],
  templateUrl: './manager-team-hierarchy.component.html',
  styleUrl: './manager-team-hierarchy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerTeamHierarchyComponent {
  protected readonly team = inject(ManagerTeamDataProvider);

  protected readonly relationshipManagers = this.team.relationshipManagers;

  protected employeesFor(rmId: number) {
    return this.team.employeesFor(rmId);
  }

  protected readonly chartRoot = computed<OrgChartNode | null>(() => {
    const manager = this.team.manager();
    if (!manager) {
      return null;
    }

    return {
      id: 'manager',
      label: manager.name,
      sublabel: manager.role_label,
      children: this.relationshipManagers().map((rm) => ({
        id: `rm-${rm.id}`,
        label: rm.name,
        sublabel: this.team.roleLabel('relationship_manager'),
        children: this.employeesFor(rm.id).map((employee) => ({
          id: `emp-${employee.id}`,
          label: employee.name,
          sublabel: this.team.roleLabel('employee'),
        })),
      })),
    };
  });
}
