import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LoadingComponent } from './loading.component';

/**
 * Standardises the reactive-form shell (loading bar, error banner, card,
 * grid layout, submit/cancel actions) repeated across every create/edit
 * view. Projects the form fields as content; the host still owns its own
 * `FormGroup` and submit handling.
 */
@Component({
  selector: 'app-form',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading />
    }

    @if (error(); as message) {
      @if (errorDismissed() !== message) {
        <div class="form-error" role="alert">
          <mat-icon>error</mat-icon>
          <span>{{ message }}</span>
          <button
            type="button"
            class="form-error__dismiss"
            aria-label="Dismiss error"
            (click)="errorDismissed.set(message)"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
    }

    <div class="form-card">
      <form class="app-form" [class.two-column]="twoColumn()" (submit)="onSubmit($event)">
        <ng-content />

        <div class="form-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="submitDisabled()">
            {{ submitLabel() }}
          </button>
          <ng-content select="[form-secondary-actions]" />
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .form-card {
        background: var(--mat-sys-surface-container);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: var(--app-radius-lg);
        padding: var(--app-space-5);
      }
      .app-form {
        display: flex;
        flex-direction: column;
        gap: var(--app-space-4);
      }
      .app-form.two-column {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: var(--app-space-4) var(--app-space-5);
      }
      .app-form.two-column .form-actions {
        grid-column: 1 / -1;
      }
      .form-actions {
        display: flex;
        gap: var(--app-space-3);
        align-items: center;
        justify-content: flex-end;
      }
      .form-error {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        margin: 0 0 var(--app-space-4);
        padding: var(--app-space-3) var(--app-space-4);
        border-radius: var(--app-radius-md);
        background: var(--app-status-warn-bg);
        color: var(--app-status-warn-fg);
        font-size: 0.875rem;
      }
      .form-error mat-icon:first-child {
        flex-shrink: 0;
      }
      .form-error span {
        flex: 1 1 auto;
      }
      .form-error__dismiss {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        opacity: 0.7;

        &:hover {
          opacity: 1;
        }
      }
    `,
  ],
})
export class FormComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly submitLabel = input('Save');
  readonly submitDisabled = input(false);
  /** Lays fields out in a responsive grid, matching the create/edit forms. */
  readonly twoColumn = input(false);

  readonly submitted = output<void>();

  protected readonly errorDismissed = signal<string | null>(null);

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.emit();
  }
}
