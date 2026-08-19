import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TrendPoint } from '../../data/models/report.model';

export type { TrendPoint };

interface PlottedPoint extends TrendPoint {
  x: number;
  y: number;
}

const VIEW_WIDTH = 320;
const TOP = 12;
const BOTTOM = 108;
const MARGIN = 10;

/**
 * Reusable single-series trend line — area fill, faint grid, emphasised
 * endpoint, native tooltips on each point. Coordinates are derived from
 * whatever `points` is passed in; nothing here fetches or stores data.
 */
@Component({
  selector: 'app-trend-chart',
  standalone: true,
  templateUrl: './trend-chart.component.html',
  styleUrl: './trend-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendChartComponent {
  readonly points = input.required<TrendPoint[]>();
  readonly accent = input<'primary' | 'tertiary'>('primary');
  readonly valuePrefix = input('');

  protected readonly accentVar = computed(() =>
    this.accent() === 'tertiary' ? 'var(--mat-sys-tertiary)' : 'var(--mat-sys-primary)',
  );

  protected readonly plotted = computed<PlottedPoint[]>(() => {
    const data = this.points();
    if (data.length === 0) {
      return [];
    }

    const values = data.map((point) => point.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = max - min || 1;
    const usableWidth = VIEW_WIDTH - MARGIN * 2;
    const step = data.length > 1 ? usableWidth / (data.length - 1) : 0;

    return data.map((point, index) => ({
      ...point,
      x: MARGIN + index * step,
      y: BOTTOM - ((point.value - min) / range) * (BOTTOM - TOP),
    }));
  });

  protected readonly linePath = computed(() =>
    this.plotted()
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
      .join(' '),
  );

  protected readonly areaPath = computed(() => {
    const points = this.plotted();
    if (points.length === 0) {
      return '';
    }
    const first = points[0];
    const last = points[points.length - 1];
    return `${this.linePath()} L${last.x},116 L${first.x},116 Z`;
  });
}
