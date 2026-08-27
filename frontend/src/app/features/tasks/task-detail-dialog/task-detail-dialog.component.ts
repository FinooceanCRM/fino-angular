import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Task, TaskDisplayStatus, TaskTimelineEntry } from '@core/models/task.model';
import { ModalComponent } from '@shared/components/modal.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

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

  protected readonly statusLabel = STATUS_LABEL[this.data.task.display_status];
  protected readonly statusColour = STATUS_COLOUR[this.data.task.display_status];
  protected readonly priorityLabel = PRIORITY_LABEL[this.data.task.priority];
  protected readonly priorityColour = PRIORITY_COLOUR[this.data.task.priority];

  protected readonly entries: TimelineEntry[] = timelineFor(this.data.task).map((entry) => ({
    icon: entry.icon,
    title: entry.title,
    subtitle: entry.subtitle,
    time: entry.time,
  }));
}

/**
 * Synthesises a small activity timeline (created → due/completed/cancelled)
 * for the task detail dialog. Purely presentational — no backend endpoint
 * for this, same as the mock `TaskDataProvider.timelineFor()` it replaces.
 */
function timelineFor(task: Task): TaskTimelineEntry[] {
  const entries: TaskTimelineEntry[] = [
    { icon: 'add_circle', title: 'Created', subtitle: task.related_to, time: formatTime(task.created_at) },
  ];

  if (task.status === 'completed' && task.completed_at) {
    entries.push({ icon: 'task_alt', title: 'Marked complete', subtitle: null, time: formatTime(task.completed_at) });
  } else if (task.status === 'cancelled') {
    entries.push({ icon: 'cancel', title: 'Cancelled', subtitle: null, time: formatTime(task.created_at) });
  } else {
    entries.push({ icon: 'event', title: `Due ${formatDate(task.due_at)}`, subtitle: null, time: formatTime(task.due_at) });
  }

  return entries;
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
}

function formatTime(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';
}
