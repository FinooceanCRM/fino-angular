import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { PageHeaderComponent } from '@shared/components/page-header.component';

import { RelationshipManagerConnectorsComponent } from '../connectors/relationship-manager-connectors.component';
import { RelationshipManagerEmployeesComponent } from '../employees/relationship-manager-employees.component';
import { RelationshipManagerTeamActivitiesComponent } from './team-activities/relationship-manager-team-activities.component';
import { RelationshipManagerTeamPerformanceComponent } from './team-performance/relationship-manager-team-performance.component';

/**
 * Team Management — Employees, Connectors, Performance and Activities as
 * tabs of one page family. Employees/Connectors embed the existing,
 * already API-backed `RelationshipManagerEmployeesComponent` and
 * `RelationshipManagerConnectorsComponent` as-is; Performance and
 * Activities are new, backed by the same mock lead/audit data already
 * used elsewhere in the RM module. No table/data logic is duplicated here.
 */
@Component({
  selector: 'app-relationship-manager-team',
  standalone: true,
  imports: [
    MatTabsModule,
    PageHeaderComponent,
    RelationshipManagerEmployeesComponent,
    RelationshipManagerConnectorsComponent,
    RelationshipManagerTeamActivitiesComponent,
    RelationshipManagerTeamPerformanceComponent,
  ],
  templateUrl: './relationship-manager-team.component.html',
  styleUrl: './relationship-manager-team.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerTeamComponent {}
