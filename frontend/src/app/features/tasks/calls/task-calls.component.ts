import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TasksComponent } from '../tasks.component';

@Component({
  selector: 'app-task-calls',
  standalone: true,
  imports: [TasksComponent],
  template: `<app-tasks type="call" title="Calls" subtitle="Calls to make or that have been logged." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCallsComponent {}
