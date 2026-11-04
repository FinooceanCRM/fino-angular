import { Injectable, computed, inject, signal } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

import { CUSTOMER_HOME, NAV_NODES, ROLE_SEGMENTS, STAFF_HOME } from '@core/navigation/navigation.config';

export interface Crumb {
  label: string;
  link: string;
}

const MAX_DEPTH = 10;

/**
 * Single source of truth for "where am I in the application": the breadcrumb trail of the current page and the
 * parent of any page. Back buttons ({@see NavigationHistoryService}) and the breadcrumb bar both read it, so they
 * can never disagree.
 *
 * Every trail starts at the Dashboard (customer: /account, staff: /dashboard), so the last Back always arrives there.
 *
 * Resolution order for a URL: route data (`breadcrumb`, `parentRoute`) on the page being shown → the central map in
 * navigation.config.ts → the URL read segment by segment.
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);

  /** Path of the page being shown (no query string or fragment). */
  readonly path = signal(this.clean(this.router.url));
  /** A page can replace its last crumb with something more meaningful, e.g. the application reference. */
  private readonly override = signal<string | null>(null);

  /** The trail from the root to the current page. */
  readonly trail = computed<Crumb[]>(() => {
    const trail = this.resolve(this.path(), 0);
    const label = this.override();
    return label && trail.length ? [...trail.slice(0, -1), { ...trail[trail.length - 1], label }] : trail;
  });

  /** The page one level up from the current one, or null on a root page. */
  readonly parent = computed<Crumb | null>(() => {
    const t = this.trail();
    return t.length > 1 ? t[t.length - 2] : null;
  });

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationStart => e instanceof NavigationStart)).subscribe(() => this.override.set(null));
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.path.set(this.clean(e.urlAfterRedirects)));
  }

  /** Lets a page name its own crumb (cleared again on the next navigation). */
  setCurrentLabel(label: string | null): void {
    this.override.set(label);
  }

  /** Home crumb for the area a URL belongs to. */
  homeFor(path: string): Crumb {
    return path === CUSTOMER_HOME || path.startsWith(`${CUSTOMER_HOME}/`)
      ? { label: 'Dashboard', link: CUSTOMER_HOME }
      : { label: 'Dashboard', link: STAFF_HOME };
  }

  /** Optional `fallbackRoute` set on the current route, for a page with no parent and no history. */
  fallbackRoute(): string | null {
    const value = this.leafData()?.['fallbackRoute'];
    return typeof value === 'string' ? value : null;
  }

  /** The trail for any path, also usable for pages other than the current one. */
  trailFor(path: string): Crumb[] {
    return this.resolve(this.clean(path), 0);
  }

  // ── resolution ────────────────────────────────────────────────────────────

  private resolve(path: string, depth: number): Crumb[] {
    const segments = path.split('/').filter(Boolean);
    const home = this.homeFor(path);
    if (depth > MAX_DEPTH || segments.length === 0 || (segments.length === 1 && ROLE_SEGMENTS.has(segments[0]))) {
      return [home];
    }
    // Every trail ends at the Dashboard: the Dashboard itself (a customer's /account, or a staff role's dashboard)
    // is the root, so it never shows a second "Dashboard" crumb after it.
    if (path === home.link || (segments[segments.length - 1] === 'dashboard' && segments.length <= 2)) {
      return [home];
    }

    const meta = this.routeMeta(path);
    const node = this.nodeFor(path);
    const label = meta.breadcrumb ?? node?.label ?? this.humanize(segments[segments.length - 1]);
    const parent = meta.parentRoute ?? (node?.parent ? this.fill(node.parent, path, node.pattern) : this.parentPath(segments));

    return [...this.resolve(this.clean(parent), depth + 1), { label, link: path }];
  }

  /** The URL read segment by segment: drop the last segment to go one level up. */
  private parentPath(segments: string[]): string {
    return segments.length <= 1 ? '/' : `/${segments.slice(0, -1).join('/')}`;
  }

  private nodeFor(path: string): { label: string; parent?: string; pattern: string } | null {
    const parts = path.split('/').filter(Boolean);
    for (const [pattern, node] of Object.entries(NAV_NODES)) {
      const want = pattern.split('/').filter(Boolean);
      if (want.length === parts.length && want.every((w, i) => w.startsWith(':') || w === parts[i])) {
        return { ...node, pattern };
      }
    }
    return null;
  }

  /** Copies the real values of `:params` from the current path into the parent pattern. */
  private fill(parentPattern: string, path: string, pattern: string): string {
    const values = new Map<string, string>();
    const have = path.split('/').filter(Boolean);
    pattern.split('/').filter(Boolean).forEach((seg, i) => seg.startsWith(':') && values.set(seg, have[i]));
    return parentPattern.split('/').map((seg) => (seg.startsWith(':') ? (values.get(seg) ?? seg) : seg)).join('/');
  }

  private routeMeta(path: string): { breadcrumb?: string; parentRoute?: string } {
    if (path !== this.path()) return {};
    const data = this.leafData();
    return {
      breadcrumb: typeof data?.['breadcrumb'] === 'string' ? (data['breadcrumb'] as string) : undefined,
      parentRoute: typeof data?.['parentRoute'] === 'string' ? (data['parentRoute'] as string) : undefined,
    };
  }

  private leafData(): ActivatedRouteSnapshot['data'] | null {
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    while (route?.firstChild) route = route.firstChild;
    return route?.data ?? null;
  }

  private clean(url: string): string {
    const path = url.split(/[?#]/)[0];
    return path.length > 1 ? path.replace(/\/+$/, '') : path || '/';
  }

  private humanize(segment: string): string {
    if (/^\d+$/.test(segment)) return `#${segment}`;
    return segment.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}
