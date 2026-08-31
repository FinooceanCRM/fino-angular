import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface VoyageStage {
  /** Matches a real backend status/stage value — never invented client-side. */
  key: string;
  label: string;
}

type VoyageStageState = 'done' | 'current' | 'upcoming';

interface PlottedStage extends VoyageStage {
  state: VoyageStageState;
  x: number;
  y: number;
}

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 90;
const MARGIN_X = 40;
const BASE_Y = VIEW_HEIGHT / 2;
const AMPLITUDE = 22;

/**
 * "Voyage progress" — the signature Tidewater lifecycle stepper: a gently
 * undulating wave path connecting a lead's workflow stages, with a
 * checkmark for completed stages, a pulsing coral marker for the current
 * one, and hollow markers for what's ahead.
 *
 * Purely presentational and driven entirely by inputs — the caller decides
 * what stages exist and what the lead's current/reached state is (from real
 * lead status / status_history data), so this same component works for any
 * lead-related screen with a workflow shape, not just one hard-coded lead
 * detail page.
 */
@Component({
  selector: 'app-voyage-progress',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="voyage">
      <h2 class="voyage__title">{{ title() }}</h2>

      <div class="voyage__chart">
        <svg
          class="voyage__svg"
          [attr.viewBox]="'0 0 ' + viewWidth + ' ' + viewHeight"
          preserveAspectRatio="none"
          role="img"
          [attr.aria-label]="title() + ': ' + ariaSummary()"
        >
          <path class="voyage__path" [attr.d]="linePath()" />

          @for (stage of plotted(); track stage.key) {
            <g
              class="voyage__marker"
              [class.voyage__marker--done]="stage.state === 'done'"
              [class.voyage__marker--current]="stage.state === 'current'"
              [class.voyage__marker--upcoming]="stage.state === 'upcoming'"
            >
              @if (stage.state === 'current') {
                <circle class="voyage__pulse" [attr.cx]="stage.x" [attr.cy]="stage.y" r="14" />
              }
              <circle class="voyage__dot" [attr.cx]="stage.x" [attr.cy]="stage.y" r="9" />
              @if (stage.state === 'done') {
                <text class="voyage__check" [attr.x]="stage.x" [attr.y]="stage.y + 3.5">✓</text>
              }
            </g>
          }
        </svg>
      </div>

      <div class="voyage__labels">
        @for (stage of plotted(); track stage.key) {
          <span
            class="voyage__label"
            [class.voyage__label--current]="stage.state === 'current'"
            [class.voyage__label--upcoming]="stage.state === 'upcoming'"
          >
            {{ stage.label }}
          </span>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .voyage {
        background: var(--tide-color-surface, var(--mat-sys-surface-container));
        border-radius: var(--app-radius-lg);
        box-shadow: var(--app-shadow-sm);
        padding: var(--app-space-5);
        margin-bottom: var(--app-space-5);
      }
      .voyage__title {
        margin: 0 0 var(--app-space-4);
        font-family: var(--tide-font-body);
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--tide-color-text-primary);
      }
      .voyage__chart {
        width: 100%;
      }
      .voyage__svg {
        display: block;
        width: 100%;
        height: 90px;
        overflow: visible;
      }
      .voyage__path {
        fill: none;
        stroke: var(--tide-color-secondary);
        stroke-width: 2.5;
        stroke-linecap: round;
      }
      .voyage__dot {
        stroke-width: 3;
        transition: fill var(--app-duration-base) var(--app-ease);
      }
      .voyage__marker--done .voyage__dot {
        fill: var(--tide-color-secondary);
        stroke: var(--tide-color-secondary);
      }
      .voyage__marker--upcoming .voyage__dot {
        fill: var(--tide-color-surface, #fff);
        stroke: var(--tide-color-border);
      }
      .voyage__marker--current .voyage__dot {
        fill: var(--tide-color-action);
        stroke: var(--tide-color-action);
      }
      .voyage__check {
        text-anchor: middle;
        font-size: 11px;
        font-weight: 700;
        fill: var(--tide-color-text-inverse);
      }
      .voyage__pulse {
        fill: var(--tide-color-action);
        opacity: 0.35;
        transform-box: fill-box;
        transform-origin: center;
        animation: voyage-pulse 1.8s var(--app-ease) infinite;
      }
      @keyframes voyage-pulse {
        0% {
          transform: scale(1);
          opacity: 0.35;
        }
        70% {
          transform: scale(1.9);
          opacity: 0;
        }
        100% {
          transform: scale(1.9);
          opacity: 0;
        }
      }
      .voyage__labels {
        display: flex;
        justify-content: space-between;
        margin-top: var(--app-space-2);
        gap: var(--app-space-2);
      }
      .voyage__label {
        flex: 1 1 0;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--tide-color-text-primary);
        text-align: center;
      }
      .voyage__label:first-child {
        text-align: left;
      }
      .voyage__label:last-child {
        text-align: right;
      }
      .voyage__label--upcoming {
        font-weight: 500;
        color: var(--tide-color-text-muted);
      }
      .voyage__label--current {
        color: var(--tide-color-action);
      }
      @media (prefers-reduced-motion: reduce) {
        .voyage__pulse {
          animation: none;
          opacity: 0;
        }
      }
      @media (max-width: 640px) {
        .voyage__label {
          font-size: 0.68rem;
        }
      }
    `,
  ],
})
export class VoyageProgressComponent {
  readonly title = input('Voyage progress');
  readonly stages = input.required<VoyageStage[]>();
  /** The lead's current stage key (e.g. its live `status`). */
  readonly currentKey = input.required<string>();
  /**
   * Optional explicit set of stage keys already reached (e.g. derived from
   * real `status_history`) — pass this when a lead may have skipped/branched
   * past a stage so "done" reflects what actually happened, not just index
   * order. Falls back to "every stage up to the current one" when omitted.
   */
  readonly reachedKeys = input<ReadonlyArray<string> | ReadonlySet<string> | undefined>(undefined);

  protected readonly viewWidth = VIEW_WIDTH;
  protected readonly viewHeight = VIEW_HEIGHT;

  protected readonly plotted = computed<PlottedStage[]>(() => {
    const stages = this.stages();
    if (stages.length === 0) {
      return [];
    }

    const current = this.currentKey();
    const explicitReached = this.reachedKeys();
    const reachedSet = explicitReached ? new Set(explicitReached) : null;
    const currentIndex = stages.findIndex((stage) => stage.key === current);

    const step = stages.length > 1 ? (VIEW_WIDTH - MARGIN_X * 2) / (stages.length - 1) : 0;

    return stages.map((stage, index) => {
      const isCurrent = stage.key === current;
      const isReached = reachedSet
        ? reachedSet.has(stage.key)
        : currentIndex >= 0
          ? index <= currentIndex
          : false;

      const state: VoyageStageState = isCurrent ? 'current' : isReached ? 'done' : 'upcoming';

      return {
        ...stage,
        state,
        x: MARGIN_X + index * step,
        y: BASE_Y + Math.sin(index * 1.15 + 0.3) * AMPLITUDE,
      };
    });
  });

  protected readonly linePath = computed(() => {
    const points = this.plotted();
    if (points.length === 0) {
      return '';
    }

    return points
      .map((point, index) => {
        if (index === 0) {
          return `M${point.x},${point.y}`;
        }
        const prev = points[index - 1];
        const midX = (prev.x + point.x) / 2;
        return `Q${midX},${prev.y} ${midX},${(prev.y + point.y) / 2} T${point.x},${point.y}`;
      })
      .join(' ');
  });

  protected readonly ariaSummary = computed(() => {
    const current = this.plotted().find((stage) => stage.state === 'current');
    return current ? `currently at ${current.label}` : 'no current stage';
  });
}
