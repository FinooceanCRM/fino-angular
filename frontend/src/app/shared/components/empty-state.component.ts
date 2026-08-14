import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Standardises the "no records" messaging repeated across every list view. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <mat-icon class="icon">{{ icon() }}</mat-icon>
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
        gap: 0.5rem;
        padding: 2.5rem 1rem;
        text-align: center;
      }
      .icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        opacity: 0.5;
      }
      .message {
        margin: 0;
        opacity: 0.7;
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly message = input('Nothing to show yet.');
}
