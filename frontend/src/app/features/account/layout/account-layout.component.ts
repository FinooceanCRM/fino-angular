import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { CustomerPortalService } from '@core/services/customer-portal.service';
import { CustomerProfileService } from '@core/services/customer-profile.service';

import { WEBSITE } from '../../website/website.config';

interface NavLink {
  label: string;
  link: string;
  exact?: boolean;
}

/**
 * Customer-portal shell (/account): top header, navy sidebar and the page
 * outlet. Never rendered for staff — see customerGuard in account.routes.ts.
 * Also defines the --fw-* design tokens the portal pages and the shared
 * website-ui.scss primitives rely on.
 */
@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="top">
      <button type="button" class="burger" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()" aria-label="Menu">
        <span class="material-icons">{{ menuOpen() ? 'close' : 'menu' }}</span>
      </button>
      <a routerLink="/account" class="brand" aria-label="FINOOCEAN account home">
        <img class="brand__mark" src="/images/logo/mark.png" alt="" width="38" height="38" />
        <span class="brand__text"><strong>{{ site.brand }}</strong><small>{{ site.tagline }}</small></span>
      </a>
      <nav class="top__nav" aria-label="Website">
        <a routerLink="/">Home</a>
        <a routerLink="/services">Services</a>
      </nav>
      <form class="search" role="search" (submit)="search($event, q.value)">
        <span class="material-icons" aria-hidden="true">search</span>
        <input #q type="search" name="q" placeholder="Search anything…" aria-label="Search loans" autocomplete="off" />
      </form>
      <a class="phone" [href]="site.phoneHref">
        <span class="material-icons" aria-hidden="true">phone_in_talk</span>
        <span><small>Call anytime</small><strong>{{ site.phone }}</strong></span>
      </a>
      <a class="bell" routerLink="/account/notifications" aria-label="Notifications">
        <span class="material-icons">notifications_none</span>
        @if (unread() > 0) { <b>{{ unread() > 9 ? '9+' : unread() }}</b> }
      </a>
      <a class="me" routerLink="/account/profile">
        @if (photo(); as src) { <img class="me__av" [src]="src" alt="" /> } @else { <span class="me__av me__av--init">{{ initials() }}</span> }
        <span class="me__t"><strong>{{ name() }}</strong><small>Customer</small></span>
      </a>
    </header>

    <div class="body">
      @if (menuOpen()) { <button type="button" class="scrim" (click)="menuOpen.set(false)" aria-label="Close menu"></button> }
      <aside class="side" [class.open]="menuOpen()">
        <nav aria-label="Account">
          <a class="item" routerLink="/account" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }"><span class="material-icons">home</span>Dashboard</a>
          <a class="item" routerLink="/account/applications" routerLinkActive="on"><span class="material-icons">description</span>My Applications</a>

          <button type="button" class="item item--btn" [class.on-group]="servicesActive()" [attr.aria-expanded]="servicesOpen()" (click)="servicesOpen.set(!servicesOpen())">
            <span class="material-icons">account_balance</span>Services<span class="material-icons chev" [class.up]="servicesOpen()">expand_more</span>
          </button>
          @if (servicesOpen()) {
            <div class="sub">
              @for (l of services; track l.link) { <a routerLink="{{ l.link }}" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">{{ l.label }}</a> }
            </div>
          }

          <a class="item" routerLink="/account/documents" routerLinkActive="on"><span class="material-icons">folder_open</span>My Documents</a>
          <a class="item" routerLink="/account/offers" routerLinkActive="on"><span class="material-icons">local_offer</span>Offers for Me</a>
          <a class="item" routerLink="/account/notifications" routerLinkActive="on"><span class="material-icons">notifications</span>Notifications@if (unread() > 0) { <b class="count">{{ unread() }}</b> }</a>
          <a class="item" routerLink="/account/help" routerLinkActive="on"><span class="material-icons">help</span>Support / Help</a>
          <a class="item" routerLink="/account/settings" routerLinkActive="on"><span class="material-icons">settings</span>Settings</a>

          <button type="button" class="item item--btn" [class.on-group]="profileActive()" [attr.aria-expanded]="profileOpen()" (click)="profileOpen.set(!profileOpen())">
            <span class="material-icons">person</span>Profile<span class="material-icons chev" [class.up]="profileOpen()">expand_more</span>
          </button>
          @if (profileOpen()) {
            <div class="sub">
              @for (l of profile; track l.link) { <a routerLink="{{ l.link }}" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">{{ l.label }}</a> }
            </div>
          }

          <a class="item" routerLink="/account/logout" routerLinkActive="on"><span class="material-icons">logout</span>Logout</a>
        </nav>
      </aside>

      <main class="main" id="main"><router-outlet /></main>
    </div>

    <nav class="dock" aria-label="Quick actions">
      <div class="dock__row dock__row--cta">
        <a class="dock__side" [href]="site.phoneHref"><span class="material-icons">call</span>Call</a>
        <a class="dock__apply" routerLink="/account/apply"><span class="material-icons">description</span>Apply for New Loan</a>
        <a class="dock__side dock__side--wa" [href]="site.whatsappHref" target="_blank" rel="noopener"><span class="material-icons">chat</span>WhatsApp</a>
      </div>
    </nav>

    <a class="help" routerLink="/account/help" aria-label="Talk to support"><span class="material-icons">headset_mic</span></a>
  `,
  styles: [
    `
      :host {
        --fw-navy: #082a55;
        --fw-navy-2: #0d3a75;
        --fw-blue: #1c6df0;
        --fw-blue-dark: #1558c8;
        --fw-blue-soft: #eef4ff;
        --fw-ink: #10213a;
        --fw-muted: #5b6b82;
        --fw-line: #e3eaf4;
        --fw-line-strong: #c5d3ea;
        --fw-red: #d33a2c;
        --top-h: 80px;
        display: block;
        min-height: 100vh;
        background: #f4f7fc;
        color: var(--fw-ink);
        font-family: Poppins, system-ui, sans-serif;
      }
      .material-icons { font-size: 20px; vertical-align: middle; }
      a { color: inherit; text-decoration: none; }

      .top { position: sticky; top: 0; z-index: 30; height: var(--top-h); box-sizing: border-box; display: flex; align-items: center; gap: 22px; padding: 0 24px; background: #fff; border-top: 7px solid var(--fw-navy); border-bottom: 1px solid var(--fw-line); }
      .burger { display: none; background: none; border: 0; cursor: pointer; color: var(--fw-navy); padding: 4px; }
      .brand { display: flex; align-items: center; gap: 10px; flex: none; }
      .brand__text { display: grid; line-height: 1.15; } .brand__text strong { font-size: 1.25rem; letter-spacing: 0.5px; color: var(--fw-navy); } .brand__text small { font-size: 0.7rem; color: var(--fw-muted); }
      .top__nav { display: flex; gap: 28px; font-weight: 500; margin-left: 12px; } .top__nav a:hover { color: var(--fw-blue); }
      .search { flex: 1; max-width: 400px; margin-left: auto; display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px; border: 1px solid var(--fw-line-strong); border-radius: 999px; background: #fff; box-sizing: border-box; }
      .search:focus-within { border-color: var(--fw-blue); box-shadow: 0 0 0 3px rgba(28, 109, 240, 0.15); } .search .material-icons { color: var(--fw-blue); }
      .search input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 0.92rem; color: var(--fw-ink); }
      .phone { display: flex; align-items: center; gap: 8px; flex: none; } .phone > .material-icons { color: var(--fw-blue); font-size: 28px; } .phone span:last-child { display: grid; line-height: 1.15; } .phone small { font-size: 0.62rem; letter-spacing: 0.3px; text-transform: uppercase; color: var(--fw-muted); } .phone strong { font-size: 0.95rem; color: var(--fw-navy); }
      .bell { position: relative; display: grid; place-items: center; width: 40px; height: 40px; color: var(--fw-blue); flex: none; } .bell .material-icons { font-size: 28px; }
      .bell b { position: absolute; top: 0; right: 0; min-width: 18px; height: 18px; border-radius: 9px; background: #e5342b; color: #fff; font-size: 0.68rem; display: grid; place-items: center; padding: 0 4px; box-sizing: border-box; }
      .me { display: flex; align-items: center; gap: 10px; flex: none; }
      .me__av { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--fw-blue-soft); } .me__av--init { display: grid; place-items: center; background: linear-gradient(135deg, var(--fw-blue), var(--fw-navy-2)); color: #fff; font-weight: 600; }
      .me__t { display: grid; line-height: 1.2; } .me__t strong { font-size: 0.95rem; color: var(--fw-navy); } .me__t small { font-size: 0.78rem; color: var(--fw-muted); }

      .body { display: flex; align-items: flex-start; }
      .side { width: 261px; flex: none; position: sticky; top: var(--top-h); height: calc(100vh - var(--top-h)); overflow-y: auto; background: var(--fw-navy); color: #e6eefc; padding: 14px 0 24px; box-sizing: border-box; }
      .item { display: flex; align-items: center; gap: 14px; width: 100%; box-sizing: border-box; padding: 11px 22px; font: 500 1rem Poppins, sans-serif; color: #e6eefc; background: none; border: 0; cursor: pointer; text-align: left; transition: background 0.15s; }
      .item:hover { background: rgba(255, 255, 255, 0.07); } .item.on { background: rgba(255, 255, 255, 0.12); color: #fff; } .item .material-icons { font-size: 22px; }
      .chev { margin-left: auto; transition: transform 0.2s; } .chev.up { transform: rotate(180deg); }
      .count { margin-left: auto; min-width: 22px; height: 22px; border-radius: 11px; background: #e5342b; color: #fff; font-size: 0.75rem; display: grid; place-items: center; padding: 0 6px; box-sizing: border-box; }
      .sub { display: grid; gap: 2px; margin: 2px 0 6px 28px; padding: 0 12px 0 0; border-left: 1px solid rgba(255, 255, 255, 0.18); }
      .sub a { padding: 9px 16px; margin-left: 14px; border-radius: 10px; font-size: 0.92rem; font-weight: 500; color: #cfe0ff; } .sub a:hover { background: rgba(255, 255, 255, 0.07); } .sub a.on { background: var(--fw-blue); color: #fff; }

      .main { flex: 1; min-width: 0; padding: 22px 24px 40px; box-sizing: border-box; }
      .scrim { display: none; }
      .dock { display: none; }
      .help { position: fixed; right: 24px; bottom: 24px; z-index: 25; width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, var(--fw-blue), var(--fw-navy-2)); box-shadow: 0 10px 26px rgba(8, 42, 85, 0.35); } .help .material-icons { font-size: 38px; }

      @media (max-width: 1180px) { .phone span:last-child, .me__t { display: none; } .top { gap: 14px; } }
      @media (max-width: 900px) {
        .burger { display: block; } .top__nav, .phone { display: none; } .top { padding: 0 14px; } .search { max-width: none; }
        .side { position: fixed; left: 0; top: var(--top-h); z-index: 40; transform: translateX(-100%); transition: transform 0.25s ease; } .side.open { transform: none; }
        .scrim { display: block; position: fixed; inset: var(--top-h) 0 0 0; z-index: 35; border: 0; background: rgba(8, 20, 40, 0.45); }
        .main { padding: 16px 14px 110px; } .help { display: none; }
        /* Mobile quick-action dock (light): four shortcuts on top; Call / raised Apply button / WhatsApp below. */
        .dock { display: block; position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; background: #fff; color: var(--fw-ink); padding: 8px 10px calc(8px + env(safe-area-inset-bottom)); border-top: 1px solid var(--fw-line); box-shadow: 0 -8px 24px rgba(8, 42, 85, 0.12); }
        .dock__row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 2px; }
        .dock__row a { display: grid; justify-items: center; gap: 2px; padding: 6px 2px; border-radius: 10px; font-size: 0.7rem; font-weight: 500; text-align: center; color: var(--fw-ink); line-height: 1.2; }
        .dock__row a .material-icons { font-size: 22px; color: var(--fw-blue); } .dock__row a.on { background: var(--fw-blue-soft); color: var(--fw-blue); font-weight: 600; }
        .dock__row--cta { grid-template-columns: 1fr 2fr 1fr; align-items: end; }
        .dock__row--cta a .material-icons { font-size: 26px; }
        .dock__side { font-size: 0.78rem; padding-bottom: 10px; }
        .dock__row--cta .dock__apply { margin-top: -26px; padding: 18px 10px 16px; border-radius: 16px; background: var(--fw-blue); color: #fff; font-size: 0.9rem; font-weight: 600; box-shadow: 0 8px 18px rgba(28, 109, 240, 0.4); }
        .dock__row--cta .dock__apply .material-icons { color: #fff; font-size: 32px; }
        .dock__row--cta .dock__apply:active { background: var(--fw-blue-dark); }
      }
      @media (max-width: 560px) { .brand__text small, .search { display: none; } .brand { margin-right: auto; } }
    `,
  ],
})
export class AccountLayoutComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly portal = inject(CustomerPortalService);
  private readonly profileSvc = inject(CustomerProfileService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly site = WEBSITE;
  protected readonly photo = this.profileSvc.photoUrl;
  protected readonly menuOpen = signal(false);
  protected readonly unread = signal(0);
  private readonly url = signal(this.router.url);

  protected readonly services: NavLink[] = [
    { label: 'Apply for a New Loan', link: '/account/apply' },
    { label: 'Use Loan Calculator', link: '/account/calculator' },
  ];
  protected readonly profile: NavLink[] = [
    { label: 'Personal Information', link: '/account/profile' },
    { label: 'KYC & Profile', link: '/account/profile/overview' },
    { label: 'KYC Verification', link: '/account/profile/kyc' },
    { label: 'Bank Details', link: '/account/profile/bank' },
    { label: 'UPI & Payments', link: '/account/profile/payments' },
    { label: 'Communication', link: '/account/profile/communication' },
    { label: 'Password & Security', link: '/account/profile/security' },
  ];

  protected readonly servicesActive = computed(() => this.services.some((l) => this.url().split('?')[0] === l.link));
  protected readonly profileActive = computed(() => this.url().startsWith('/account/profile'));
  private readonly servicesManual = signal<boolean | null>(null);
  private readonly profileManual = signal<boolean | null>(null);

  /** Groups open by themselves when one of their pages is showing; the customer can still toggle them. */
  protected readonly servicesOpen = Object.assign(
    computed(() => this.servicesManual() ?? this.servicesActive()),
    { set: (v: boolean) => this.servicesManual.set(v) },
  );
  protected readonly profileOpen = Object.assign(
    computed(() => this.profileManual() ?? this.profileActive()),
    { set: (v: boolean) => this.profileManual.set(v) },
  );

  protected readonly name = computed(() => this.auth.user()?.name ?? 'My account');
  protected readonly initials = computed(() =>
    this.name().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'U',
  );

  constructor() {
    this.profileSvc.loadPhoto();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.url.set(this.router.url);
        this.servicesManual.set(null);
        this.profileManual.set(null);
        this.menuOpen.set(false);
        this.refreshUnread();
      });
  }

  private refreshUnread(): void {
    this.portal.notifications(true).subscribe({
      next: (p) => this.unread.set(p.unread ?? 0),
      error: () => undefined,
    });
  }

  protected search(e: Event, q: string): void {
    e.preventDefault();
    const term = q.trim();
    void this.router.navigate(['/services'], { queryParams: term ? { q: term } : {} });
  }
}
