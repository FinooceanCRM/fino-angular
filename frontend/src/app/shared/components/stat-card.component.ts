import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export type StatCardAccent = 'primary' | 'accent' | 'warn' | 'default';

/**
 * Single statistic tile (icon + value + label), matching the `.metric` cards
 * already used on the role dashboards.
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="stat-card" [class]="'accent-' + accent()">
      <mat-card-content>
        <mat-icon>{{ icon() }}</mat-icon>
        <span class="value">{{ value() }}</span>
        <span class="label">{{ label() }}</span>
        @if (trend()) {
          <span class="trend">{{ trend() }}</span>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .stat-card mat-card-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
      .value {
        font-size: 2rem;
        font-weight: 600;
        line-height: 1;
      }
      .label {
        opacity: 0.75;
      }
      .trend {
        font-size: 0.75rem;
        opacity: 0.6;
      }
      .accent-primary mat-icon {
        color: var(--mat-sys-primary);
      }
      .accent-accent mat-icon {
        color: var(--mat-sys-tertiary);
      }
      .accent-warn mat-icon {
        color: var(--mat-sys-error);
      }
    `,
  ],
})
export class StatCardComponent {
  readonly icon = input('insights');
  readonly value = input<string | number>('0');
  readonly label = input('');
  readonly trend = input<string | undefined>(undefined);
  readonly accent = input<StatCardAccent>('default');
}
