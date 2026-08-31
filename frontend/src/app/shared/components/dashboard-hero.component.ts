import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface DashboardHeroStat {
  value: string | number;
  label: string;
}

/**
 * Navy/teal wave welcome banner shared by every role dashboard — an eyebrow
 * (icon + label), a Lora headline, a subtitle, and up to a couple of
 * highlight stat chips. Built on the reusable `.tide-wave-banner` wave
 * language from the Tidewater foundation (styles.scss) rather than a
 * per-page wave implementation.
 */
@Component({
  selector: 'app-dashboard-hero',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dashboard-hero tide-wave-banner">
      <div class="dashboard-hero__main">
        <p class="dashboard-hero__eyebrow">
          <mat-icon>{{ eyebrowIcon() }}</mat-icon>
          <span>{{ eyebrowLabel() }}</span>
        </p>
        <h1 class="dashboard-hero__headline">{{ headline() }}</h1>
        <p class="dashboard-hero__subtitle">{{ subtitle() }}</p>
      </div>

      @if (stats().length) {
        <div class="dashboard-hero__stats">
          @for (stat of stats(); track stat.label) {
            <div class="dashboard-hero__stat">
              <span class="dashboard-hero__stat-value">{{ stat.value }}</span>
              <span class="dashboard-hero__stat-label">{{ stat.label }}</span>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .dashboard-hero {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--app-space-5);
        padding: var(--app-space-5) var(--app-space-6);
        padding-bottom: calc(var(--app-space-5) + 56px);
        margin-bottom: var(--app-space-5);
        border-radius: var(--app-radius-lg);
        overflow: hidden;
        color: var(--tide-color-text-inverse);
        background:
          radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.08), transparent 55%),
          linear-gradient(135deg, var(--tide-navy) 0%, #0f3d5c 55%, var(--tide-teal-700) 150%);
        --tide-wave-color: rgba(255, 255, 255, 0.08);
        --tide-wave-height: 56px;
      }
      .dashboard-hero__main {
        position: relative;
        z-index: 1;
        max-width: 640px;
        min-width: 0;
      }
      .dashboard-hero__eyebrow {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        margin: 0 0 var(--app-space-2);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.75);

        mat-icon {
          font-size: 1rem;
          width: 1rem;
          height: 1rem;
        }
      }
      .dashboard-hero__headline {
        margin: 0 0 var(--app-space-1);
        font-size: 1.9rem;
        font-weight: 700;
        line-height: 1.2;
      }
      .dashboard-hero__subtitle {
        margin: 0;
        font-size: 0.92rem;
        color: rgba(255, 255, 255, 0.82);
      }
      .dashboard-hero__stats {
        position: relative;
        z-index: 1;
        display: flex;
        gap: var(--app-space-3);
        flex-wrap: wrap;
      }
      .dashboard-hero__stat {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        padding: var(--app-space-3) var(--app-space-4);
        min-width: 120px;
        border-radius: var(--app-radius-md);
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.16);
      }
      .dashboard-hero__stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .dashboard-hero__stat-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.78);
      }
      @media (max-width: 720px) {
        .dashboard-hero {
          padding: var(--app-space-4);
          padding-bottom: calc(var(--app-space-4) + 40px);
          --tide-wave-height: 40px;
        }
        .dashboard-hero__headline {
          font-size: 1.5rem;
        }
        .dashboard-hero__stats {
          width: 100%;
        }
        .dashboard-hero__stat {
          flex: 1 1 45%;
        }
      }
    `,
  ],
})
export class DashboardHeroComponent {
  readonly eyebrowIcon = input('dashboard');
  readonly eyebrowLabel = input.required<string>();
  readonly headline = input.required<string>();
  readonly subtitle = input('');
  readonly stats = input<DashboardHeroStat[]>([]);
}
