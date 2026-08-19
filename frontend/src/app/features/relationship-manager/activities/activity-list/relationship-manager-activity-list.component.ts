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
  Activity,
  ActivityDisplayStatus,
  ActivityType,
  RelationshipManagerActivityDataProvider,
} from '../data/relationship-manager-activity.provider';
import {
  RelationshipManagerRescheduleDialogComponent,
  RescheduleDialogResult,
} from '../reschedule-dialog/relationship-manager-reschedule-dialog.component';

const TYPE_META: Record<ActivityType, { label: string; icon: string }> = {
  call: { label: 'call', icon: 'call' },
  meeting: { label: 'meeting', icon: 'groups' },
  task: { label: 'task', icon: 'checklist' },
  reminder: { label: 'reminder', icon: 'notifications_active' },
};

const STATUS_LABEL: Record<ActivityDisplayStatus, string> = {
  overdue: 'Overdue',
  due_today: 'Due today',
  upcoming: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLOUR: Record<ActivityDisplayStatus, string> = {
  overdue: 'warn',
  due_today: 'accent',
  upcoming: 'primary',
  completed: 'success',
  cancelled: 'default',
};

/**
 * Shared list for one activity bucket (Calls / Meetings / Tasks / Reminders)
 * — same shape reused across all four, the same pattern as the Approval
 * Center's `ManagerApprovalListComponent`. Backed entirely by
 * `RelationshipManagerActivityDataProvider`'s mock state.
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
  readonly type = input.required<ActivityType>();

  protected readonly activities = inject(RelationshipManagerActivityDataProvider);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly typeMeta = computed(() => TYPE_META[this.type()]);
  protected readonly counts = computed(() => this.activities.counts(this.type()));

  protected readonly statusFilter = signal<'open' | 'all'>('open');

  protected readonly rows = computed(() => {
    const all = this.activities.byType(this.type());
    return this.statusFilter() === 'open' ? all.filter((a) => a.status === 'pending') : all;
  });

  protected readonly columns: TableColumn<Activity>[] = [
    { key: 'title', label: 'Title' },
    { key: 'relatedTo', label: 'Related to' },
    { key: 'dueAt', label: 'Due' },
    { key: 'assignedTo', label: 'Assigned to' },
    { key: 'status', label: 'Status' },
  ];

  protected statusLabel(activity: Activity): string {
    return STATUS_LABEL[this.activities.displayStatus(activity)];
  }

  protected statusColour(activity: Activity): string {
    return STATUS_COLOUR[this.activities.displayStatus(activity)];
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

        this.activities.create(this.type(), draft);
        this.snackBar.open(`"${draft.title}" scheduled.`, 'Dismiss', { duration: 4000 });
      });
  }

  protected complete(row: Activity): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Mark complete', message: `Mark "${row.title}" as complete?`, confirmLabel: 'Mark complete' },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.activities.complete(row.id);
        this.snackBar.open('Marked complete.', 'Dismiss', { duration: 4000 });
      });
  }

  protected reschedule(row: Activity): void {
    this.dialog
      .open<RelationshipManagerRescheduleDialogComponent, unknown, RescheduleDialogResult>(
        RelationshipManagerRescheduleDialogComponent,
        { data: { title: row.title, currentDueAt: row.dueAt } },
      )
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.activities.reschedule(row.id, result.dueAt, result.notes);
        this.snackBar.open('Rescheduled.', 'Dismiss', { duration: 4000 });
      });
  }

  protected cancel(row: Activity): void {
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

        this.activities.cancel(row.id);
        this.snackBar.open('Cancelled.', 'Dismiss', { duration: 4000 });
      });
  }
}
