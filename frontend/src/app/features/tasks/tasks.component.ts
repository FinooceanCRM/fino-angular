import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageEvent } from '@angular/material/paginator';

import { RelationshipManagerRescheduleDialogComponent, RescheduleDialogResult } from '@features/relationship-manager/activities/reschedule-dialog/relationship-manager-reschedule-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { TaskBucketNavComponent } from './task-bucket-nav/task-bucket-nav.component';
import { Task, TaskActivityType, TaskDataProvider, TaskDisplayStatus, TaskPriority } from './data/task.provider';
import { TaskDetailDialogComponent } from './task-detail-dialog/task-detail-dialog.component';
import { TaskFormDialogComponent, TaskFormDialogData } from './task-form-dialog/task-form-dialog.component';

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

const PRIORITY_LABEL: Record<TaskPriority, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const PRIORITY_COLOUR: Record<TaskPriority, string> = { low: 'default', medium: 'accent', high: 'warn' };

const TYPE_ICON: Record<TaskActivityType, string> = { call: 'call', meeting: 'groups', task: 'checklist', reminder: 'notifications_active' };
const TYPE_LABEL: Record<TaskActivityType, string> = { call: 'Call', meeting: 'Meeting', task: 'Task', reminder: 'Reminder' };

/**
 * Tasks — your to-dos across leads and customers: Calls, Meetings, Tasks and
 * Reminders. Backed entirely by `TaskDataProvider`'s mock state, following
 * the same list + toolbar + `app-table` + dialogs shape as the Relationship
 * Manager module's Activity lists. Parameterized by `type` so the same
 * component serves the "All" page, the Calls/Meetings/Reminders bucket
 * pages, and — with header and stats hidden — the four tabs on Follow-ups.
 * The reschedule dialog is reused directly from the RM module rather than
 * duplicated, since its logic has no RM-specific coupling.
 */
@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatCardComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
    TaskBucketNavComponent,
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksComponent {
  readonly type = input<TaskActivityType | null>(null);
  readonly title = input('Tasks');
  readonly subtitle = input('Your to-dos across leads and customers.');
  readonly showHeader = input(true);
  readonly showStats = input(true);

  protected readonly taskData = inject(TaskDataProvider);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly counts = computed(() => this.taskData.counts(this.type()));

  protected readonly statusFilter = signal<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  protected readonly priorityFilter = signal<'all' | TaskPriority>('all');
  protected readonly dueFilter = signal<'all' | TaskDisplayStatus>('all');

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  protected readonly filteredTasks = computed(() => {
    const type = this.type();
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    const due = this.dueFilter();

    const base = type ? this.taskData.byType(type) : this.taskData.tasks();

    return base.filter((task) => {
      const matchesStatus = status === 'all' || task.status === status;
      const matchesPriority = priority === 'all' || task.priority === priority;
      const matchesDue = due === 'all' || this.taskData.displayStatus(task) === due;
      return matchesStatus && matchesPriority && matchesDue;
    });
  });

  protected readonly pagedTasks = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredTasks().slice(start, start + this.pageSize());
  });

  protected readonly columns = computed<TableColumn<Task>[]>(() => [
    ...(this.type() === null ? [{ key: 'type', label: 'Type' }] : []),
    { key: 'title', label: 'Title' },
    { key: 'relatedTo', label: 'Related to' },
    { key: 'priority', label: 'Priority' },
    { key: 'dueAt', label: 'Due' },
    { key: 'status', label: 'Status' },
  ]);

  protected typeIcon(task: Task): string {
    return TYPE_ICON[task.type];
  }

  protected typeLabel(task: Task): string {
    return TYPE_LABEL[task.type];
  }

  protected statusLabel(task: Task): string {
    return STATUS_LABEL[this.taskData.displayStatus(task)];
  }

  protected statusColour(task: Task): string {
    return STATUS_COLOUR[this.taskData.displayStatus(task)];
  }

  protected priorityLabel(task: Task): string {
    return PRIORITY_LABEL[task.priority];
  }

  protected priorityColour(task: Task): string {
    return PRIORITY_COLOUR[task.priority];
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  protected newTask(): void {
    const data: TaskFormDialogData = { type: this.type() ?? 'task' };

    this.dialog
      .open<TaskFormDialogComponent, TaskFormDialogData>(TaskFormDialogComponent, { data })
      .afterClosed()
      .subscribe((draft) => {
        if (!draft) {
          return;
        }

        this.taskData.create(draft);
        this.snackBar.open(`"${draft.title}" added.`, 'Dismiss', { duration: 4000 });
      });
  }

  protected view(task: Task): void {
    this.dialog.open(TaskDetailDialogComponent, { data: { task } });
  }

  protected complete(task: Task): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Mark complete', message: `Mark "${task.title}" as complete?`, confirmLabel: 'Mark complete' },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.taskData.complete(task.id);
        this.snackBar.open('Marked complete.', 'Dismiss', { duration: 4000 });
      });
  }

  protected reschedule(task: Task): void {
    this.dialog
      .open<RelationshipManagerRescheduleDialogComponent, unknown, RescheduleDialogResult>(
        RelationshipManagerRescheduleDialogComponent,
        { data: { title: task.title, currentDueAt: task.dueAt } },
      )
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.taskData.reschedule(task.id, result.dueAt);
        this.snackBar.open('Rescheduled.', 'Dismiss', { duration: 4000 });
      });
  }

  protected cancel(task: Task): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Cancel task', message: `Cancel "${task.title}"?`, confirmLabel: 'Cancel task', danger: true },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.taskData.cancel(task.id);
        this.snackBar.open('Cancelled.', 'Dismiss', { duration: 4000 });
      });
  }
}
