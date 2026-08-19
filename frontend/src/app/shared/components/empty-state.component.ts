import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Standardises the "no records" messaging repeated across every list view. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state app-animate-in">
      <span class="icon-badge">
        <mat-icon class="icon">{{ icon() }}</mat-icon>
      </span>
      <p class="message">{{ message() }}</p>
      <ng-content select="[empty-action]" />
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 2.75rem 1rem;
        text-align: center;
      }
      .icon-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--app-status-default-bg);
      }
      .icon {
        font-size: 1.75rem;
        width: 1.75rem;
        height: 1.75rem;
        color: var(--app-status-default-fg);
      }
      .message {
        margin: 0;
        color: var(--app-status-default-fg);
        font-size: 0.9rem;
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly message = input('Nothing to show yet.');
}
