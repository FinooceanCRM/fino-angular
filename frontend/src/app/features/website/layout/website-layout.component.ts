import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '@core/services/auth.service';

import { NewsletterFormComponent } from '../shared/newsletter-form.component';
import { DecryptTextDirective } from '../shared/decrypt-text.directive';
import { CallbackPopupComponent } from '../offers/callback-popup.component';
import { OfferPopupComponent } from '../offers/offer-popup.component';
import { ContactFabComponent } from '../shared/contact-fab.component';
import { RollTextDirective } from '../shared/roll-text.directive';
import { MAIN_NAV, MORE_SERVICES, WEBSITE } from '../website.config';
import { searchProducts } from '../loan-search';
import type { ProductPage } from '../product-pages.data';
import { loanIcon } from '../loan-images';

/**
 * Public marketing-site shell: top bar, header (with the "More Services"
 * dropdown), footer and the mobile tab bar. Sits beside — never inside — the
 * authenticated CRM shell (see app.routes.ts), so none of the internal
 * navigation is ever rendered here.
 */
@Component({
  selector: 'app-website-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NewsletterFormComponent, DecryptTextDirective, RollTextDirective, ContactFabComponent, OfferPopupComponent, CallbackPopupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.fit]': 'fit()' },
  template: `
    <a class="skip" href="#main">Skip to content</a>

    <div class="utility">
      <div class="fw-container utility__inner">
        <span class="u-item"><span class="material-icons">mail_outline</span> {{ site.email }}</span>
        <span class="u-item"><span class="material-icons">schedule</span> {{ site.hours }}</span>
        <span class="utility__mid">Your Trusted Financial Partner</span>
        @if (!signedIn()) { <a routerLink="/login">Login</a> }
        <a routerLink="/faq">FAQs</a>
        <a routerLink="/privacy-policy">Privacy</a>
        <a routerLink="/terms">Terms</a>
      </div>
    </div>

    <header class="header">
      <div class="header__inner">
        <a routerLink="/" class="brand" aria-label="FINOOCEAN home">
          <img class="brand__mark" src="/images/logo/mark.png" alt="" width="38" height="38" />
          <span class="brand__text">
            <strong>{{ site.brand }}</strong>
            <small>{{ site.tagline }}</small>
          </span>
        </a>

        <nav class="nav" aria-label="Main">
          @for (item of nav; track item.link) {
            <a [routerLink]="item.link" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: item.exact }">{{ item.label }}</a>
            @if (item.label === 'Services') {
              <!-- "More Services" is only a dropdown, it has no page of its own. -->
              <div class="more">
                <button type="button" class="more__btn" [class.is-active]="moreActive()" [attr.aria-expanded]="moreOpen()" aria-haspopup="menu" (click)="toggleMore($event)">
                  More Services <span class="material-icons">expand_more</span>
                </button>
                @if (moreOpen()) {
                  <div class="more__menu" role="menu">
                    @for (m of moreServices; track m.link) {
                      <a role="menuitem" [routerLink]="m.link"><span class="material-icons">{{ m.icon }}</span><span><b>{{ m.label }}</b><small>{{ m.hint }}</small></span></a>
                    }
                  </div>
                }
              </div>
            }
          }
        </nav>

        <form class="search" role="search" (submit)="search($event, q.value)">
          <input #q type="search" name="q" placeholder="Search loans, e.g. home, business, MUDRA…" aria-label="Search loans" autocomplete="off" (input)="liveSearch(q.value)" (blur)="closeSuggestions()" />
          <button type="submit" aria-label="Search"><span class="material-icons">search</span></button>
          @if (suggestions().length) {
            <ul class="suggest" role="listbox" aria-label="Matching loans">
              @for (s of suggestions(); track s.slug) {
                <li><a role="option" [routerLink]="['/services', s.slug]" (click)="suggestions.set([])">
                  @if (icon(s.slug); as src) { <img [src]="src" alt="" width="28" height="28" /> } @else { <span class="material-icons">{{ s.icon }}</span> }
                  <span><b>{{ s.name }}</b><small>{{ s.tagline }}</small></span></a></li>
              }
              <li class="suggest__all"><a [routerLink]="['/services']" [queryParams]="{ q: query() }" (click)="suggestions.set([])">See all results for “{{ query() }}” →</a></li>
            </ul>
          }
        </form>

        <div class="header__actions">
          <a class="phone" [href]="site.phoneHref">
            <span class="material-icons">phone_in_talk</span>
            <span><small>Call anytime</small><strong>{{ site.phone }}</strong></span>
          </a>
          @if (signedIn()) {
            <a class="fw-btn fw-btn--primary fw-btn--sm" [routerLink]="homeLink()">{{ isCustomer() ? 'My Account' : 'My Dashboard' }}</a>
          } @else {
            <!-- One sign-in for customers and staff; the app routes each role to its own dashboard. -->
            <a class="fw-btn fw-btn--ghost fw-btn--sm login-btn" routerLink="/login">Login</a>
            <a class="fw-btn fw-btn--primary fw-btn--sm req-btn" routerLink="/apply">Request a Loan</a>
          }
          <button type="button" class="burger" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()" aria-label="Menu">
            <span class="material-icons">{{ menuOpen() ? 'close' : 'menu' }}</span>
          </button>
        </div>
      </div>

      @if (menuOpen()) {
        <nav class="drawer" aria-label="Mobile">
          <form class="search search--drawer" role="search" (submit)="search($event, dq.value)">
            <input #dq type="search" name="q" placeholder="Search loans…" aria-label="Search loans" autocomplete="off" (input)="liveSearch(dq.value)" />
            <button type="submit" aria-label="Search"><span class="material-icons">search</span></button>
          </form>
          @for (item of nav; track item.link) {
            <a [routerLink]="item.link" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: item.exact }">{{ item.label }}</a>
            @if (item.label === 'Services') {
              <button type="button" class="drawer__more" [attr.aria-expanded]="drawerMore()" (click)="drawerMore.set(!drawerMore())">
                More Services <span class="material-icons">{{ drawerMore() ? 'expand_less' : 'expand_more' }}</span>
              </button>
              @if (drawerMore()) {
                @for (m of moreServices; track m.link) { <a class="drawer__sub" [routerLink]="m.link">{{ m.label }}</a> }
              }
            }
          }
          <div class="drawer__cta">
            @if (signedIn()) {
              <a class="fw-btn fw-btn--primary fw-btn--block" [routerLink]="homeLink()">{{ isCustomer() ? 'My Account' : 'My Dashboard' }}</a>
            } @else {
              <a class="fw-btn fw-btn--ghost fw-btn--block" routerLink="/login">Login / Register</a>
              <a class="fw-btn fw-btn--primary fw-btn--block" routerLink="/apply">Request a Loan</a>
            }
          </div>
        </nav>
      }
    </header>

    <main id="main"><router-outlet /></main>

    @if (!fit()) {
    <footer class="footer">
      <div class="fw-container footer__grid">
        <div>
          <img class="footer__logo" src="/images/logo/logo-light.png" alt="{{ site.brand }} — your trusted financial solution" width="881" height="283" />
          <p class="footer__about" appDecrypt>Empowering individuals and businesses with smart financial solutions.</p>
        </div>
        <div>
          <h4 appDecrypt>Quick Links</h4>
          <a appDecrypt routerLink="/">Home</a>
          <a appDecrypt routerLink="/about">About Us</a>
          <a appDecrypt routerLink="/services">Services</a>
          <a appDecrypt routerLink="/calculator">More Services</a>
          <a appDecrypt routerLink="/blog">News</a>
          <a appDecrypt routerLink="/contact">Contact Us</a>
        </div>
        <div>
          <h4>Our Services</h4>
          <a appRoll routerLink="/services/personal-loan">Personal Loan</a>
          <a appRoll routerLink="/services/business-loan">Business Loan</a>
          <a appRoll routerLink="/services/home-loan">Home Loan</a>
          <a appRoll routerLink="/services/loan-against-property">Loan Against Property</a>
          <a appRoll routerLink="/services/car-loan">Car Loan</a>
          <a appRoll routerLink="/services/education-loan">Education Loan</a>
          <a appRoll routerLink="/services">View All Services</a>
        </div>
        <div>
          <h4 appDecrypt>Support</h4>
          <a appDecrypt routerLink="/faq">FAQ</a>
          <a appDecrypt routerLink="/calculator">Loan Calculator</a>
          <a appDecrypt routerLink="/eligibility">Loan Eligibility</a>
          <a appDecrypt routerLink="/apply">Apply Now</a>
          <a appDecrypt routerLink="/testimonials">Testimonials</a>
          <a appDecrypt routerLink="/privacy-policy">Privacy Policy</a>
          <a appDecrypt routerLink="/terms">Terms &amp; Conditions</a>
        </div>
        <div>
          <h4>Contact Us</h4>
          <span appDecrypt>{{ site.address }}</span>
          <a [href]="site.phoneHref">{{ site.phone }}</a>
          <a [href]="'mailto:' + site.email">{{ site.email }}</a>
          <span appDecrypt>{{ site.hours }}</span>
          <h4 class="nl-h">Subscribe to Newsletter</h4>
          <span>Get latest updates and financial tips.</span>
          <app-newsletter-form />
        </div>
      </div>
      <div class="footer__legal">
        <div class="fw-container legal">
          <span>© {{ year }} {{ site.legalName }}. All rights reserved. FINOOCEAN is a loan facilitator; loan approval, rates and terms are decided by lenders.</span>
          <span>Building Financially Stronger India · #GrowWithFinoocean</span>
        </div>
      </div>
    </footer>
    }

    @if (!fit()) {
    <div class="alert-bar" role="region" aria-label="Fraud awareness notice">
      <div class="alert-bar__track">
        <div class="alert-bar__move">
          @for (copy of [1, 2]; track copy) {
            <div class="alert-bar__group" [attr.aria-hidden]="copy === 2">
              <span><b>Stay Alert. Stay Secure. Grow with FINOOCEAN.</b></span>
              <span>Never share your OTP, PIN, CVV or passwords with anyone — not even someone claiming to be from {{ site.brand }}.</span>
              <span>Make payments only to official, verified accounts. {{ site.brand }} is not responsible for payments made to other accounts.</span>
              <span>Do not trust calls, SMS or WhatsApp messages promising guaranteed loans or asking for advance fees.</span>
              <span class="alert-bar__cta">Suspicious activity? Call {{ site.phone }} or write to {{ site.email }}</span>
            </div>
          }
        </div>
      </div>
    </div>
    }

    <app-contact-fab />
    <app-callback-popup />
    <app-offer-popup />

    <nav class="tabbar" aria-label="Quick">
      <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }"><span class="material-icons">home</span>Home</a>
      <a routerLink="/services" routerLinkActive="on"><span class="material-icons">groups</span>Services</a>
      <a routerLink="/apply" class="fab"><span class="material-icons">description</span>Apply</a>
      <a routerLink="/calculator" routerLinkActive="on"><span class="material-icons">calculate</span>Calculator</a>
      <button type="button" (click)="menuOpen.set(!menuOpen()); scrollTop()"><span class="material-icons">menu</span>Menu</button>
    </nav>
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
        display: block;
        min-height: 100vh;
        background: #fff;
        color: var(--fw-ink);
        font-family: Poppins, system-ui, sans-serif;
      }
      /* Sign-in pages (/login, /register): exactly one screen tall on desktop, so the page never scrolls. */
      @media (min-width: 901px) {
        :host(.fit) { height: 100dvh; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
        :host(.fit) main { flex: 1; min-height: 0; display: flex; flex-direction: column; }
      }
      .skip { position: absolute; left: -999px; top: 0; background: #fff; padding: 8px 12px; z-index: 100; }
      .skip:focus { left: 8px; top: 8px; }
      .material-icons { font-size: 18px; vertical-align: middle; }
      .utility { background: var(--fw-navy); color: #cfe0ff; font-size: 0.76rem; }
      .utility__inner { display: flex; align-items: center; gap: 20px; min-height: 34px; }
      .utility__mid { flex: 1; text-align: center; color: #5aa2ff; font-weight: 500; }
      .utility a { color: #cfe0ff; text-decoration: none; }
      .utility a:hover { color: #fff; text-decoration: underline; }
      .header { position: sticky; top: 0; z-index: 50; background: #fff; border-bottom: 1px solid var(--fw-line); }
      .header__inner { display: flex; align-items: center; gap: 22px; min-height: 68px; width: 100%; box-sizing: border-box; padding: 0 clamp(16px, 3vw, 48px); }
      .brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--fw-navy); flex: none; }
      .brand__mark { width: 38px; height: 38px; border-radius: 10px; object-fit: cover; display: block; }
      .footer__logo { display: block; width: 100%; max-width: 250px; height: auto; margin-left: -8px; }
      .brand__text { display: flex; flex-direction: column; line-height: 1.1; }
      .brand__text strong { font-size: 1.2rem; letter-spacing: 0.5px; }
      .brand__text small { font-size: 0.62rem; color: var(--fw-muted); }
      .brand--light { color: #fff; }
      /* Very small phones (320px): shrink the brand so logo + Login + menu button still fit on one row. */
      @media (max-width: 360px) { .brand { gap: 6px; } .brand__mark { width: 32px; height: 32px; } .brand__text strong { font-size: 1rem; } .brand__text small { display: none; } .header__actions { gap: 6px; } }
      .brand--light small { color: #9db6dd; }
      .nav { display: flex; gap: 2px; align-items: center; flex: none; }
      .nav > a, .more__btn { padding: 8px 10px; border-radius: 8px; color: var(--fw-ink); text-decoration: none; font: 500 0.87rem Poppins, sans-serif; background: none; border: 0; cursor: pointer; white-space: nowrap; }
      .nav > a:hover, .more__btn:hover { background: var(--fw-blue-soft); }
      .nav > a.is-active, .more__btn.is-active { color: var(--fw-blue); box-shadow: inset 0 -2px 0 var(--fw-blue); border-radius: 8px 8px 0 0; }
      .more { position: relative; }
      .more__btn { display: inline-flex; align-items: center; gap: 2px; }
      .more__menu { position: absolute; top: calc(100% + 8px); left: 0; min-width: 260px; background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; box-shadow: 0 12px 32px rgba(8, 42, 85, 0.16); padding: 8px; z-index: 60; display: grid; gap: 2px; }
      .more__menu a { display: flex; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 8px; color: var(--fw-ink); text-decoration: none; }
      .more__menu a:hover { background: var(--fw-blue-soft); }
      .more__menu .material-icons { color: var(--fw-blue); font-size: 22px; }
      .more__menu b { display: block; font-size: 0.88rem; font-weight: 600; }
      .more__menu small { color: var(--fw-muted); font-size: 0.74rem; }
      .search { display: flex; align-items: center; flex: 1; min-width: 160px; max-width: 560px; position: relative; border: 1.5px solid var(--fw-line-strong); border-radius: 10px; background: #fff; }
      .suggest { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 60; list-style: none; margin: 0; padding: 6px; background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; box-shadow: 0 14px 34px rgba(16, 33, 58, 0.18); }
      .suggest a { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; text-decoration: none; color: var(--fw-ink); } .suggest a:hover { background: var(--fw-blue-soft); }
      .suggest img { width: 28px; height: 28px; object-fit: contain; } .suggest .material-icons { color: var(--fw-blue); }
      .suggest span:last-child { display: grid; line-height: 1.25; } .suggest b { font-size: 0.86rem; } .suggest small { color: var(--fw-muted); font-size: 0.72rem; }
      .suggest__all a { justify-content: center; color: var(--fw-blue); font-weight: 600; font-size: 0.82rem; }
      .search:focus-within { border-color: var(--fw-blue); box-shadow: 0 0 0 3px rgba(28, 109, 240, 0.15); }
      .search input { flex: 1; min-width: 0; border: 0; outline: 0; padding: 0 12px; height: 38px; font: 400 0.85rem Poppins, sans-serif; background: transparent; }
      .search button { border: 0; background: none; padding: 0 10px; cursor: pointer; color: var(--fw-muted); height: 38px; }
      .header__actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }
      .phone { display: flex; gap: 8px; align-items: center; color: var(--fw-navy); text-decoration: none; }
      .phone small { display: block; font-size: 0.62rem; color: var(--fw-muted); line-height: 1; letter-spacing: 0.5px; text-transform: uppercase; }
      .phone strong { font-size: 0.88rem; white-space: nowrap; }
      .burger { display: none; background: none; border: 0; padding: 6px; cursor: pointer; color: var(--fw-navy); }
      .drawer { display: none; flex-direction: column; padding: 8px 20px 18px; border-top: 1px solid var(--fw-line); background: #fff; max-height: calc(100vh - 110px); overflow: auto; }
      .drawer > a, .drawer__more { padding: 12px 4px; color: var(--fw-ink); text-decoration: none; border-bottom: 1px solid var(--fw-line); background: none; border-left: 0; border-right: 0; border-top: 0; text-align: left; font: 500 1rem Poppins, sans-serif; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
      .drawer > a.is-active { color: var(--fw-blue); font-weight: 600; }
      .drawer > a.drawer__sub { padding-left: 20px; font-size: 0.92rem; color: var(--fw-muted); }
      .search--drawer { max-width: none; margin: 8px 0; }
      .drawer__cta { display: grid; gap: 10px; margin-top: 14px; }
      .footer { background: var(--fw-navy); color: #cfe0ff; }
      .nl-h { margin-top: 14px; } .footer__grid { display: grid; grid-template-columns: 1.3fr 0.9fr 1.1fr 1fr 1.3fr; gap: 28px; padding-top: 40px; padding-bottom: 28px; }
      .footer h4 { color: #fff; margin: 0 0 12px; font-size: 0.92rem; }
      .footer a, .footer span { display: block; color: #cfe0ff; font-size: 0.82rem; text-decoration: none; margin-bottom: 8px; }
      .footer a:hover { color: #fff; text-decoration: underline; }
      .footer a.roll-link:hover { text-decoration: none; }
      .footer .roll-link ::ng-deep .roll-w { display: inline-block; white-space: nowrap; }
      .footer .roll-link ::ng-deep .roll-c { display: inline-block; height: 1.4em; line-height: 1.4em; overflow: hidden; vertical-align: top; }
      .footer .roll-link ::ng-deep .roll-s { display: flex; flex-direction: column; transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1); }
      .footer .roll-link:hover ::ng-deep .roll-s, .footer .roll-link:focus-visible ::ng-deep .roll-s { transform: translateY(-50%); }
      @media (prefers-reduced-motion: reduce) { .footer .roll-link ::ng-deep .roll-s { transition: none; } }
      .footer__about { font-size: 0.82rem; line-height: 1.6; margin-top: 14px; max-width: 300px; }
      .footer__legal { border-top: 1px solid rgba(255, 255, 255, 0.12); padding: 14px 0; font-size: 0.72rem; color: #9db6dd; }
      .legal { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .footer__legal span { display: inline; margin: 0; font-size: inherit; color: inherit; }
      .tabbar { display: none; }
      .alert-bar { position: relative; display: flex; align-items: center; height: 38px; background: linear-gradient(90deg, var(--fw-navy), var(--fw-navy-2)); border-top: 2px solid var(--fw-blue); color: #fff; font-size: 0.8rem; overflow: hidden; }
      .alert-bar__track { flex: 1; overflow: hidden; min-width: 0; }
      .alert-bar__move { display: flex; width: max-content; animation: alert-scroll 55s linear infinite; }
      .alert-bar:hover .alert-bar__move { animation-play-state: paused; }
      .alert-bar__group { display: flex; flex: none; }
      .alert-bar__group span { white-space: nowrap; padding-right: 56px; }
      .alert-bar__group span::before { content: '\\2022'; color: #5aa2ff; margin-right: 56px; margin-left: -28px; }
      .alert-bar__group span:first-child::before { content: none; }
      .alert-bar__cta { color: #5aa2ff; font-weight: 600; }
      @keyframes alert-scroll { to { transform: translateX(-50%); } }
      @media (prefers-reduced-motion: reduce) { .alert-bar__move { animation-duration: 160s; } }
      @media (max-width: 1180px) {
        .phone { display: none; }
        .search { max-width: 320px; }
      }
      @media (max-width: 1020px) {
        .nav, .search:not(.search--drawer), .utility { display: none; }
        .burger { display: inline-flex; }
        .drawer { display: flex; }
        .footer__grid { grid-template-columns: 1fr 1fr 1fr; }
        :host { padding-bottom: 72px; }
        .tabbar { display: grid; grid-template-columns: repeat(5, 1fr); position: fixed; left: 0; right: 0; bottom: 0; z-index: 55; background: #fff; border-top: 1px solid var(--fw-line); padding: 6px 4px calc(6px + env(safe-area-inset-bottom)); box-shadow: 0 -4px 16px rgba(8, 42, 85, 0.08); }
        .tabbar a, .tabbar button { display: grid; justify-items: center; gap: 2px; font: 500 0.68rem Poppins, sans-serif; color: var(--fw-muted); text-decoration: none; background: none; border: 0; cursor: pointer; padding: 4px 0; }
        .tabbar .on { color: var(--fw-blue); font-weight: 600; }
        .tabbar .fab { color: #fff; background: var(--fw-blue); border-radius: 18px; margin: -18px 6px 0; padding: 10px 0; box-shadow: 0 6px 16px rgba(28, 109, 240, 0.4); }
        .tabbar .material-icons { font-size: 22px; }
      }
      @media (max-width: 640px) {
        .footer__grid { grid-template-columns: 1fr 1fr; }
        .req-btn { display: none; } /* still on the tab bar and in the menu */
      }
      @media (max-width: 420px) {
        .footer__grid { grid-template-columns: 1fr; }
      }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly site = WEBSITE;
  protected readonly nav = MAIN_NAV;
  protected readonly moreServices = MORE_SERVICES;
  protected readonly year = new Date().getFullYear();
  protected readonly menuOpen = signal(false);
  protected readonly moreOpen = signal(false);
  protected readonly drawerMore = signal(false);
  protected readonly isCustomer = computed(() => this.auth.role() === 'customer');
  protected readonly signedIn = computed(() => this.auth.isAuthenticated());
  /** Customers go to their portal; every staff role goes via /dashboard to its own workspace. */
  protected readonly homeLink = computed(() => (this.isCustomer() ? '/account' : '/dashboard'));
  /** Highlights "More Services" while one of its pages is open. */
  protected readonly moreActive = signal(false);
  /** True on the sign-in pages, which are laid out to fit the screen without scrolling. */
  protected readonly fit = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e) => {
        this.menuOpen.set(false);
        this.moreOpen.set(false);
        this.drawerMore.set(false);
        this.moreActive.set(MORE_SERVICES.some((m) => e.urlAfterRedirects.startsWith(m.link)));
        this.fit.set(/^\/(login|register)(\?|#|$)/.test(e.urlAfterRedirects));
        window.scrollTo({ top: 0 });
      });
  }

  protected toggleMore(event: Event): void {
    event.stopPropagation();
    this.moreOpen.update((v) => !v);
  }

  /** Real search: opens the services list filtered by the typed text. */
  protected search(event: Event, term: string): void {
    event.preventDefault();
    const q = term.trim();
    void this.router.navigate(['/services'], { queryParams: q ? { q } : {} });
  }

  protected readonly suggestions = signal<ProductPage[]>([]);
  protected readonly query = signal('');
  private searchTimer?: ReturnType<typeof setTimeout>;

  protected icon(slug: string): string | null {
    return loanIcon(slug);
  }

  /** Delayed so a click on a suggestion lands before the list disappears. */
  protected closeSuggestions(): void {
    setTimeout(() => this.suggestions.set([]), 180);
  }

  /** Live search: filters the services list as the user types, and shows everything again when cleared — no reload. */
  protected liveSearch(term: string): void {
    const typed = term.trim();
    this.query.set(typed);
    this.suggestions.set(typed ? searchProducts(typed).slice(0, 5) : []);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      const q = term.trim();
      const onServices = this.router.url.split('?')[0] === '/services';
      if (!q && !onServices) return;
      void this.router.navigate(['/services'], { queryParams: q ? { q } : {}, replaceUrl: onServices });
    }, 250);
  }

  protected scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (this.moreOpen() && !this.host.nativeElement.querySelector('.more')?.contains(event.target as Node)) {
      this.moreOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.moreOpen.set(false);
    this.menuOpen.set(false);
  }
}
