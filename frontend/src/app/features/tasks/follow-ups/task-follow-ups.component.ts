import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { PageHeaderComponent } from '@shared/components/page-header.component';

import { TaskBucketNavComponent } from '../task-bucket-nav/task-bucket-nav.component';
import { TasksComponent } from '../tasks.component';

/**
 * Follow-ups — Calls, Meetings, Tasks and Reminders in one tabbed view,
 * mirroring the Relationship Manager module's Follow-ups page. Each tab
 * embeds `TasksComponent` with its header and stat cards hidden, since the
 * page-level header and bucket nav already sit above the tabs.
 */
@Component({
  selector: 'app-task-follow-ups',
  standalone: true,
  imports: [MatTabsModule, PageHeaderComponent, TaskBucketNavComponent, TasksComponent],
  templateUrl: './task-follow-ups.component.html',
  styleUrl: './task-follow-ups.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFollowUpsComponent {}
