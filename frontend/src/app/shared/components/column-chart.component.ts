import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { BarDatum } from './horizontal-bar-list.component';

export type { BarDatum };

/**
 * Reusable vertical column breakdown (a value per month/day bucket — loans
 * by month, activity by day of week). Sibling to `HorizontalBarListComponent`
 * — same `BarDatum` shape, same pure-presentation contract — just plotted
 * as columns instead of rows for time-series-shaped data.
 */
@Component({
  selector: 'app-column-chart',
  standalone: true,
  templateUrl: './column-chart.component.html',
  styleUrl: './column-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnChartComponent {
  readonly data = input.required<BarDatum[]>();

  protected readonly bars = computed(() => {
    const items = this.data();
    const max = Math.max(1, ...items.map((item) => item.value));
    return items.map((item) => ({
      ...item,
      percent: Math.round((item.value / max) * 100),
    }));
  });
}
