import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';

/**
 * Slide-out details panel — an alternative to navigating to a detail page
 * or opening a centered modal, for "peek at this record without losing
 * your place in the list" flows. `<ng-content>` is the body; project
 * buttons into `[drawer-actions]` for a footer action row.
 *
 * Usage: wrap the page content in `<mat-drawer-container>` yourself and
 * place `<app-details-drawer>` as the `<mat-drawer>` sibling, or nest a
 * page's existing content as the drawer's sibling — this component only
 * owns the drawer panel itself, not the container, so it composes with
 * whatever layout the host page already has.
 */
@Component({
  selector: 'app-details-drawer',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSidenavModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-drawer
      class="details-drawer"
      mode="over"
      position="end"
      [opened]="opened()"
      (openedChange)="openedChange.emit($event)"
    >
      <div class="details-drawer__header">
        <h2 class="details-drawer__title">{{ title() }}</h2>
        <button mat-icon-button type="button" aria-label="Close" (click)="close()">
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
    </mat-drawer>
  `,
  styles: [
    `
      .details-drawer {
        width: min(420px, 92vw);
        padding: var(--app-space-5) var(--app-space-4);
        display: flex;
        flex-direction: column;
      }
      .details-drawer__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--app-space-3);
        margin-bottom: var(--app-space-4);
      }
      .details-drawer__title {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
      }
      .details-drawer__body {
        flex: 1;
        overflow-y: auto;
      }
      .details-drawer__actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--app-space-2);
        margin-top: var(--app-space-4);
        padding-top: var(--app-space-3);
        border-top: 1px solid var(--mat-sys-outline-variant);
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
