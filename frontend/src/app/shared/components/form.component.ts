import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { LoadingComponent } from './loading.component';

/**
 * Standardises the reactive-form shell (loading bar, error banner, grid
 * layout, submit/cancel actions) repeated across every create/edit view.
 * Projects the form fields as content; the host still owns its own
 * `FormGroup` and submit handling.
 */
@Component({
  selector: 'app-form',
  standalone: true,
  imports: [MatButtonModule, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading />
    }

    @if (error(); as message) {
      <p class="form-error" role="alert">{{ message }}</p>
    }

    <form class="app-form" [class.two-column]="twoColumn()" (ngSubmit)="submitted.emit()">
      <ng-content />

      <div class="form-actions">
        <button mat-flat-button color="primary" type="submit" [disabled]="submitDisabled()">
          {{ submitLabel() }}
        </button>
        <ng-content select="[form-secondary-actions]" />
      </div>
    </form>
  `,
  styles: [
    `
      .app-form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .app-form.two-column {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.75rem;
      }
      .app-form.two-column .form-actions {
        grid-column: 1 / -1;
      }
      .form-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .form-error {
        margin: 0 0 0.75rem;
        color: var(--mat-sys-error, #b3261e);
        font-size: 0.875rem;
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
}
