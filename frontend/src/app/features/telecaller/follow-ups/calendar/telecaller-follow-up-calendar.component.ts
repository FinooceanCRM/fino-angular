import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TelecallerFollowUp } from '@core/models/telecaller-follow-up.model';

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  items: TelecallerFollowUp[];
}

/**
 * Self-built month-grid calendar for the Telecaller follow-up list — no
 * calendar library exists anywhere in this app, so this mirrors the app's
 * existing "custom component on top of Material" pattern rather than
 * introducing a new dependency for one role. Each day cell shows a coloured
 * dot per follow-up (overdue/today/upcoming/completed); clicking a day emits
 * its follow-ups.
 */
@Component({
  selector: 'app-telecaller-follow-up-calendar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="cal">
      <div class="cal__header">
        <button mat-icon-button type="button" aria-label="Previous month" (click)="shiftMonth(-1)">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <strong>{{ monthLabel() }}</strong>
        <button mat-icon-button type="button" aria-label="Next month" (click)="shiftMonth(1)">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <div class="cal__weekdays">
        @for (day of weekdayLabels; track day) {
          <span>{{ day }}</span>
        }
      </div>

      <div class="cal__grid">
        @for (day of days(); track day.date.toISOString()) {
          <button
            type="button"
            class="cal__day"
            [class.cal__day--muted]="!day.inMonth"
            [class.cal__day--today]="day.isToday"
            [class.cal__day--selected]="selectedDate() === day.date.toDateString()"
            [matTooltip]="day.items.length ? day.items.length + ' follow-up(s)' : ''"
            (click)="select(day)"
          >
            <span class="cal__day-number">{{ day.date.getDate() }}</span>
            @if (day.items.length) {
              <span class="cal__dots">
                @for (item of day.items.slice(0, 4); track item.id) {
                  <span
                    class="cal__dot"
                    [class.cal__dot--overdue]="item.is_overdue"
                    [class.cal__dot--today]="item.is_today"
                    [class.cal__dot--done]="!!item.completed_at"
                  ></span>
                }
              </span>
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .cal {
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: var(--app-radius-md);
        padding: var(--app-space-3);
      }
      .cal__header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--app-space-3);
        margin-bottom: var(--app-space-2);
      }
      .cal__weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        font-size: 0.75rem;
        color: var(--app-status-default-fg);
        margin-bottom: var(--app-space-1);
      }
      .cal__grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }
      .cal__day {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 6px 2px;
        border: none;
        border-radius: var(--app-radius-sm, 6px);
        background: var(--mat-sys-surface-container);
        cursor: pointer;
        min-height: 44px;
      }
      .cal__day:hover {
        background: var(--mat-sys-surface-container-high);
      }
      .cal__day--muted {
        opacity: 0.4;
      }
      .cal__day--today .cal__day-number {
        color: var(--mat-sys-primary);
        font-weight: 700;
      }
      .cal__day--selected {
        outline: 2px solid var(--mat-sys-primary);
      }
      .cal__day-number {
        font-size: 0.8rem;
      }
      .cal__dots {
        display: flex;
        gap: 2px;
        flex-wrap: wrap;
        justify-content: center;
      }
      .cal__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--mat-sys-primary);
      }
      .cal__dot--overdue {
        background: var(--mat-sys-error);
      }
      .cal__dot--today {
        background: var(--mat-sys-tertiary, var(--mat-sys-primary));
      }
      .cal__dot--done {
        background: var(--app-status-success-fg, #2e7d32);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerFollowUpCalendarComponent {
  readonly items = input<TelecallerFollowUp[]>([]);
  readonly daySelected = output<TelecallerFollowUp[]>();

  protected readonly weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  protected readonly cursor = signal(new Date());
  protected readonly selectedDate = signal<string | null>(null);

  protected readonly monthLabel = computed(() =>
    this.cursor().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  );

  protected readonly days = computed<CalendarDay[]>(() => {
    const cursor = this.cursor();
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    const today = new Date().toDateString();

    const byDate = new Map<string, TelecallerFollowUp[]>();
    for (const item of this.items()) {
      if (!item.next_follow_up_at) {
        continue;
      }
      const key = new Date(item.next_follow_up_at).toDateString();
      byDate.set(key, [...(byDate.get(key) ?? []), item]);
    }

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const key = date.toDateString();
      return {
        date,
        inMonth: date.getMonth() === month,
        isToday: key === today,
        items: byDate.get(key) ?? [],
      };
    });
  });

  protected shiftMonth(delta: number): void {
    const next = new Date(this.cursor());
    next.setMonth(next.getMonth() + delta);
    this.cursor.set(next);
  }

  protected select(day: CalendarDay): void {
    this.selectedDate.set(day.date.toDateString());
    this.daySelected.emit(day.items);
  }
}
