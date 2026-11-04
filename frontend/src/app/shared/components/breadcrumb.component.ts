import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { BreadcrumbService } from '@core/services/breadcrumb.service';

import { BackButtonComponent } from './back-button.component';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

/**
 * Renders the breadcrumb trail of the current page. The trail comes from {@see BreadcrumbService}, the same source
 * the Back button uses, so what is shown and where Back goes always agree. Pass explicit `items` only for a page
 * that needs a trail the service cannot know.
 *
 * `variant="portal"` is the lighter look used inside the customer portal.
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [BackButtonComponent, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (crumbs().length > 1) {
      @if (variant() === 'portal') {
        <nav class="portal" [class.compact]="compact()" aria-label="Breadcrumb">
          @if (withBack()) { <app-back-button class="portal__back" /> }
          @for (crumb of crumbs(); track $index; let last = $last) {
            @if (!last && crumb.link) {
              <a [routerLink]="crumb.link">{{ crumb.label }}</a><span aria-hidden="true">›</span>
            } @else {
              <span class="here" aria-current="page">{{ crumb.label }}</span>
            }
          }
        </nav>
      } @else {
        <nav class="breadcrumb" aria-label="Breadcrumb">
          @for (crumb of crumbs(); track $index; let last = $last) {
            @if (!last && crumb.link) {
              <a [routerLink]="crumb.link">{{ crumb.label }}</a>
              <mat-icon class="separator">chevron_right</mat-icon>
            } @else {
              <span class="current" aria-current="page">{{ crumb.label }}</span>
            }
          }
        </nav>
      }
    }
  `,
  styles: [
    `
      .breadcrumb {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
      }
      a {
        display: flex;
        align-items: center;
        color: var(--app-status-default-fg);
        text-decoration: none;
      }
      a:hover {
        color: var(--mat-sys-primary);
        text-decoration: underline;
      }
      .separator {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
        opacity: 0.5;
      }
      .current {
        font-weight: 600;
        color: var(--mat-sys-primary);
      }

      /* customer portal look */
      .portal { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; font: 400 0.82rem Poppins, sans-serif; color: var(--fw-muted, #5b6b82); }
      .portal a { display: inline; color: inherit; padding: 2px 0; }
      .portal a:hover { color: var(--fw-blue, #1c6df0); text-decoration: underline; }
      .portal .here { color: var(--fw-ink, #10213a); font-weight: 500; }
      .portal.compact { margin-bottom: 2px; font-size: 0.76rem; }
      .portal__back { margin-right: 6px; }
    `,
  ],
})
export class BreadcrumbComponent {
  private readonly breadcrumbs = inject(BreadcrumbService);

  /** Explicit crumbs override the automatic trail. */
  readonly items = input<BreadcrumbItem[] | undefined>(undefined);
  readonly variant = input<'app' | 'portal'>('app');
  readonly compact = input(false);
  /** Portal look only: also show a Back button (to the parent page) at the start of the row. */
  readonly withBack = input(false);

  protected readonly crumbs = computed<BreadcrumbItem[]>(() => this.items() ?? this.breadcrumbs.trail());
}
