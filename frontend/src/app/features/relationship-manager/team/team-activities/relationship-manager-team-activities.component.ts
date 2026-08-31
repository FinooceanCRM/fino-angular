import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

import { AUDIT_EVENT_CATEGORY_ICON, AuditLogEntry } from '@core/models/audit-log.model';
import { ManagedUser } from '@core/models/user.model';
import { Task } from '@core/models/task.model';
import { AuditLogService } from '@core/services/audit-log.service';
import { TaskService } from '@core/services/task.service';
import { UserService } from '@core/services/user.service';

const ACTIVITY_TYPE_ICON: Record<string, string> = {
  call: 'call',
  meeting: 'groups',
  task: 'checklist',
  reminder: 'notifications_active',
};

/**
 * Employee Activities — the platform audit trail plus the RM's own team
 * tasks (Phase 4: real `TaskService`, `assigned_to: 'team'` — same scoping
 * as the Activities tabs), both filtered to this RM's employees.
 */
@Component({
  selector: 'app-relationship-manager-team-activities',
  standalone: true,
  imports: [MatCardModule, EmptyStateComponent, TimelineComponent],
  templateUrl: './relationship-manager-team-activities.component.html',
  styleUrl: './relationship-manager-team-activities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerTeamActivitiesComponent {
  private readonly auditLog = inject(AuditLogService);
  private readonly taskService = inject(TaskService);
  private readonly userService = inject(UserService);

  private readonly employees = signal<ManagedUser[]>([]);
  private readonly employeeNames = computed(() => this.employees().map((employee) => employee.name));

  private readonly teamTasks = signal<Task[]>([]);
  private readonly auditEntries = signal<AuditLogEntry[]>([]);

  constructor() {
    // GET /users is already scoped server-side to this RM's own employees.
    this.userService.list({ role: 'employee', perPage: 200 }).subscribe({
      next: (employees) => this.employees.set(employees),
      error: () => this.employees.set([]),
    });

    this.taskService.list({ assigned_to: 'team', per_page: 200 }).subscribe({
      next: (page) => this.teamTasks.set(page.items),
      error: () => this.teamTasks.set([]),
    });

    this.auditLog.list({ per_page: 200 }).subscribe({
      next: (result) => this.auditEntries.set(result.items),
      error: () => this.auditEntries.set([]),
    });
  }

  protected readonly entries = computed<TimelineEntry[]>(() => {
    const names = new Set(this.employeeNames());

    const auditEntries = this.auditEntries()
      .filter((entry) => names.has(entry.actor_name))
      .map((entry) => ({
        icon: AUDIT_EVENT_CATEGORY_ICON[entry.category],
        title: `${entry.actor_name} ${entry.action} ${entry.entity_type.toLowerCase()} — ${entry.entity_label}`,
        subtitle: entry.description,
        time: entry.timestamp,
      }));

    const scheduledEntries = this.teamTasks()
      .filter((task) => task.assigned_to && names.has(task.assigned_to.name))
      .map((task) => ({
        icon: ACTIVITY_TYPE_ICON[task.type] ?? 'event',
        title: `${task.assigned_to!.name} — ${task.title}`,
        subtitle: task.related_to,
        time: task.due_at,
      }));

    return [...auditEntries, ...scheduledEntries]
      .sort((a, b) => new Date(b.time!).getTime() - new Date(a.time!).getTime())
      .map((entry) => ({
        ...entry,
        time: new Date(entry.time!).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
  });
}
