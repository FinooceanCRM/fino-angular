import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Lead, LeadStatusHistoryEntry } from '@core/models/lead.model';
import { LeadService } from '@core/services/lead.service';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { EntityHeaderComponent } from '@shared/components/entity-header.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

import { STATUS_STEP_ICON } from '../../data/models/lead-catalogue.model';

/** Lead Timeline — the full status-change history for one lead, from the real `leads/:id` endpoint. */
@Component({
  selector: 'app-manager-lead-timeline',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    EmptyStateComponent,
    EntityHeaderComponent,
    TimelineComponent,
  ],
  templateUrl: './manager-lead-timeline.component.html',
  styleUrl: './manager-lead-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerLeadTimelineComponent {
  readonly basePath = input('/manager/leads');

  private readonly route = inject(ActivatedRoute);
  private readonly leads = inject(LeadService);

  private readonly leadId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly lead = signal<Lead | undefined>(undefined);
  private readonly statusHistory = signal<LeadStatusHistoryEntry[]>([]);

  protected readonly entries = computed<TimelineEntry[]>(() =>
    this.statusHistory().map((entry) => ({
      icon: STATUS_STEP_ICON[entry.to_status] ?? 'track_changes',
      title: entry.to_status
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      subtitle: [entry.remarks, entry.changed_by ? `by ${entry.changed_by}` : null].filter(Boolean).join(' — '),
      time: entry.created_at
        ? new Date(entry.created_at).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : null,
    })),
  );

  constructor() {
    this.leads.detail(this.leadId).subscribe({
      next: (detail) => {
        this.lead.set(detail.lead);
        this.statusHistory.set(detail.status_history);
      },
      error: () => this.lead.set(undefined),
    });
  }
}
