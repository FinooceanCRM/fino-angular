import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Slide-out details panel for "peek at this record without losing your place
 * in the list" flows. Page content is projected into `[drawer-content]` and
 * buttons into `[drawer-actions]`; the panel itself is a fixed overlay so it
 * never changes the page layout when closed.
 */
@Component({
  selector: 'app-details-drawer',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="details-drawer__content">
      <ng-content select="[drawer-content]" />
    </div>

    @if (opened()) {
      <div class="details-drawer__backdrop" aria-hidden="true" (click)="close()"></div>
      <aside
        class="details-drawer"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        (click)="$event.stopPropagation()"
      >
        <div class="details-drawer__header">
          <h2 class="details-drawer__title">{{ title() }}</h2>
          <button
            mat-icon-button
            type="button"
            class="details-drawer__close"
            aria-label="Close"
            (click)="close()"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="details-drawer__body">
          <ng-content />
        </div>

        @if (showActions()) {
          <div class="details-drawer__actions">
            <ng-content select="[drawer-actions]" />
          </div>
        }
      </aside>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .details-drawer__content {
        display: block;
      }
      .details-drawer__backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgb(15 31 48 / 32%);
      }
      .details-drawer {
        position: fixed;
        inset: 0 0 0 auto;
        z-index: 1001;
        width: min(420px, 92vw);
        box-sizing: border-box;
        padding: var(--app-space-5) var(--app-space-4);
        background: var(--mat-sys-surface);
        box-shadow: -12px 0 32px rgb(15 31 48 / 18%);
        display: flex;
        flex-direction: column;
      }
      .details-drawer__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--app-space-3);
        margin-bottom: var(--app-space-4);
        flex-shrink: 0;
      }
      .details-drawer__title {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .details-drawer__close {
        flex-shrink: 0;
        color: var(--mat-sys-on-surface);
        background: var(--mat-sys-surface-container-high);
      }
      .details-drawer__body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }
      .details-drawer__actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--app-space-2);
        margin-top: var(--app-space-4);
        padding-top: var(--app-space-3);
        border-top: 1px solid var(--mat-sys-outline-variant);
        flex-shrink: 0;
      }

      /* Phone: full-screen sheet, clear of the status bar and home
         indicator. The bottom nav now shares the sidenav-content stacking
         context and sits below this (z-index 1001 > 100), so the action
         row is no longer hidden behind it. */
      @media (max-width: 599.98px) {
        .details-drawer {
          inset: 0;
          width: 100vw;
          border-radius: 0;
          padding: calc(var(--app-space-4) + env(safe-area-inset-top)) var(--app-space-4)
            calc(var(--app-space-4) + env(safe-area-inset-bottom));
        }
        .details-drawer__actions > * {
          flex: 1 1 auto;
        }
      }
    `,
  ],
})
export class DetailsDrawerComponent {
  readonly title = input('');
  readonly opened = input(false);
  readonly showActions = input(false);

  readonly openedChange = output<boolean>();

  protected close(): void {
    this.openedChange.emit(false);
  }
}
