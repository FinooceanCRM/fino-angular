import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { StatCardComponent } from '@shared/components/stat-card.component';

import { ManagerTeamDataProvider } from '../data/manager-team-data.provider';

/** Individual performance stat cards, embedded on the Employee/RM "View page". */
@Component({
  selector: 'app-manager-team-performance-cards',
  standalone: true,
  imports: [StatCardComponent],
  template: `
    <div class="performance-cards">
      <app-stat-card icon="assignment_turned_in" [value]="performance().leadsHandled" label="Leads handled" accent="primary" />
      <app-stat-card icon="task_alt" [value]="performance().approved" label="Approved" accent="accent" />
      <app-stat-card icon="paid" [value]="performance().disbursed" label="Disbursed" />
      <app-stat-card icon="percent" [value]="performance().conversionRatePct + '%'" label="Conversion rate" />
      <app-stat-card icon="schedule" [value]="performance().avgTurnaroundDays + ' days'" label="Avg. turnaround" />
    </div>
  `,
  styles: [
    `
      .performance-cards {
        display: grid;
        gap: var(--app-space-4);
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerTeamPerformanceCardsComponent {
  readonly userId = input.required<number>();

  private readonly team = inject(ManagerTeamDataProvider);

  protected readonly performance = computed(() => this.team.performanceFor(this.userId()));
}
