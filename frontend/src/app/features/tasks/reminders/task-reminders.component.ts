import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TasksComponent } from '../tasks.component';

@Component({
  selector: 'app-task-reminders',
  standalone: true,
  imports: [TasksComponent],
  template: `<app-tasks type="reminder" title="Reminders" subtitle="Time-sensitive nudges you set for yourself." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskRemindersComponent {}
