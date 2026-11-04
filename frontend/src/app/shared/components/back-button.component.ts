import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { NavigationHistoryService } from '@core/services/navigation-history.service';

/**
 * The one Back button for the whole application. It goes to the page's parent in the breadcrumb (see
 * {@see NavigationHistoryService}), is labelled "Back to <parent>", and needs no per-page logic:
 *
 *   <app-back-button />                         customer-portal look
 *   <app-back-button variant="material" />      staff (Angular Material) look
 *   <app-back-button fallback="/leads" />       only used when the page has no parent and no history
 */
@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'material') {
      <button mat-stroked-button type="button" class="back" (click)="go()" [attr.aria-label]="text()">
        <mat-icon>arrow_back</mat-icon> {{ text() }}
      </button>
    } @else {
      <button type="button" class="back back--portal" (click)="go()" [attr.aria-label]="text()">
        <span class="material-icons" aria-hidden="true">arrow_back</span> {{ text() }}
      </button>
    }
  `,
  styles: [
    `
      :host { display: inline-block; }
      .back--portal { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 10px; border: 1.5px solid var(--fw-line-strong, #c5d3ea); background: #fff; color: var(--fw-navy, #082a55); font: 600 0.84rem Poppins, sans-serif; cursor: pointer; white-space: nowrap; transition: background 0.2s, border-color 0.2s, transform 0.15s; }
      .back--portal:hover { background: var(--fw-blue-soft, #eef4ff); border-color: var(--fw-blue, #1c6df0); }
      .back--portal:active { transform: scale(0.97); }
      .back--portal:focus-visible { outline: 2px solid var(--fw-blue, #1c6df0); outline-offset: 2px; }
      .back--portal .material-icons { font-size: 18px; }
    `,
  ],
})
export class BackButtonComponent {
  private readonly history = inject(NavigationHistoryService);

  readonly variant = input<'portal' | 'material'>('portal');
  /** Used only when there is no parent page and no earlier page to return to. */
  readonly fallback = input<string | null>(null);
  /** Overrides the automatic "Back to <parent>" text. */
  readonly label = input<string | null>(null);

  protected readonly text = computed(() => this.label() ?? (this.history.parent() ? `Back to ${this.history.parent()?.label}` : 'Back'));

  protected go(): void {
    this.history.back(this.fallback());
  }
}
