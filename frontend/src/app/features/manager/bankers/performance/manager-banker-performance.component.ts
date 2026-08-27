import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';

import { BankerPerformance, ManagerBankerDataProvider } from '../data/manager-banker.provider';

interface RankedBankerPerformance extends BankerPerformance {
  id: number;
  name: string;
  bank: string;
}

/** Banker Performance — ranks the bankers engaged with the manager's leads, using real counts from the manager's real leads (`ManagerLeadsDataProvider`). */
@Component({
  selector: 'app-manager-banker-performance',
  standalone: true,
  imports: [MatCardModule, EmptyStateComponent, PageHeaderComponent, StatCardComponent],
  templateUrl: './manager-banker-performance.component.html',
  styleUrl: './manager-banker-performance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerBankerPerformanceComponent {
  private readonly bankers = inject(ManagerBankerDataProvider);

  protected readonly ranked = computed<RankedBankerPerformance[]>(() =>
    this.bankers
      .assignedBankers()
      .map(({ banker }) => ({
        id: banker.id,
        name: banker.name,
        bank: this.bankers.bankNameFor(banker.id),
        ...this.bankers.performanceFor(banker.id),
      }))
      .sort((a, b) => b.leadsHandled - a.leadsHandled),
  );

  protected readonly totals = computed(() => {
    const rows = this.ranked();
    return {
      leadsHandled: rows.reduce((sum, row) => sum + row.leadsHandled, 0),
      disbursed: rows.reduce((sum, row) => sum + row.disbursed, 0),
      avgConversion:
        rows.length === 0 ? 0 : Math.round(rows.reduce((sum, row) => sum + row.conversionRatePct, 0) / rows.length),
    };
  });
}
