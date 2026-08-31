import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { PageHeaderComponent } from '@shared/components/page-header.component';

import { RelationshipManagerConnectorsComponent } from '../connectors/relationship-manager-connectors.component';
import { RelationshipManagerEmployeesComponent } from '../employees/relationship-manager-employees.component';
import { RelationshipManagerTeamActivitiesComponent } from './team-activities/relationship-manager-team-activities.component';
import { RelationshipManagerTeamHierarchyComponent } from './team-hierarchy/relationship-manager-team-hierarchy.component';
import { RelationshipManagerTeamPerformanceComponent } from './team-performance/relationship-manager-team-performance.component';

/**
 * My Team — Hierarchy, Performance, Activities, Employees and Connectors as
 * tabs of one page family. Employees/Connectors embed the existing,
 * already API-backed `RelationshipManagerEmployeesComponent` and
 * `RelationshipManagerConnectorsComponent` as-is; Hierarchy, Performance and
 * Activities are backed by the same real lead/audit/employee data already
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
    RelationshipManagerTeamHierarchyComponent,
    RelationshipManagerTeamPerformanceComponent,
  ],
  templateUrl: './relationship-manager-team.component.html',
  styleUrl: './relationship-manager-team.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerTeamComponent {}
