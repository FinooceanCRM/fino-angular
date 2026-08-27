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
import { RouterLink } from '@angular/router';

import { Task, TaskActivityType, TaskCounts, TaskDisplayStatus } from '@core/models/task.model';
import { TaskService } from '@core/services/task.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import {
  ActivityFormDialogData,
  RelationshipManagerActivityFormDialogComponent,
} from '../activity-form-dialog/relationship-manager-activity-form-dialog.component';
import {
  RelationshipManagerRescheduleDialogComponent,
  RescheduleDialogResult,
} from '../reschedule-dialog/relationship-manager-reschedule-dialog.component';

const TYPE_META: Record<TaskActivityType, { label: string; icon: string }> = {
  call: { label: 'call', icon: 'call' },
  meeting: { label: 'meeting', icon: 'groups' },
  task: { label: 'task', icon: 'checklist' },
  reminder: { label: 'reminder', icon: 'notifications_active' },
};

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

/**
 * Shared list for one activity bucket (Calls / Meetings / Tasks / Reminders)
 * — same shape reused across all four, the same pattern as the Approval
 * Center's `ManagerApprovalListComponent`. Backed by the real `TaskService`
 * (Phase 4): the RM Activities tabs are a filtered view over the same Tasks
 * API as the Tasks module, scoped to the RM's own team via
 * `assigned_to: 'team'` (their employees) — not a separate feature.
 */
@Component({
  selector: 'app-relationship-manager-activity-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    StatCardComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './relationship-manager-activity-list.component.html',
  styleUrl: './relationship-manager-activity-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerActivityListComponent {
  readonly type = input.required<TaskActivityType>();

  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly typeMeta = computed(() => TYPE_META[this.type()]);

  protected readonly tasks = signal<Task[]>([]);

  protected readonly counts = computed<TaskCounts>(() => {
    const rows = this.tasks();
    return {
      open: rows.filter((task) => task.status === 'pending').length,
      overdue: rows.filter((task) => task.display_status === 'overdue').length,
      dueToday: rows.filter((task) => task.display_status === 'due_today').length,
      completed: rows.filter((task) => task.status === 'completed').length,
    };
  });

  protected readonly statusFilter = signal<'open' | 'all'>('open');

  protected readonly rows = computed(() => {
    const all = this.tasks();
    return this.statusFilter() === 'open' ? all.filter((task) => task.status === 'pending') : all;
  });

  protected readonly columns: TableColumn<Task>[] = [
    { key: 'title', label: 'Title' },
    { key: 'related_to', label: 'Related to' },
    { key: 'due_at', label: 'Due' },
    { key: 'assigned_to', label: 'Assigned to', formatter: (row) => row.assigned_to?.name ?? '—' },
    { key: 'status', label: 'Status' },
  ];

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.taskService.list({ type: this.type(), assigned_to: 'team', per_page: 200 }).subscribe({
      next: (page) => this.tasks.set(page.items),
      error: () => this.snackBar.open('Could not load activities.', 'Dismiss', { duration: 4000 }),
    });
  }

  protected statusLabel(task: Task): string {
    return STATUS_LABEL[task.display_status];
  }

  protected statusColour(task: Task): string {
    return STATUS_COLOUR[task.display_status];
  }

  protected schedule(): void {
    this.dialog
      .open<RelationshipManagerActivityFormDialogComponent, ActivityFormDialogData>(
        RelationshipManagerActivityFormDialogComponent,
        { data: { type: this.type() } },
      )
      .afterClosed()
      .subscribe((draft) => {
        if (!draft) {
          return;
        }

        this.taskService.create(draft).subscribe({
          next: () => {
            this.snackBar.open(`"${draft.title}" scheduled.`, 'Dismiss', { duration: 4000 });
            this.reload();
          },
          error: () => this.snackBar.open('Could not schedule.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  protected complete(row: Task): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Mark complete', message: `Mark "${row.title}" as complete?`, confirmLabel: 'Mark complete' },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.taskService.complete(row.id).subscribe({
          next: () => {
            this.snackBar.open('Marked complete.', 'Dismiss', { duration: 4000 });
            this.reload();
          },
          error: () => this.snackBar.open('Could not update.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  protected reschedule(row: Task): void {
    this.dialog
      .open<RelationshipManagerRescheduleDialogComponent, unknown, RescheduleDialogResult>(
        RelationshipManagerRescheduleDialogComponent,
        { data: { title: row.title, currentDueAt: row.due_at } },
      )
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.taskService.reschedule(row.id, result.dueAt).subscribe({
          next: () => {
            this.snackBar.open('Rescheduled.', 'Dismiss', { duration: 4000 });
            this.reload();
          },
          error: () => this.snackBar.open('Could not reschedule.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  protected cancel(row: Task): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Cancel',
          message: `Cancel "${row.title}"?`,
          confirmLabel: 'Cancel item',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.taskService.cancel(row.id).subscribe({
          next: () => {
            this.snackBar.open('Cancelled.', 'Dismiss', { duration: 4000 });
            this.reload();
          },
          error: () => this.snackBar.open('Could not cancel.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
