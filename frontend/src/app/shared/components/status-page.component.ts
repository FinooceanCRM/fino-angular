import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Full-page status/error layout (403, 404, and similar "you can't be here"
 * pages) — a coral icon tile, an optional big status code, a heading, a
 * message, and a projected action button. Sibling to `EmptyStateComponent`/
 * `ErrorStateComponent` but sized for a whole routed page rather than a
 * panel inside one, which is why it's its own component instead of a
 * variant of either.
 */
@Component({
  selector: 'app-status-page',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="status-page">
      <span class="status-page__icon">
        <mat-icon>{{ icon() }}</mat-icon>
      </span>
      @if (code()) {
        <p class="status-page__code">{{ code() }}</p>
      }
      <h1 class="status-page__heading">{{ heading() }}</h1>
      @if (message()) {
        <p class="status-page__message">{{ message() }}</p>
      }
      <div class="status-page__action">
        <ng-content select="[status-page-action]" />
      </div>
    </div>
  `,
  styles: [
    `
      .status-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--app-space-3);
        min-height: calc(100vh - 64px - 3rem);
        padding: var(--app-space-6) var(--app-space-4);
        text-align: center;
      }
      .status-page__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 96px;
        height: 96px;
        border-radius: 28px;
        margin-bottom: var(--app-space-2);
        background: linear-gradient(135deg, var(--tide-color-action), var(--tide-coral-700));
        box-shadow: 0 16px 32px -8px rgba(232, 90, 59, 0.45);

        mat-icon {
          font-size: 2.75rem;
          width: 2.75rem;
          height: 2.75rem;
          color: var(--tide-color-text-inverse);
        }
      }
      .status-page__code {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1;
        color: var(--tide-color-text-primary);
      }
      /* Overrides the global brand/serif h1 rule — this heading reads as a
         bold sans headline in the reference mockups, not a Lora moment. */
      .status-page__heading {
        margin: 0;
        font-family: var(--tide-font-body);
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--tide-color-text-primary);
      }
      .status-page__message {
        margin: 0;
        max-width: 42ch;
        color: var(--tide-color-text-secondary);
      }
      .status-page__action {
        margin-top: var(--app-space-3);
      }
    `,
  ],
})
export class StatusPageComponent {
  readonly icon = input('error_outline');
  readonly code = input<string | undefined>(undefined);
  readonly heading = input.required<string>();
  readonly message = input<string | undefined>(undefined);
}
