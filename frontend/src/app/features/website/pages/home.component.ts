import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { formatInr, summariseEmi } from '@core/utils/emi';

import { StairsDirective } from '../shared/stairs.directive';
import { IMG, loanIcon } from '../loan-images';
import { PRODUCT_PAGES } from '../product-pages.data';
import { HOME_EXTRAS } from '../site-content.data';
import { HOW_IT_WORKS, TENURE_YEARS, WHY_US } from '../website.config';
import { HScrollDirective } from '../shared/h-scroll.directive';

/** Quick-check product tabs shown in the hero (first three catalogue products, like the design). */
const TAB_COUNT = 3;

@Component({
  selector: 'app-website-home',
  standalone: true,
  imports: [HScrollDirective, RouterLink, FormsModule, StairsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ───────── Hero + quick eligibility ───────── -->
    <section class="hero">
      <div class="hero__glow" aria-hidden="true"></div>
      <div class="fw-container hero__inner">
        <div class="hero__copy">
          <span class="fw-eyebrow hero__eyebrow">Your goals · Our guidance · A brighter tomorrow</span>
          <h1 class="hero__title">Finance That Moves<br />Your <span>Life Forward</span></h1>
          <p class="hero__sub">Smart Loans. Clear Guidance. Faster Decisions.</p>
          <p class="hero__lead">FINOOCEAN provides expert-guided loan solutions for individuals and businesses, with transparent processes and personalised support.</p>
          <div class="hero__cta">
            <a class="fw-btn fw-btn--primary" routerLink="/apply">Apply Now <span class="material-icons">arrow_forward</span></a>
            <a class="fw-btn fw-btn--outline-light" routerLink="/services">Explore Loans</a>
          </div>
          <ul class="hero__points">
            <li><span class="material-icons">support_agent</span>Expert Guidance</li>
            <li><span class="material-icons">verified</span>Transparent Process</li>
            <li><span class="material-icons">favorite_border</span>Personalised Support</li>
          </ul>
        </div>

        <form class="quick" (ngSubmit)="goEligibility()" aria-label="Check your loan eligibility">
          <h2>Check Your Loan Eligibility</h2>
          <div class="tabs" role="tablist" aria-label="Loan type">
            @for (p of tabs(); track p.slug) {
              <button type="button" role="tab" [attr.aria-selected]="type === p.slug" [class.on]="type === p.slug" (click)="type = p.slug">{{ shortName(p) }}</button>
            }
          </div>
          <div class="fw-field">
            <label for="q-amt">Loan Amount</label>
            <div class="amount">₹ {{ amount.toLocaleString('en-IN') }}</div>
            <input id="q-amt" name="amount" type="range" min="50000" max="5000000" step="50000" [(ngModel)]="amount" />
            <div class="range-ends"><span>₹50,000</span><span>₹50,00,000</span></div>
          </div>
          <div class="fw-field">
            <label for="q-years">Loan Tenure</label>
            <select id="q-years" name="years" class="fw-select" [(ngModel)]="years">
              @for (y of tenures; track y) { <option [ngValue]="y">{{ y }} {{ y === 1 ? 'Year' : 'Years' }}</option> }
            </select>
          </div>
          <button type="submit" class="fw-btn fw-btn--primary fw-btn--block">Check Eligibility <span class="material-icons">arrow_forward</span></button>
          <ul class="quick__badges">
            <li><span class="material-icons">block</span>No Obligation</li>
            <li><span class="material-icons">lock</span>Quick &amp; Secure</li>
            <li><span class="material-icons">timer</span>Takes 1 Minute</li>
          </ul>
        </form>
      </div>
    </section>

    <!-- ───────── Our Loan & Financial Services ───────── -->
    <section class="fw-section sec-services">
      <div class="fw-container">
        <div class="head">
          <div><h2 class="fw-h2">Our Loan &amp; Financial Services</h2><p class="fw-muted fw-small">Solutions for every stage of your life</p></div>
          <a routerLink="/services" class="more">View All Services →</a>
        </div>
        @if (loading()) {
          <div class="svc-grid">@for (i of [1,2,3,4,5,6,7,8,9,10]; track i) { <div class="fw-skeleton" style="height:96px"></div> }</div>
        } @else if (failed()) {
          <div class="fw-alert fw-alert--error">We could not load our services right now. Please refresh the page.</div>
        } @else {
          <div class="svc-grid m-hscroll" appHScroll style="--m-card-w: 40%">
            @for (p of featured(); track p.slug) {
              <a class="svc" [routerLink]="['/services', p.slug]">
                <span class="svc__icon">@if (icon(p.slug); as src) { <img [src]="src" [alt]="p.name" width="28" height="28" /> } @else { <span class="material-icons">{{ p.icon }}</span> }</span>
                <span class="svc__txt"><strong>{{ p.name }}</strong><span>{{ p.tagline }}</span></span>
                <span class="svc__go material-icons" aria-hidden="true">arrow_forward</span>
              </a>
            }
          </div>
        }
      </div>
    </section>

    <!-- ───────── Why choose + EMI ───────── -->
    <section class="fw-section sec-split">
      <div class="fw-container split">
        <div>
          <h2 class="fw-h2">Why Choose FINOOCEAN?</h2>
          <div class="why m-hscroll" appHScroll style="--m-card-w: 46%">
            @for (w of why; track w.title) {
              <div class="why__item"><span class="why__icon material-icons">{{ w.icon }}</span><strong>{{ w.title }}</strong><span class="fw-small fw-muted">{{ w.text }}</span></div>
            }
          </div>
        </div>

        <form class="emi fw-card" (ngSubmit)="calculate()" aria-label="Calculate your EMI">
          <div class="emi__head"><span class="emi__badge material-icons">calculate</span>
            <div><h2 class="fw-h3">Calculate Your EMI</h2><p class="fw-small fw-muted">Plan smarter with our easy EMI calculator</p></div></div>
          <div class="emi__grid">
            <div class="emi__fields">
              <div class="fw-field"><label for="e-amt">Loan Amount</label><input id="e-amt" name="eAmt" class="fw-input" type="number" min="1000" step="10000" [(ngModel)]="eAmount" /></div>
              <div class="fw-field"><label for="e-rate">Interest Rate (% p.a.)</label><input id="e-rate" name="eRate" class="fw-input" type="number" min="0" max="40" step="0.1" [(ngModel)]="eRate" /></div>
              <div class="fw-field"><label for="e-yrs">Loan Tenure (years)</label><input id="e-yrs" name="eYrs" class="fw-input" type="number" min="1" max="30" step="1" [(ngModel)]="eYears" /></div>
              <button type="submit" class="fw-btn fw-btn--primary">Calculate EMI <span class="material-icons">arrow_forward</span></button>
            </div>
            <div class="emi__result" aria-live="polite">
              <span class="fw-small fw-muted">Estimated EMI</span>
              <strong>{{ emiText() }}</strong>
              <span class="fw-small fw-muted">per month</span>
              @if (emiError()) { <span class="fw-error">{{ emiError() }}</span> }
              <span class="emi__note">*This is an indicative estimate only. Rates are set by the lender.</span>
            </div>
          </div>
        </form>
      </div>
    </section>

    <!-- ───────── How it works + customers + insights ───────── -->
    <section class="fw-section sec-how" appStairs>
      <div class="fw-container trio">
        <div>
          <h2 class="fw-h2">How It Works?</h2>
          <p class="fw-muted fw-small">Get your loan in 4 simple steps</p>
          <ol class="how m-hscroll" appHScroll style="--m-card-w: 62%">
            @for (s of steps; track s.title; let i = $index) {
              <li class="stair" [style.--d]="i"><span class="how__n">{{ i + 1 }}</span><strong>{{ s.title }}</strong><span class="fw-small fw-muted">{{ s.text }}</span></li>
            }
          </ol>
        </div>
        <div>
          <h2 class="fw-h2">What Our Customers Say</h2>
          <figure class="quote stair" style="--d: 3">
            <span class="quote__mark" aria-hidden="true">“</span>
            <blockquote>{{ extras.testimonial.text }}</blockquote>
            <figcaption>
              <img class="av" [src]="avatar" alt="" width="40" height="40" />
              <span><strong>{{ extras.testimonial.name }}</strong><small>{{ extras.testimonial.role }}</small></span>
              <span class="stars" role="img" aria-label="5 out of 5 stars">★★★★★</span>
            </figcaption>
          </figure>
          <a routerLink="/testimonials" class="more">Read more stories →</a>
        </div>
        <div>
          <div class="head"><h2 class="fw-h2">Latest Insights</h2><a routerLink="/blog" class="more">View All →</a></div>
          @for (i of extras.insights; track i.title; let n = $index) {
            <a class="ins stair" [style.--d]="4 + n" routerLink="/blog"><img class="ins__img" [src]="thumbs[n % thumbs.length]" alt="" width="52" height="52" /><span><strong>{{ i.title }}</strong><small>{{ i.date }}</small></span></a>
          }
        </div>
      </div>
    </section>

    <!-- ───────── Banking & financial partners ───────── -->
    <section class="partners">
      <div class="fw-container">
        <h2 class="partners__t">{{ extras.partnersTitle }}</h2>
        <ul>@for (p of extras.partners; track p.name) { <li><img [src]="'/images/partners/' + p.logo" [alt]="p.name" loading="lazy" /></li> }</ul>
      </div>
    </section>

<!-- ───────── Closing call to action ───────── -->
    <section class="cta">
      <div class="fw-container cta__inner">
        <div><h2>Ready to Take the Next Step?</h2><p>Get expert advice and the right loan solution for your needs.</p></div>
        <div class="cta__btns">
          <a class="fw-btn fw-btn--primary" routerLink="/apply">Apply for a Loan <span class="material-icons">arrow_forward</span></a>
          <a class="fw-btn fw-btn--outline-light" routerLink="/contact"><span class="material-icons">headset_mic</span> Talk to an Expert</a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      /* Hero */
      .hero { position: relative; overflow: hidden; background: linear-gradient(120deg, #061a3d 0%, #0a2f66 55%, #0d4a9a 100%); color: #fff; padding: 52px 0 60px; }
      .hero__glow { position: absolute; inset: auto -10% -40% 35%; height: 120%; background: radial-gradient(closest-side, rgba(60, 140, 255, 0.35), transparent 70%); pointer-events: none; }
      .hero__inner { position: relative; display: grid; grid-template-columns: 1.35fr 1fr; gap: 40px; align-items: center; }
      .hero__eyebrow { color: #7db4ff; letter-spacing: 1px; font-size: 0.72rem; }
      .hero__title { font-size: clamp(2.2rem, 4.6vw, 3.6rem); line-height: 1.08; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.5px; }
      .hero__title span { color: #4da3ff; }
      .hero__sub { font-size: 1.15rem; font-weight: 600; margin: 0 0 6px; }
      .hero__lead { color: #cfe0ff; line-height: 1.6; max-width: 520px; margin: 0 0 22px; font-size: 0.95rem; }
      .hero__cta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 26px; }
      .hero__points { display: flex; gap: 24px; flex-wrap: wrap; list-style: none; padding: 0; margin: 0; color: #cfe0ff; font-size: 0.82rem; }
      .hero__points .material-icons { margin-right: 6px; color: #7db4ff; }
      .quick { background: #fff; color: var(--fw-ink); border-radius: 14px; padding: 20px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28); }
      .quick h2 { font-size: 1.1rem; margin: 0 0 12px; color: var(--fw-navy); }
      .tabs { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
      .tabs button { border: 1px solid var(--fw-line-strong); background: #fff; color: var(--fw-ink); padding: 6px 12px; border-radius: 6px; font: 500 0.78rem Poppins, sans-serif; cursor: pointer; }
      .tabs button.on { background: var(--fw-blue); border-color: var(--fw-blue); color: #fff; }
      .amount { border: 1.5px solid var(--fw-line-strong); border-radius: 8px; padding: 9px 12px; font-weight: 600; }
      .quick input[type='range'] { width: 100%; accent-color: var(--fw-blue); }
      .range-ends { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--fw-muted); }
      .quick__badges { display: flex; justify-content: space-between; gap: 8px; list-style: none; padding: 0; margin: 12px 0 0; font-size: 0.7rem; color: var(--fw-muted); flex-wrap: wrap; }
      .quick__badges .material-icons { font-size: 14px; margin-right: 3px; color: var(--fw-blue); }
      /* Services */
      .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 16px; }
      .head p { margin: 0; }
      .more { color: var(--fw-blue); text-decoration: none; font-weight: 600; font-size: 0.85rem; white-space: nowrap; }
      .sec-services { padding-bottom: 28px; }
      .svc-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
      .svc { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; padding: 14px 14px 40px; background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; text-decoration: none; color: inherit; transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s; }
      .svc:hover { box-shadow: 0 10px 26px rgba(16, 33, 58, 0.12); transform: translateY(-2px); border-color: var(--fw-blue); }
      .svc__icon img { width: 28px; height: 28px; object-fit: contain; }
      .ins__img { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex: none; }
      img.av { object-fit: cover; }
      .svc__icon { width: 36px; height: 36px; border-radius: 10px; background: var(--fw-blue-soft); color: var(--fw-blue); display: grid; place-items: center; font-size: 20px; }
      .svc__txt { display: grid; gap: 2px; font-size: 0.72rem; color: var(--fw-muted); line-height: 1.35; }
      .svc__txt strong { color: var(--fw-ink); font-size: 0.86rem; }
      .svc__go { position: absolute; left: 14px; bottom: 10px; width: 24px; height: 24px; border-radius: 50%; background: var(--fw-blue); color: #fff; display: grid; place-items: center; font-size: 15px; }
      /* Why + EMI */
      .sec-split { padding-top: 24px; }
      .split { display: grid; grid-template-columns: 1fr 1.05fr; gap: 32px; align-items: start; }
      .why { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 14px; }
      .why__item { display: grid; gap: 4px; justify-items: center; text-align: center; padding: 4px 10px; border-left: 1px solid var(--fw-line); }
      .why__item:first-child { border-left: 0; }
      .why__icon { width: 46px; height: 46px; border-radius: 50%; background: var(--fw-blue-soft); color: var(--fw-blue); display: grid; place-items: center; font-size: 24px; margin-bottom: 4px; }
      .why__item strong { font-size: 0.85rem; }
      .emi__head { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
      .emi__head p { margin: 0; }
      .emi__badge { width: 38px; height: 38px; border-radius: 10px; background: var(--fw-blue-soft); color: var(--fw-blue); display: grid; place-items: center; font-size: 22px; }
      .emi__grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; align-items: stretch; }
      .emi__fields { display: grid; gap: 0; }
      .emi__fields .fw-field { margin-bottom: 10px; }
      .emi__result { background: var(--fw-blue-soft); border-radius: 12px; padding: 16px; display: grid; align-content: center; gap: 2px; }
      .emi__result strong { font-size: 1.8rem; color: var(--fw-navy); line-height: 1.2; }
      .emi__note { margin-top: 10px; font-size: 0.7rem; color: var(--fw-muted); }
      /* How it works */
      .sec-how { padding-top: 24px; }
      .stair { opacity: 0; transform: translate(-16px, 30px); transition: opacity 0.9s ease, transform 1s cubic-bezier(0.2, 0.8, 0.2, 1); transition-delay: calc(var(--d, 0) * 280ms); }
      .stairs-in .stair { opacity: 1; transform: none; }
      @media (prefers-reduced-motion: reduce) { .stair { opacity: 1; transform: none; transition: none; } }
      .split--how { grid-template-columns: 1.15fr 1fr; }
      .how { list-style: none; margin: 12px 0 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .how li { display: grid; grid-template-columns: auto 1fr; column-gap: 10px; row-gap: 2px; align-items: center; padding: 12px; border: 1px solid var(--fw-line); border-radius: 12px; background: #fff; box-shadow: 0 1px 6px rgba(16, 33, 58, 0.05); }
      .how li > .fw-small { grid-column: 2; font-size: 0.72rem; line-height: 1.4; }
      .how__n { grid-row: span 2; width: 30px; height: 30px; border-radius: 50%; background: var(--fw-blue); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 0.85rem; }
      .how strong { grid-column: 2; font-size: 0.84rem; line-height: 1.25; }
      .faq { border: 1px solid var(--fw-line); border-radius: 10px; padding: 10px 14px; margin-bottom: 8px; background: #fff; }
      .faq summary { cursor: pointer; font-weight: 600; font-size: 0.88rem; }
      .faq p { margin: 8px 0 0; color: var(--fw-muted); line-height: 1.6; font-size: 0.85rem; }
      .trio { display: grid; grid-template-columns: 1.25fr 1fr 0.9fr; gap: 28px; align-items: start; } .trio h2 { margin: 0 0 4px; font-size: 1.15rem; line-height: 1.25; white-space: nowrap; } .trio .head { margin-bottom: 8px; } .trio .head h2 { margin: 0; }
      .quote { margin: 10px 0 8px; background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; padding: 16px; position: relative; display: grid; gap: 10px; }
      .quote__mark { font-size: 2.4rem; line-height: 0.6; color: var(--fw-blue); font-weight: 700; } .quote blockquote { margin: 0; font-size: 0.82rem; line-height: 1.6; color: #3d4a5f; }
      .quote figcaption { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; } .quote figcaption span:nth-child(2) { display: grid; line-height: 1.25; } .quote small { color: var(--fw-muted); font-size: 0.72rem; }
      .av { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #1c6df0, #0a3a8a); color: #fff; display: grid; place-items: center; font-weight: 600; font-size: 0.85rem; } .stars { color: #f59e0b; letter-spacing: 2px; margin-left: auto; }
      .ins { display: flex; gap: 12px; align-items: center; text-decoration: none; color: inherit; padding: 10px 0; border-bottom: 1px solid var(--fw-line); } .ins span:last-child { display: grid; line-height: 1.35; } .ins strong { font-size: 0.85rem; } .ins small { color: var(--fw-muted); font-size: 0.74rem; }
      .ins__ic { width: 52px; height: 52px; border-radius: 8px; background: linear-gradient(135deg, #0a3a8a, #4da3ff); color: #fff; display: grid; place-items: center; font-size: 26px; flex: none; }
      .partners { padding: 8px 0 28px; } .partners__t { font-size: 1rem; margin: 0 0 12px; color: var(--fw-navy); } .partners ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 14px 28px; align-items: center; justify-content: space-between; } .partners li { display: flex; align-items: center; } .partners img { height: 42px; width: auto; display: block; }
      @media (max-width: 720px) { .partners ul { justify-content: center; gap: 12px 22px; } .partners img { height: 34px; } }
      /* CTA */
      .cta { background: linear-gradient(90deg, #061a3d, #0d3a75); color: #fff; padding: 28px 0; }
      .cta__inner { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
      .cta h2 { margin: 0 0 4px; font-size: 1.3rem; } .cta p { margin: 0; color: #cfe0ff; font-size: 0.9rem; }
      .cta__btns { display: flex; gap: 12px; flex-wrap: wrap; }
      .fw-btn .material-icons { font-size: 18px; }
      @media (max-width: 1100px) {
        .svc-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .split, .split--how, .trio { grid-template-columns: 1fr; }
      }
      @media (max-width: 860px) {
        .hero__inner { grid-template-columns: 1fr; }
        .hero { padding: 36px 0 40px; }
        .emi__grid { grid-template-columns: 1fr; }
        .how { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 600px) {
        .svc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .why { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 16px; }
        .why__item { padding: 4px 8px; }
        .hero__cta .fw-btn { flex: 1; }
        /* Loan cards in the swipe row: icon on top, name centred, arrow at the bottom (as in the mobile design). */
        .svc { grid-template-columns: 1fr; justify-items: center; text-align: center; gap: 8px; padding: 18px 10px 54px; min-height: 150px; }
        .svc__icon { width: 52px; height: 52px; background: transparent; } .svc__icon img { width: 40px; height: 40px; }
        .svc__txt { justify-items: center; } .svc__txt strong { font-size: 0.92rem; } .svc__txt > span { display: none; }
        .svc__go { left: 50%; transform: translateX(-50%); bottom: 14px; width: 30px; height: 30px; font-size: 18px; }
      }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteHomeComponent {
  protected readonly thumbs = IMG.blogThumbs;
  protected readonly avatar = IMG.avatar;

  protected icon(slug: string): string | null {
    return loanIcon(slug);
  }

  private readonly router = inject(Router);

  protected readonly why = WHY_US;
  protected readonly steps = HOW_IT_WORKS;
  protected readonly tenures = TENURE_YEARS;
  protected readonly extras = HOME_EXTRAS;

  // Product cards use the exact wording from the approved design (product-pages.data.ts).
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly featured = computed(() =>
    PRODUCT_PAGES.slice(0, 10).map((p) => ({ slug: p.slug, name: p.name, icon: p.icon, tagline: p.cardText })),
  );
  protected readonly tabs = computed(() => PRODUCT_PAGES.slice(0, TAB_COUNT).map((p) => ({ slug: p.slug, name: p.name })));

  // Quick eligibility box
  protected type = 'personal-loan';
  protected amount = 500000;
  protected years = 3;

  // Compact EMI calculator
  protected eAmount = 1000000;
  protected eRate = 10;
  protected eYears = 5;
  private readonly emi = signal(summariseEmi(1000000, 10, 60).emi);
  protected readonly emiError = signal<string | null>(null);
  protected readonly emiText = computed(() => formatInr(this.emi()));

  protected shortName(p: { name: string }): string {
    return p.name;
  }

  protected goEligibility(): void {
    void this.router.navigate(['/eligibility'], { queryParams: { product: this.type, amount: this.amount, years: this.years } });
  }

  protected calculate(): void {
    const valid = this.eAmount > 0 && this.eRate >= 0 && this.eRate <= 40 && this.eYears >= 1 && this.eYears <= 30;
    if (!valid) {
      this.emiError.set('Enter an amount above zero, a rate of 0–40 and 1–30 years.');
      return;
    }
    this.emiError.set(null);
    this.emi.set(summariseEmi(this.eAmount, this.eRate, Math.round(this.eYears) * 12).emi);
  }
}
