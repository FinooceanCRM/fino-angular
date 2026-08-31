import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export type StatCardAccent = 'primary' | 'secondary' | 'accent' | 'warn' | 'success' | 'default';

/**
 * Single KPI tile (icon-in-a-tinted-circle + value + label + optional
 * trend), matching the stat tiles used across every dashboard mockup.
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly icon = input('insights');
  readonly value = input<string | number>('0');
  readonly label = input('');
  readonly trend = input<string | undefined>(undefined);
  readonly accent = input<StatCardAccent>('default');
}
