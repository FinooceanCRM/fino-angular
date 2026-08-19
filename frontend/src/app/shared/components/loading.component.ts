import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Standardises the loading indicators repeated across every list/form/detail view. */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [MatProgressBarModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mode() === 'bar') {
      <mat-progress-bar mode="indeterminate" class="app-animate-in" />
    } @else {
      <div class="spinner-wrap app-animate-in">
        <mat-spinner [diameter]="diameter()" />
        @if (message()) {
          <p class="message">{{ message() }}</p>
        }
      </div>
    }
  `,
  styles: [
    `
      .spinner-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.85rem;
        padding: 2.5rem;
      }
      .message {
        margin: 0;
        color: var(--app-status-default-fg);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class LoadingComponent {
  readonly mode = input<'bar' | 'spinner'>('bar');
  readonly message = input<string | undefined>(undefined);
  readonly diameter = input(40);
}
