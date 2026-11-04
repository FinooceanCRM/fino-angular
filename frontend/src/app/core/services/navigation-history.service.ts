import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

import { BreadcrumbService } from './breadcrumb.service';

const STORAGE_KEY = 'fino.nav.history';
const MAX_ENTRIES = 40;
/** Pages Back should never return to. */
const NEVER_BACK = [/^\/auth\//, /^\/login/, /^\/logout/, /\/logout$/];

/**
 * Remembers the pages visited in this tab and decides what "Back" means.
 *
 * Back goes UP the page hierarchy (the page's parent in the breadcrumb), so opening Application Details from a
 * Dashboard card still returns to My Applications. When the person did come from that parent, the exact URL they
 * left is reused, so list filters and the page number survive. A page with no parent falls back to the previous
 * page they visited, then to the route's `fallbackRoute`, then to the home page of their area. Back never loops:
 * it always moves up the tree or rewinds the history.
 *
 * The browser's own Back button follows the same rule: stepping back to a page that is not the parent of the page
 * being left is turned into a step to the parent (Dashboard → Application Details → browser Back lands on My
 * Applications). Forward, and Back to the parent itself, are left alone.
 *
 * The history is kept in sessionStorage, so a refresh does not lose it, and browser Back / Forward only rewinds
 * or advances the stack instead of adding entries.
 */
@Injectable({ providedIn: 'root' })
export class NavigationHistoryService {
  private readonly router = inject(Router);
  private readonly breadcrumbs = inject(BreadcrumbService);

  private readonly stack = signal<string[]>(this.restore());
  private pending: { popstate: boolean; replace: boolean } = { popstate: false, replace: false };
  private lastNavigationId = 0;
  /** Set while a browser-Back is being turned into a step to the parent page. */
  private redirectTo: string | null = null;

  /** The page before this one in the history, or null on the first page of the session. */
  readonly previous = computed(() => {
    const s = this.stack();
    return s.length > 1 ? s[s.length - 2] : null;
  });

  /** The page one level up in the hierarchy (what Back goes to), or null on a root page. */
  readonly parent = this.breadcrumbs.parent;

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationStart => e instanceof NavigationStart)).subscribe((e) => {
      this.pending = {
        popstate: e.navigationTrigger === 'popstate',
        replace: !!this.router.getCurrentNavigation()?.extras.replaceUrl,
      };
      this.redirectTo = this.pending.popstate && this.isBackStep(e) ? this.parentInsteadOf(e.url) : null;
    });
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.lastNavigationId = e.id;
        this.record(e.urlAfterRedirects);
        const redirect = this.redirectTo;
        this.redirectTo = null;
        if (redirect) void this.router.navigateByUrl(redirect); // a normal step, so it adds history like a clicked link
      });
    // created after the first navigation already finished (lazy injection): note the page we are on
    if (this.router.navigated) this.record(this.router.url);
  }

  /** Whether Back has anywhere sensible to go (a parent page or an earlier page). */
  canGoBack(): boolean {
    return this.parent() !== null || this.usablePrevious() !== null;
  }

  /** Where Back leads from the current page. */
  target(fallback?: string | null): string {
    const here = this.currentUrl();
    const parent = this.parent();
    const prev = this.usablePrevious();

    if (parent && parent.link !== this.path(here)) {
      // came from the parent itself: return to exactly where they were (filters, page number …)
      return prev && this.path(prev) === parent.link ? prev : parent.link;
    }
    return prev ?? fallback ?? this.breadcrumbs.fallbackRoute() ?? this.breadcrumbs.homeFor(this.path(here)).link;
  }

  back(fallback?: string | null): void {
    void this.router.navigateByUrl(this.target(fallback));
  }

  // ── browser Back ──────────────────────────────────────────────────────────

  /** A popstate to an earlier history entry (Angular numbers the entries it creates). */
  private isBackStep(e: NavigationStart): boolean {
    const id = e.restoredState?.navigationId;
    return typeof id === 'number' && id < this.lastNavigationId;
  }

  /**
   * The parent page when the browser is about to land somewhere else, otherwise null (let it go). Pages with no
   * parent are never intercepted, so the browser keeps its normal behaviour there.
   */
  private parentInsteadOf(destination: string): string | null {
    const parent = this.breadcrumbs.parent();
    if (!parent || parent.link === this.path(this.breadcrumbs.path())) return null;
    return this.path(destination) === parent.link ? null : parent.link;
  }

  // ── bookkeeping ───────────────────────────────────────────────────────────

  private record(url: string): void {
    const { popstate, replace } = this.pending;
    this.pending = { popstate: false, replace: false };
    this.stack.update((stack) => {
      let next = [...stack];
      const top = next[next.length - 1];
      if (top === url) return next; // same page again: no duplicate entry
      const earlier = next.lastIndexOf(url);
      if (popstate && earlier >= 0) {
        next = next.slice(0, earlier + 1); // browser Back: rewind
      } else if (replace && next.length) {
        next[next.length - 1] = url; // redirects and replaceUrl swap the entry instead of adding one
      } else if (earlier >= 0 && earlier < next.length - 1) {
        next = next.slice(0, earlier + 1); // returned to a page visited before: drop what came after it
      } else {
        next.push(url);
      }
      return next.slice(-MAX_ENTRIES);
    });
    this.persist();
  }

  private currentUrl(): string {
    const s = this.stack();
    return s.length ? s[s.length - 1] : this.router.url;
  }

  /** The previous page, unless it is somewhere Back must not return to (sign-in …) or is the page itself. */
  private usablePrevious(): string | null {
    const prev = this.previous();
    if (!prev || this.path(prev) === this.path(this.currentUrl())) return null;
    return NEVER_BACK.some((re) => re.test(this.path(prev))) ? null : prev;
  }

  private path(url: string): string {
    const p = url.split(/[?#]/)[0];
    return p.length > 1 ? p.replace(/\/+$/, '') : p || '/';
  }

  private restore(): string[] {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string').slice(-MAX_ENTRIES) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.stack()));
    } catch {
      /* storage blocked: the history simply lives in memory */
    }
  }
}
