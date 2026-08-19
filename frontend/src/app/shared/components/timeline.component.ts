import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface TimelineEntry {
  icon: string;
  title: string;
  subtitle?: string | null;
  time?: string | null;
}

/**
 * Connected icon timeline for chronological entries (status history, recent
 * activity, audit trails). One shared visual pattern instead of every page
 * re-implementing its own list styling.
 */
@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="timeline">
      @for (entry of entries(); track $index) {
        <li class="timeline__item">
          <span class="timeline__icon">
            <mat-icon>{{ entry.icon }}</mat-icon>
          </span>
          <span class="timeline__body">
            <span class="timeline__title">{{ entry.title }}</span>
            @if (entry.subtitle) {
              <span class="timeline__subtitle">{{ entry.subtitle }}</span>
            }
          </span>
          @if (entry.time) {
            <span class="timeline__time">{{ entry.time }}</span>
          }
        </li>
      }
    </ul>
  `,
  styles: [
    `
      .timeline {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .timeline__item {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: var(--app-space-3);
        padding: var(--app-space-3) var(--app-space-2);
        margin-inline: calc(var(--app-space-2) * -1);
        border-radius: var(--app-radius-sm);
        transition: background-color var(--app-duration-fast) var(--app-ease);

        &:hover {
          background: var(--mat-sys-surface-container-high);
        }

        &:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 19px;
          top: 44px;
          bottom: -4px;
          width: 1px;
          background: var(--mat-sys-outline-variant);
        }
      }
      .timeline__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-primary);
        z-index: 1;
        transition: transform var(--app-duration-fast) var(--app-ease);

        mat-icon {
          font-size: 1.15rem;
          width: 1.15rem;
          height: 1.15rem;
        }
      }
      .timeline__item:hover .timeline__icon {
        transform: scale(1.08);
      }
      .timeline__body {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        flex: 1 1 auto;
      }
      .timeline__title {
        font-weight: 600;
        font-size: 0.9rem;
      }
      .timeline__subtitle {
        font-size: 0.8rem;
        color: var(--app-status-default-fg);
      }
      .timeline__time {
        flex-shrink: 0;
        font-size: 0.75rem;
        color: var(--app-status-default-fg);
        white-space: nowrap;
      }
    `,
  ],
})
export class TimelineComponent {
  readonly entries = input.required<TimelineEntry[]>();
}
