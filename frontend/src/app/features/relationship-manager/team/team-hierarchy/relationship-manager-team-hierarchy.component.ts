import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { OrgChartComponent, OrgChartNode } from '@shared/components/org-chart.component';

import { AssignedEmployee } from '@core/models/relationship-manager.model';
import { AuthService } from '@core/services/auth.service';
import { RelationshipManagerService } from '@core/services/relationship-manager.service';

/**
 * Team Hierarchy — this RM (real `auth.user()`) and the real Employees
 * assigned to them, via the same `RelationshipManagerService.employees()`
 * call already used by the Employees tab/page. No new endpoint, no invented
 * relationships — just this RM's own real reports rendered as an org chart.
 */
@Component({
  selector: 'app-relationship-manager-team-hierarchy',
  standalone: true,
  imports: [MatCardModule, MatProgressBarModule, EmptyStateComponent, OrgChartComponent],
  templateUrl: './relationship-manager-team-hierarchy.component.html',
  styleUrl: './relationship-manager-team-hierarchy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerTeamHierarchyComponent implements OnInit {
  private readonly relationshipManagerApi = inject(RelationshipManagerService);
  private readonly auth = inject(AuthService);

  protected readonly employees = signal<AssignedEmployee[]>([]);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    // Same GET already used by the Employees tab — scoped server-side to this RM's own employees.
    this.relationshipManagerApi.employees().subscribe({
      next: (result) => {
        this.employees.set(result.employees);
        this.loading.set(false);
      },
      error: () => {
        this.employees.set([]);
        this.loading.set(false);
      },
    });
  }

  protected readonly chartRoot = computed<OrgChartNode | null>(() => {
    const user = this.auth.user();
    if (!user) {
      return null;
    }

    return {
      id: 'rm',
      label: user.name,
      sublabel: user.role_label,
      children: this.employees().map((employee) => ({
        id: `emp-${employee.id}`,
        label: employee.name,
        sublabel: employee.role_label,
      })),
    };
  });
}
