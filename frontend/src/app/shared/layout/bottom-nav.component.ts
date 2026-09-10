import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

import { NavItem, primaryMobileNavItems } from './nav-items';

/**
 * Handset-only bottom tab bar. Shows the role's first few primary
 * destinations (from {@link primaryMobileNavItems}) plus a "More" button
 * that the shell wires to the full navigation drawer. Rendered by
 * AppShellComponent only when `isHandset()` is true.
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [MatIconModule, MatRippleModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="bottom-nav" aria-label="Primary">
      @for (item of items(); track item.link) {
        <a
          class="bottom-nav__item"
          [routerLink]="item.link"
          routerLinkActive="bottom-nav__item--active"
          matRipple
          [attr.aria-label]="item.label"
        >
          <mat-icon>{{ item.icon }}</mat-icon>
          <span class="bottom-nav__label">{{ shortLabel(item) }}</span>
        </a>
      }
      <button type="button" class="bottom-nav__item" (click)="more.emit()" aria-label="More navigation">
        <mat-icon>more_horiz</mat-icon>
        <span class="bottom-nav__label">More</span>
      </button>
    </nav>
  `,
  styles: [
    `
      .bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
        box-sizing: border-box;
        // Hard-clamp to the viewport: a CSS grid of five equal, zero-min
        // tracks can never be pushed wider than the screen by its content
        // (a flex row without min-width:0 on the container can, which was
        // forcing a 30px horizontal scroll on every page).
        width: 100%;
        max-width: 100vw;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        overflow: hidden;
        background: var(--mat-sys-surface-container);
        border-top: 1px solid var(--mat-sys-outline-variant);
        box-shadow: 0 -2px 10px rgba(16, 24, 40, 0.05);
        padding-bottom: env(safe-area-inset-bottom);
      }

      .bottom-nav__item {
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 8px 2px;
        min-height: 56px;
        border: 0;
        background: transparent;
        color: var(--app-status-default-fg);
        text-decoration: none;
        font: inherit;
        cursor: pointer;
        overflow: hidden;
        -webkit-tap-highlight-color: transparent;
      }

      .bottom-nav__item mat-icon {
        flex-shrink: 0;
        font-size: 22px;
        width: 22px;
        height: 22px;
        overflow: hidden;
      }

      .bottom-nav__label {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10px;
        font-weight: 500;
        line-height: 1;
      }

      .bottom-nav__item--active {
        color: var(--tide-color-secondary);
      }

      .bottom-nav__item--active .bottom-nav__label {
        font-weight: 600;
      }
    `,
  ],
})
export class BottomNavComponent {
  private readonly auth = inject(AuthService);

  /** Emitted by the "More" tab — the shell opens the full nav drawer. */
  readonly more = output<void>();

  protected readonly items = computed(() => primaryMobileNavItems(this.auth));

  /** Compact label that fits a ~64px tab column. */
  protected shortLabel(item: NavItem): string {
    if (/dashboard/i.test(item.label)) {
      return 'Home';
    }
    return item.label
      .replace(
        /^(Connector|Affiliate|Employee|Manager|Banker|Telecaller|Vendor|RM|Accounts|My)\s+/i,
        '',
      )
      .trim();
  }
}
