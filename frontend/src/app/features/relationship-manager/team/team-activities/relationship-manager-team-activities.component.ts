import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

import { AUDIT_EVENT_CATEGORY_ICON } from '@features/super-admin/data/models/audit-log.model';
import { AuditLogDataProvider } from '@features/super-admin/data/providers/audit-log-data.provider';
import { ManagerLeadDataProvider } from '@features/manager/leads/data/providers/lead-data.provider';

import { currentRmId } from '../../leads/current-rm';
import { RelationshipManagerActivityDataProvider } from '../../activities/data/relationship-manager-activity.provider';

const ACTIVITY_TYPE_ICON: Record<string, string> = {
  call: 'call',
  meeting: 'groups',
  task: 'checklist',
  reminder: 'notifications_active',
};

/** Employee Activities — the platform audit trail plus the RM's own scheduled items, both filtered to this RM's employees. */
@Component({
  selector: 'app-relationship-manager-team-activities',
  standalone: true,
  imports: [EmptyStateComponent, TimelineComponent],
  templateUrl: './relationship-manager-team-activities.component.html',
  styleUrl: './relationship-manager-team-activities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerTeamActivitiesComponent {
  private readonly leadData = inject(ManagerLeadDataProvider);
  private readonly auditLog = inject(AuditLogDataProvider);
  private readonly rmActivities = inject(RelationshipManagerActivityDataProvider);
  private readonly rmId = currentRmId();

  private readonly employeeNames = computed(() =>
    this.leadData.employeesOfRm(this.rmId ?? 0).map((employee) => employee.name),
  );

  protected readonly entries = computed<TimelineEntry[]>(() => {
    const names = new Set(this.employeeNames());

    const auditEntries = this.auditLog
      .entries()
      .filter((entry) => names.has(entry.actor_name))
      .map((entry) => ({
        icon: AUDIT_EVENT_CATEGORY_ICON[entry.category],
        title: `${entry.actor_name} ${entry.action} ${entry.entity_type.toLowerCase()} — ${entry.entity_label}`,
        subtitle: entry.description,
        time: entry.timestamp,
      }));

    const scheduledEntries = this.rmActivities
      .activities()
      .filter((activity) => names.has(activity.assignedTo))
      .map((activity) => ({
        icon: ACTIVITY_TYPE_ICON[activity.type] ?? 'event',
        title: `${activity.assignedTo} — ${activity.title}`,
        subtitle: activity.relatedTo,
        time: activity.dueAt,
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
