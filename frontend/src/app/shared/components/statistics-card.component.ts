import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { StatCardAccent } from './stat-card.component';

export interface StatBreakdownItem {
  label: string;
  value: number;
  colour?: string;
}

/**
 * Analytics tile — a headline value plus an embedded mini-breakdown.
 * Deliberately distinct from `StatCardComponent` (a flat single-number
 * KPI tile): this is for the case where the number alone isn't the whole
 * story and a compact proportional breakdown belongs right on the card
 * (e.g. "342 leads" broken down by status, right there, no separate chart).
 */
@Component({
  selector: 'app-statistics-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="statistics-card" [class]="'statistics-card--' + accent()">
      <mat-card-content class="statistics-card__content">
        <div class="statistics-card__header">
          <span class="statistics-card__icon">
            <mat-icon>{{ icon() }}</mat-icon>
          </span>
          <div class="statistics-card__headline">
            <span class="statistics-card__value">{{ value() }}</span>
            <span class="statistics-card__title">{{ title() }}</span>
          </div>
        </div>

        @if (subtitle()) {
          <p class="statistics-card__subtitle">{{ subtitle() }}</p>
        }

        @if (bars().length > 0) {
          <div class="statistics-card__breakdown">
            @for (bar of bars(); track bar.label) {
              <div class="statistics-card__row">
                <span class="statistics-card__row-label">{{ bar.label }}</span>
                <div class="statistics-card__track">
                  <div
                    class="statistics-card__fill"
                    [style.width.%]="bar.percent"
                    [style.background]="bar.colour ?? 'var(--mat-sys-primary)'"
                  ></div>
                </div>
                <span class="statistics-card__row-value">{{ bar.value }}</span>
              </div>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styleUrl: './statistics-card.component.scss',
})
export class StatisticsCardComponent {
  readonly icon = input('insights');
  readonly title = input.required<string>();
  readonly value = input<string | number>('0');
  readonly subtitle = input<string | undefined>(undefined);
  readonly breakdown = input<StatBreakdownItem[]>([]);
  readonly accent = input<StatCardAccent>('default');

  protected readonly bars = computed(() => {
    const items = this.breakdown();
    const max = Math.max(1, ...items.map((item) => item.value));
    return items.map((item) => ({ ...item, percent: Math.round((item.value / max) * 100) }));
  });
}
