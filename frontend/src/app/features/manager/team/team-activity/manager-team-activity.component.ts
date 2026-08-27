import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

import { AUDIT_EVENT_CATEGORY_ICON } from '@core/models/audit-log.model';

import { ManagerTeamDataProvider } from '../data/manager-team-data.provider';

/** Activity tracking — the platform audit trail, filtered to the given team members. */
@Component({
  selector: 'app-manager-team-activity',
  standalone: true,
  imports: [MatCardModule, EmptyStateComponent, TimelineComponent],
  templateUrl: './manager-team-activity.component.html',
  styleUrl: './manager-team-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerTeamActivityComponent {
  readonly names = input.required<string[]>();

  private readonly team = inject(ManagerTeamDataProvider);

  protected readonly entries = computed<TimelineEntry[]>(() =>
    this.team.activityFor(this.names()).map((entry) => ({
      icon: AUDIT_EVENT_CATEGORY_ICON[entry.category],
      title: `${entry.actor_name} ${entry.action} ${entry.entity_type.toLowerCase()} — ${entry.entity_label}`,
      subtitle: entry.description,
      time: new Date(entry.timestamp).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    })),
  );
}
