import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ModalComponent } from '@shared/components/modal.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

import { Task, TaskDataProvider, TaskDisplayStatus } from '../data/task.provider';

export interface TaskDetailDialogData {
  task: Task;
}

const STATUS_LABEL: Record<TaskDisplayStatus, string> = {
  overdue: 'Overdue',
  due_today: 'Due today',
  upcoming: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLOUR: Record<TaskDisplayStatus, string> = {
  overdue: 'warn',
  due_today: 'accent',
  upcoming: 'primary',
  completed: 'success',
  cancelled: 'default',
};

const PRIORITY_LABEL: Record<Task['priority'], string> = { low: 'Low priority', medium: 'Medium priority', high: 'High priority' };
const PRIORITY_COLOUR: Record<Task['priority'], string> = { low: 'default', medium: 'accent', high: 'warn' };

/** Read-only task detail: status, priority, notes and a synthesised activity timeline. */
@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [MatButtonModule, ModalComponent, StatusPillComponent, TimelineComponent],
  template: `
    <app-modal [title]="data.task.title" [showActions]="true">
      <div class="badges">
        <app-status-pill [label]="statusLabel" [colour]="statusColour" />
        <app-status-pill [label]="priorityLabel" [colour]="priorityColour" />
      </div>

      @if (data.task.description) {
        <p class="description">{{ data.task.description }}</p>
      }

      <h3 class="section-title">Activity</h3>
      <app-timeline [entries]="entries" />

      <button modal-actions mat-button type="button" (click)="dialogRef.close()">Close</button>
    </app-modal>
  `,
  styles: [
    `
      .badges {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .description {
        font-size: 0.88rem;
        color: var(--app-status-default-fg);
        margin: 0 0 1rem;
      }
      .section-title {
        font-size: 0.88rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailDialogComponent {
  protected readonly data = inject<TaskDetailDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<TaskDetailDialogComponent>);
  private readonly tasks = inject(TaskDataProvider);

  protected readonly statusLabel = STATUS_LABEL[this.tasks.displayStatus(this.data.task)];
  protected readonly statusColour = STATUS_COLOUR[this.tasks.displayStatus(this.data.task)];
  protected readonly priorityLabel = PRIORITY_LABEL[this.data.task.priority];
  protected readonly priorityColour = PRIORITY_COLOUR[this.data.task.priority];

  protected readonly entries: TimelineEntry[] = this.tasks.timelineFor(this.data.task).map((entry) => ({
    icon: entry.icon,
    title: entry.title,
    subtitle: entry.subtitle,
    time: entry.time,
  }));
}
