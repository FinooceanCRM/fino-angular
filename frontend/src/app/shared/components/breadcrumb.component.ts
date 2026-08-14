import { toSignal } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

/**
 * Renders a breadcrumb trail. Pass explicit `items` for a page-specific trail,
 * or omit them to auto-derive a trail from the current URL segments.
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (crumbs().length > 1) {
      <nav class="breadcrumb" aria-label="Breadcrumb">
        @for (crumb of crumbs(); track crumb.label; let last = $last) {
          @if (!last && crumb.link) {
            <a [routerLink]="crumb.link">{{ crumb.label }}</a>
            <mat-icon class="separator">chevron_right</mat-icon>
          } @else {
            <span class="current">{{ crumb.label }}</span>
          }
        }
      </nav>
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
        color: var(--mat-sys-primary);
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      .separator {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
        opacity: 0.5;
      }
      .current {
        opacity: 0.7;
      }
    `,
  ],
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);

  /** Explicit crumbs override auto-derivation from the URL. */
  readonly items = input<BreadcrumbItem[] | undefined>(undefined);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly crumbs = computed<BreadcrumbItem[]>(() => {
    const explicit = this.items();
    if (explicit) {
      return explicit;
    }

    const path = this.currentUrl().split('?')[0];
    const segments = path.split('/').filter(Boolean);

    let accumulated = '';
    const auto: BreadcrumbItem[] = segments.map((segment) => {
      accumulated += `/${segment}`;
      return { label: humanize(segment), link: accumulated };
    });

    return [{ label: 'Home', link: '/dashboard' }, ...auto];
  });
}

function humanize(segment: string): string {
  if (/^\d+$/.test(segment)) {
    return `#${segment}`;
  }

  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
