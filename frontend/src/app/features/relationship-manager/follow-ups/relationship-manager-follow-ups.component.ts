import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { PageHeaderComponent } from '@shared/components/page-header.component';

import { RelationshipManagerActivityListComponent } from '../activities/activity-list/relationship-manager-activity-list.component';

/** Follow-ups — Calls, Meetings, Tasks and Reminders, backed by mock data. */
@Component({
  selector: 'app-relationship-manager-follow-ups',
  standalone: true,
  imports: [MatTabsModule, PageHeaderComponent, RelationshipManagerActivityListComponent],
  templateUrl: './relationship-manager-follow-ups.component.html',
  styleUrl: './relationship-manager-follow-ups.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerFollowUpsComponent {}
