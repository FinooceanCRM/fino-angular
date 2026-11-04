import { Injectable, NgZone, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

import { PopupConfig, PublicOffer } from '@core/models/offer.model';
import { AuthService } from '@core/services/auth.service';
import { OfferService } from '@core/services/offer.service';

import { offerStore, visitorId } from './offer-storage';

/** Pages where the popup never appears, whatever the admin picked. */
const NEVER = ['/offers/', '/login', '/register', '/forgot', '/reset', '/account'];

/**
 * Decides what popups a guest sees and when. The first thing a new guest sees, at once, is the small "call me back"
 * modal (name, mobile, city; no offer). Once that is closed, the offer popups follow on a schedule set by the admin
 * (defaults in brackets):
 *
 *  - the first popup appears after `first_delay_seconds` on the site [15];
 *  - the second appears `second_delay_seconds` after the first was closed [120];
 *  - every later one appears `repeat_gap_seconds` after the previous was closed [900];
 *  - only for visitors who are not signed in (checked every tick, so signing in stops it), only while the tab is visible,
 *    and only on a page the admin allowed;
 *  - never again once a lead has been submitted.
 *
 * The schedule lives in localStorage, so it carries across page changes and reloads.
 */
@Injectable({ providedIn: 'root' })
export class OfferPopupService {
  private readonly offers = inject(OfferService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  readonly offer = signal<PublicOffer | null>(null);
  readonly isOpen = signal(false);
  /** The small "call me back" modal. */
  readonly callbackOpen = signal(false);

  private config: PopupConfig | null = null;
  private timer?: ReturnType<typeof setInterval>;
  private started = false;
  private path = '/';

  /** Called once by the website layout. Safe to call again; does nothing for signed-in users or without storage. */
  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    if (this.auth.isAuthenticated() || offerStore.claimed()) return;

    this.path = this.cleanPath(this.router.url);
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.path = this.cleanPath(e.urlAfterRedirects);
    });

    this.offers.popupConfig(visitorId()).subscribe({
      next: (cfg) => {
        if (!cfg.enabled || (!cfg.offer && !cfg.callback_enabled)) return;
        this.config = cfg;
        this.beginCounting();
      },
      error: () => undefined,
    });
  }

  /** Closing without claiming: the next popup is timed from now. */
  dismiss(): void {
    offerStore.setClosedAt(Date.now());
    this.isOpen.set(false);
  }

  /** Closing the call-back modal (sent or not): the offer popups are timed from now. */
  closeCallback(): void {
    offerStore.setClosedAt(Date.now());
    this.callbackOpen.set(false);
  }

  /** "Claim My Offer": the funnel click is recorded, then the visitor is taken to the landing page. */
  claim(): void {
    const o = this.offer();
    if (!o) return;
    this.offers.track('click', o.id, visitorId(), this.path);
    offerStore.setClosedAt(Date.now());
    this.isOpen.set(false);
    void this.router.navigate(['/offers', o.slug], { queryParams: { src: 'popup' } });
  }

  // ── schedule ──────────────────────────────────────────────────────────────────

  private beginCounting(): void {
    if (!offerStore.firstSeen()) offerStore.setFirstSeen(Date.now());

    // Outside Angular's zone: a 1-second timer must not trigger change detection every second.
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => this.tick(), 1000);
    });
  }

  private stopCounting(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  private tick(): void {
    if (this.auth.isAuthenticated() || offerStore.claimed()) {
      this.stopCounting();
      return;
    }
    if (this.isOpen() || this.callbackOpen()) return;
    if (document.visibilityState !== 'visible') return; // tab in the background: nothing pops up
    const cfg = this.config;
    if (!cfg || !this.pageAllowed(cfg.pages ?? [], this.path)) return;

    // First, once per browser: the small call-back request. It is the "direct website open" popup.
    if (cfg.callback_enabled && !offerStore.callbackShown()) {
      this.zone.run(() => this.showCallback());
      return;
    }
    if (!cfg.offer) return;

    if (Date.now() >= this.dueAt(cfg)) this.zone.run(() => this.show(cfg.offer as PublicOffer));
  }

  /** When the next popup is due: the first from the first visit, the second and later from the last close. */
  private dueAt(cfg: PopupConfig): number {
    const shown = offerStore.shownCount();
    // The first offer is timed from the first visit, or from when the call-back modal was closed if that came later.
    if (shown === 0) return Math.max(offerStore.firstSeen() || Date.now(), offerStore.closedAt()) + (cfg.first_delay_seconds ?? 15) * 1000;

    return offerStore.closedAt() + (shown === 1 ? (cfg.second_delay_seconds ?? 120) : (cfg.repeat_gap_seconds ?? 900)) * 1000;
  }

  private showCallback(): void {
    offerStore.markCallbackShown();
    offerStore.setClosedAt(Date.now()); // so the offer timing starts after it, even if it is left open
    this.callbackOpen.set(true);
  }

  private show(offer: PublicOffer): void {
    offerStore.setShownCount(offerStore.shownCount() + 1);
    offerStore.setClosedAt(Date.now()); // so a popup left open still spaces the next one
    this.offer.set(offer);
    this.isOpen.set(true);
    this.offers.track('impression', offer.id, visitorId(), this.path);
  }

  // ── rules ─────────────────────────────────────────────────────────────────────

  private cleanPath(url: string): string {
    const p = url.split(/[?#]/)[0] || '/';

    return p.length > 1 ? p.replace(/\/+$/, '') : '/';
  }

  /** The popup is for marketing pages only; the admin may narrow it further with page patterns. */
  pageAllowed(pages: string[], path: string): boolean {
    if (NEVER.some((n) => path === n.replace(/\/$/, '') || path.startsWith(n))) return false;
    if (pages.length === 0 || pages.includes('*')) return true;

    return pages.some((p) => (p.endsWith('/*') ? path === p.slice(0, -2) || path.startsWith(p.slice(0, -1)) : path === p));
  }
}
