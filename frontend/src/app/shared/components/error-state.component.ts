import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Standardises the "something went wrong" messaging that today is
 * hand-rolled per page as an inline `mat-card` + error signal. Sibling to
 * `EmptyStateComponent` — same shape, same `[X-action]` content-projection
 * convention, distinct semantics (a failure to retry, not an absence of data).
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-state">
      <mat-icon class="icon">{{ icon() }}</mat-icon>
      <p class="message">{{ message() }}</p>
      <ng-content select="[error-action]" />
    </div>
  `,
  styles: [
    `
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--app-space-3);
        padding: 2.5rem 1rem;
        text-align: center;
      }
      .icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        color: var(--app-status-warn-fg);
      }
      .message {
        margin: 0;
        color: var(--app-status-default-fg);
        max-width: 40ch;
      }
    `,
  ],
})
export class ErrorStateComponent {
  readonly icon = input('error_outline');
  readonly message = input('Something went wrong. Please try again.');
}
