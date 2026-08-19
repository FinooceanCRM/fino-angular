import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TasksComponent } from '../tasks.component';

@Component({
  selector: 'app-task-meetings',
  standalone: true,
  imports: [TasksComponent],
  template: `<app-tasks type="meeting" title="Meetings" subtitle="Scheduled and completed meetings." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskMeetingsComponent {}
