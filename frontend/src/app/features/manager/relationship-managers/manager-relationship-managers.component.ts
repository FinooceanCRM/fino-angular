import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { PageHeaderComponent } from '@shared/components/page-header.component';

import { ManagerTeamDataProvider } from '../team/data/manager-team.provider';
import { ManagerTeamActivityComponent } from '../team/team-activity/manager-team-activity.component';
import { ManagerTeamHierarchyComponent } from '../team/team-hierarchy/manager-team-hierarchy.component';
import { ManagerTeamPerformanceComponent } from '../team/team-performance/manager-team-performance.component';
import { ManagerTeamTableComponent } from '../team/team-table/manager-team-table.component';

/** Relationship Manager Management — directory, team hierarchy, performance and activity, backed by mock data. */
@Component({
  selector: 'app-manager-relationship-managers',
  standalone: true,
  imports: [
    MatTabsModule,
    PageHeaderComponent,
    ManagerTeamActivityComponent,
    ManagerTeamHierarchyComponent,
    ManagerTeamPerformanceComponent,
    ManagerTeamTableComponent,
  ],
  templateUrl: './manager-relationship-managers.component.html',
  styleUrl: './manager-relationship-managers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerRelationshipManagersComponent {
  private readonly team = inject(ManagerTeamDataProvider);

  protected readonly rmNames = computed(() => this.team.relationshipManagers().map((row) => row.name));
}
