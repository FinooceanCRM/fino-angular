import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
  colour?: string;
}

/**
 * Reusable horizontal bar breakdown (categorical magnitude — status, role,
 * loan type, payee). Pure presentation: percentages are computed from
 * whatever `data` is passed in, nothing is fetched or mutated here. Shared
 * across report pages and every role dashboard's "X by status"-style card.
 */
@Component({
  selector: 'app-horizontal-bar-list',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './horizontal-bar-list.component.html',
  styleUrl: './horizontal-bar-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorizontalBarListComponent {
  readonly data = input.required<BarDatum[]>();
  readonly valuePrefix = input('');

  protected readonly bars = computed(() => {
    const items = this.data();
    const max = Math.max(1, ...items.map((item) => item.value));
    return items.map((item) => ({
      ...item,
      percent: Math.round((item.value / max) * 100),
    }));
  });
}
