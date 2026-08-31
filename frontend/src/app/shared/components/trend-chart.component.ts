import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let nextGradientId = 0;

export interface TrendPoint {
  label: string;
  value: number;
}

interface PlottedPoint extends TrendPoint {
  x: number;
  y: number;
}

const VIEW_WIDTH = 320;
const TOP = 12;
const BOTTOM = 108;
const MARGIN = 10;

/**
 * Reusable single-series trend line — gradient area fill, faint grid,
 * emphasised endpoint, native tooltips on each point. Coordinates are
 * derived from whatever `points` is passed in; nothing here fetches or
 * stores data. Shared across report pages and every role dashboard's
 * trend card (commission, disbursal, match-rate, completion-rate, …).
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
  readonly accent = input<'primary' | 'secondary'>('primary');
  readonly valuePrefix = input('');

  /** Unique per instance so multiple charts on one page don't share a `<linearGradient id>`. */
  protected readonly gradientId = `trend-chart-gradient-${nextGradientId++}`;

  protected readonly accentVar = computed(() =>
    this.accent() === 'secondary' ? 'var(--tide-color-secondary)' : 'var(--tide-color-primary)',
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
