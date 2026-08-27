import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import { ManagerTeamDataProvider } from '../data/manager-team-data.provider';

/** Team Hierarchy — Manager → Relationship Manager → Employee, shared by both management pages. */
@Component({
  selector: 'app-manager-team-hierarchy',
  standalone: true,
  imports: [MatCardModule, MatIconModule, EmptyStateComponent, StatusPillComponent],
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
}
