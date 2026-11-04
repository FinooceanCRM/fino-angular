import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EMPLOYMENT_TYPES, EligibilityResult } from '@core/models/website.model';
import { AuthService } from '@core/services/auth.service';
import { WebsiteService } from '@core/services/website.service';
import { formatInr } from '@core/utils/emi';

import { PRODUCT_PAGES } from '../product-pages.data';
import { ELIG } from '../site-content.data';
import { IMG, loanIcon } from '../loan-images';
import { WEBSITE } from '../website.config';
import { HScrollDirective } from '../shared/h-scroll.directive';

/** Check Your Loan Eligibility — layout and wording follow images/05_Eligibility.png. Result is indicative only. */
@Component({
  selector: 'app-website-eligibility',
  standalone: true,
  imports: [HScrollDirective, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div class="fw-container hero__inner">
        <div class="hero__copy">
          <nav class="crumbs" aria-label="Breadcrumb"><a [routerLink]="inPortal ? '/account' : '/'">{{ inPortal ? 'Dashboard' : 'Home' }}</a><span>›</span><span aria-current="page">Loan Eligibility</span></nav>
          <h1>{{ e.title[0] }}<br /><span>{{ e.title[1] }}</span></h1>
          <h2>{{ e.sub }}</h2>
          <p>{{ e.text }}</p>
          <ul class="feats">@for (f of e.feats; track f.title) { <li><span class="material-icons">{{ f.icon }}</span><span><b>{{ f.title }}</b><small>{{ f.text }}</small></span></li> }</ul>
        </div>
        <div class="hero__mid">
          <p class="script" aria-hidden="true">{{ e.script }}</p>
          <ul class="checks">@for (c of e.checks; track c) { <li><span class="material-icons">check_box</span>{{ c }}</li> }</ul>
        </div>

        <div class="card" id="check">
          <h3>{{ e.card.title }}</h3>
          <p class="card__sub">{{ e.card.sub }}</p>
          <form (ngSubmit)="check()" novalidate>
            <label class="f"><span>Loan Type</span>
              <select name="type" [(ngModel)]="type" required><option value="">Select Loan Type</option>@for (p of products; track p.slug) { <option [value]="p.slug">{{ p.name }}</option> }</select></label>
            <label class="f"><span>Monthly Income (₹)</span>
              <select name="income" [(ngModel)]="income"><option value="">Select Income Range</option>@for (b of e.incomeBands; track b.label) { <option [value]="b.label">{{ b.label }}</option> }</select></label>
            <label class="f"><span>Employment Type</span>
              <select name="emp" [(ngModel)]="emp"><option value="">Select Employment Type</option>@for (t of employment; track t.value) { <option [value]="t.value">{{ t.label }}</option> }</select></label>
            <label class="f"><span>City</span>
              <select name="city" [(ngModel)]="city"><option value="">Select City</option>@for (c of e.cities; track c) { <option [value]="c">{{ c }}</option> }</select></label>
            @if (error()) { <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div> }
            <button type="submit" class="fw-btn fw-btn--primary fw-btn--block" [disabled]="busy()">{{ busy() ? 'Checking…' : 'Check Eligibility' }} <span class="material-icons">arrow_forward</span></button>
            <ul class="badges">@for (b of e.card.badges; track b) { <li><span class="material-icons">check_circle</span>{{ b }}</li> }</ul>
          </form>
        </div>
      </div>
    </section>

    @if (result(); as r) {
      <section class="fw-container result" aria-live="polite" id="result">
        <div class="fw-card result__c" [class]="'fw-card result__c result__c--' + r.band">
          <span class="fw-eyebrow">Indicative result — not an approval</span>
          <h2 class="fw-h2">{{ r.headline }}</h2>
          <dl>
            <dt>You may be able to borrow up to</dt><dd>{{ fmt(r.indicative_max_amount) }}</dd>
            @if (requestedAmount()) { <dt>Estimated EMI for {{ fmt(requestedAmount()) }}</dt><dd>{{ fmt(r.estimated_emi) }} / month</dd> }
            <dt>Tenure assumed</dt><dd>{{ r.tenure_months / 12 }} years</dd>
          </dl>
          @for (reason of r.reasons; track reason) { <div class="fw-alert fw-alert--warn">{{ reason }}</div> }
          <details><summary>Assumptions</summary><ul>@for (a of r.assumptions; track a) { <li>{{ a }}</li> }</ul></details>
          <p class="fw-muted">{{ r.next_step }}</p>
          <div class="result__cta">
            @if (isCustomer()) {
              <a class="fw-btn fw-btn--primary" routerLink="/account/apply" [queryParams]="applyParams()">Apply for this loan</a>
            } @else {
              <!-- Checking is free and anonymous. Applying needs an account; the entered details carry over. -->
              <a class="fw-btn fw-btn--primary" routerLink="/register" [queryParams]="accountParams()">Create a free account to apply</a>
              <a class="fw-btn fw-btn--ghost" routerLink="/login" [queryParams]="accountParams()">Log in</a>
            }
          </div>
          <p class="fw-small fw-muted">{{ r.disclaimer }}</p>
        </div>
      </section>
    }

    <div class="fw-container">
      <div class="strip">@for (s of e.strip; track s.label) { <div><span class="ic material-icons">{{ s.icon }}</span><span><b>{{ s.value }}</b><small>{{ s.label }}</small></span></div> }</div>
    </div>

    <section class="fw-container explore">
      <div class="explore__main">
        <h2 class="fw-h2">{{ e.exploreTitle }}</h2>
        <p class="fw-muted">{{ e.exploreSub }}</p>
        <div class="carousel">
          <button type="button" class="nav nav--prev" aria-label="Scroll left" (click)="scrollCards(track, -1)"><span class="material-icons">chevron_left</span></button>
          <div class="cards" #track>
            @for (p of e.explore; track p.slug) {
              <div class="pc">
                <span class="pc__ic">@if (icon(p.slug); as src) { <img [src]="src" [alt]="p.name" width="40" height="40" /> } @else { <span class="material-icons">{{ p.icon }}</span> }</span>
                <strong>{{ p.name }}</strong><small>{{ p.text }}</small>
                <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="pick(p.slug)">Check Eligibility <span class="material-icons">arrow_forward</span></button>
              </div>
            }
          </div>
          <button type="button" class="nav nav--next" aria-label="Scroll right" (click)="scrollCards(track, 1)"><span class="material-icons">chevron_right</span></button>
        </div>
      </div>
      <aside class="help">
        <h3>{{ e.help.title }}</h3><p>{{ e.help.text }}</p>
        <img class="help__img" [src]="expert" alt="Finoocean loan expert" width="119" height="126" />
        <a class="fw-btn fw-btn--primary fw-btn--block" [routerLink]="inPortal ? '/account/help' : '/contact'">{{ e.help.cta }} <span class="material-icons">arrow_forward</span></a>
        <a class="phone" [href]="site.phoneHref"><span class="material-icons">phone</span><span><b>{{ site.phone }}</b><small>{{ site.hours.replace(' · ', ' ') }}</small></span></a>
      </aside>
    </section>

    <section class="fw-container how">
      <div>
        <h2 class="fw-h2">{{ e.how.title }}</h2><p class="fw-muted">{{ e.how.sub }}</p>
        <ol>@for (s of e.how.steps; track s[0]; let i = $index) { <li><span class="n">{{ i + 1 }}</span><span><b>{{ s[0] }}</b><small>{{ s[1] }}</small></span></li> }</ol>
      </div>
      <div>
        <h2 class="fw-h2">{{ e.why.title }}</h2>
        <ul class="why m-hscroll" appHScroll style="--m-card-w: 46%">@for (w of e.why.items; track w[0]) { <li><span class="material-icons">{{ w[1] }}</span>{{ w[0] }}</li> }</ul>
      </div>
    </section>

    <section class="band">
      <div class="fw-container band__inner">
        <div><h2>{{ e.band.title }}</h2><p>{{ e.band.text }}</p></div>
        <a class="fw-btn fw-btn--light" href="#check" (click)="up($event)">{{ e.band.cta }} <span class="material-icons">arrow_forward</span></a>
        <ul class="trust">@for (t of e.band.trust; track t) { <li>{{ t }}</li> }</ul>
      </div>
    </section>
  `,
  styles: [
    `
      a { color: inherit; } .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; } .fw-btn--light { color: var(--fw-navy); } .material-icons { font-size: 20px; }
      .hero { background: linear-gradient(115deg, #061a3d 0%, #0a2f66 55%, #0d4a9a 100%); color: #fff; padding: 22px 0 34px; position: relative; overflow: hidden; }
      .hero__inner { position: relative; z-index: 1; display: grid; grid-template-columns: 1.2fr 0.8fr 340px; gap: 24px; align-items: start; }
      .crumbs { display: flex; gap: 8px; font-size: 0.76rem; color: #cfe0ff; margin-bottom: 14px; } .crumbs a { text-decoration: none; }
      h1 { font-size: clamp(2.1rem, 4.4vw, 3.2rem); line-height: 1.06; margin: 0 0 8px; font-weight: 700; } h1 span { color: #4dc4ff; }
      .hero h2 { font-size: 1.15rem; margin: 0 0 8px; font-weight: 500; } .hero p { font-size: 0.9rem; line-height: 1.6; color: #dbe8ff; margin: 0 0 18px; max-width: 480px; }
      .feats { display: flex; gap: 14px 24px; list-style: none; padding: 0; margin: 0; flex-wrap: wrap; } .feats li { display: flex; gap: 8px; align-items: flex-start; } .feats .material-icons { color: #4dc4ff; font-size: 28px; } .feats span:last-child { display: grid; } .feats small { color: #cfe0ff; font-size: 0.72rem; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.6rem; line-height: 1.25; color: #e6f0ff; margin: 30px 0 14px; max-width: 220px; }
      .checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-family: Lora, serif; font-style: italic; } .checks .material-icons { color: #4dc4ff; margin-right: 8px; vertical-align: -5px; }
      .card { background: #fff; color: var(--fw-ink); border-radius: 12px; padding: 16px; box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25); }
      .card h3 { margin: 0 0 2px; font-size: 1.05rem; } .card__sub { margin: 0 0 10px; font-size: 0.78rem; color: var(--fw-muted); line-height: 1.4; }
      .f { display: grid; border: 1px solid var(--fw-line-strong); border-radius: 8px; padding: 6px 10px; margin-bottom: 8px; background: #fff; } .f span { font-size: 0.72rem; font-weight: 600; }
      .f select { border: 0; outline: 0; background: transparent; font: 400 0.82rem Poppins, sans-serif; color: var(--fw-muted); padding: 2px 0; } .f:focus-within { border-color: var(--fw-blue); }
      .badges { display: flex; justify-content: space-between; gap: 6px; flex-wrap: wrap; list-style: none; padding: 0; margin: 10px 0 0; font-size: 0.68rem; color: var(--fw-muted); } .badges .material-icons { font-size: 14px; color: var(--fw-blue); margin-right: 3px; vertical-align: -3px; }
      .result { margin-top: 18px; } .result__c { display: grid; gap: 10px; } .result__c--likely { border-color: #9fd8b4; } .result__c--needs_review { border-color: #f3d99a; }
      dl { display: grid; grid-template-columns: 1fr auto; gap: 6px 14px; margin: 0; } dt { color: var(--fw-muted); } dd { margin: 0; font-weight: 600; }
      .result__cta { display: flex; gap: 12px; flex-wrap: wrap; } details ul { margin: 6px 0 0; padding-left: 18px; font-size: 0.85rem; color: var(--fw-muted); line-height: 1.7; } summary { cursor: pointer; font-weight: 600; font-size: 0.88rem; }
      .strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; background: var(--fw-blue-soft); border: 1px solid #dbe8fb; border-radius: 12px; padding: 14px; margin: 18px 0; }
      .strip > div { display: flex; gap: 10px; align-items: center; } .strip span:last-child { display: grid; line-height: 1.25; } .strip small { color: var(--fw-muted); font-size: 0.74rem; } .strip b { color: var(--fw-navy); } .ic { color: var(--fw-blue); font-size: 30px; }
      .explore { display: grid; grid-template-columns: 1fr 300px; gap: 22px; align-items: stretch; } .explore h2, .how h2 { margin: 0 0 4px; } .explore p, .how p { margin: 0 0 12px; font-size: 0.88rem; }
      .explore__main { min-width: 0; }
      .carousel { position: relative; }
      .cards { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: none; padding: 6px 2px 12px; } .cards::-webkit-scrollbar { display: none; }
      .nav { position: absolute; top: calc(50% - 6px); transform: translateY(-50%); z-index: 2; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--fw-line-strong); background: #fff; color: var(--fw-navy); display: grid; place-items: center; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 33, 58, 0.18); padding: 0; transition: background 0.15s, color 0.15s; } .nav:hover { background: var(--fw-blue); border-color: var(--fw-blue); color: #fff; }
      .nav--prev { left: -19px; } .nav--next { right: -19px; }
      .pc { flex: 0 0 calc((100% - 42px) / 4); scroll-snap-align: start; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; padding: 20px 14px 16px; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.06); transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; } .pc:hover { transform: translateY(-3px); border-color: var(--fw-blue); box-shadow: 0 10px 24px rgba(13, 110, 253, 0.14); }
      .pc strong { min-height: 2.6em; display: grid; align-items: center; font-size: 0.95rem; line-height: 1.3; } .pc small { min-height: 2.6em; display: grid; align-items: start; color: var(--fw-muted); font-size: 0.78rem; line-height: 1.3; } .pc .fw-btn { margin-top: auto; width: 100%; justify-content: center; white-space: nowrap; font-size: 0.78rem; padding: 8px 10px; }
      .pc__ic img { width: 40px; height: 40px; object-fit: contain; }
      .pc__ic { width: 56px; height: 56px; border-radius: 14px; background: var(--fw-blue-soft); color: var(--fw-blue); display: grid; place-items: center; font-size: 30px; margin-bottom: 4px; }
      .help { background: var(--fw-blue-soft); border-radius: 12px; padding: 22px; display: grid; gap: 12px; align-content: center; } .help h3 { margin: 0; } .help p { margin: 0; font-size: 0.84rem; color: var(--fw-muted); }
      .help__img { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; object-position: top; justify-self: start; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.15); }
      .phone { display: flex; gap: 10px; align-items: center; text-decoration: none; } .phone .material-icons { background: var(--fw-blue); color: #fff; border-radius: 50%; padding: 8px; } .phone span:last-child { display: grid; } .phone small { color: var(--fw-muted); font-size: 0.72rem; }
      .how { display: grid; grid-template-columns: 1.4fr 1fr; gap: 22px; margin: 26px auto; align-items: stretch; }
      .how > div { display: flex; flex-direction: column; min-width: 0; } .how > div > ol, .how > div > .why { flex: 1; margin-top: 0; grid-auto-rows: 1fr; }
      .how ol b { font-size: 0.88rem; line-height: 1.25; font-weight: 600; } .how ol li span:last-child { gap: 2px; } .how ol small { line-height: 1.3; }
      .why li { align-content: center; }
      ol { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; } ol li { display: flex; gap: 10px; align-items: center; background: #fff; border: 1px solid var(--fw-line); border-radius: 10px; padding: 10px; } ol li span:last-child { display: grid; line-height: 1.3; } ol small { color: var(--fw-muted); font-size: 0.72rem; }
      .n { width: 30px; height: 30px; flex: none; border-radius: 50%; background: var(--fw-blue); color: #fff; display: grid; place-items: center; font-weight: 700; }
      .why { list-style: none; margin: 8px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; } .why li { display: grid; justify-items: center; gap: 6px; text-align: center; font-size: 0.76rem; font-weight: 500; background: #fff; border: 1px solid var(--fw-line); border-radius: 10px; padding: 10px 4px; } .why .material-icons { color: var(--fw-blue); font-size: 26px; }
      .band { background: linear-gradient(90deg, #061a3d, #0d3a75); color: #fff; padding: 24px 0; } .band__inner { display: flex; justify-content: space-between; align-items: center; gap: 18px; flex-wrap: wrap; } .band h2 { margin: 0 0 4px; font-size: 1.25rem; } .band p { margin: 0; color: #cfe0ff; font-size: 0.88rem; }
      .trust { display: flex; gap: 20px; list-style: none; margin: 0; padding: 0; font-size: 0.82rem; color: #cfe0ff; }
      @media (max-width: 1100px) { .hero__inner { grid-template-columns: 1fr 340px; } .hero__mid { display: none; } .explore, .how { grid-template-columns: 1fr; } .pc { flex-basis: calc((100% - 28px) / 3); } }
      @media (max-width: 800px) { .hero__inner { grid-template-columns: 1fr; } .strip { grid-template-columns: 1fr 1fr; } ol, .why { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 520px) { .pc { flex-basis: calc((100% - 14px) / 2); } .nav { width: 32px; height: 32px; } .nav--prev { left: -10px; } .nav--next { right: -10px; } }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteEligibilityComponent {
  /** Inside the customer dashboard (/account) links stay in the dashboard instead of going to the public site. */
  protected readonly inPortal = inject(Router).url.startsWith('/account');
  private readonly web = inject(WebsiteService);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  protected readonly e = ELIG;
  protected readonly site = WEBSITE;
  protected readonly products = PRODUCT_PAGES;
  protected readonly employment = EMPLOYMENT_TYPES;

  protected type = '';
  protected income = '';
  protected emp = '';
  protected city = '';

  protected readonly result = signal<EligibilityResult | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isCustomer = computed(() => this.auth.role() === 'customer');

  // Optional values handed over from a product page (?product=&amount=&years=&income=&emi=).
  private readonly q = this.route.snapshot.queryParamMap;
  protected readonly requestedAmount = signal(Math.max(0, Number(this.q.get('amount')) || 0));
  private readonly years = Number(this.q.get('years')) || 0;
  private readonly emi = Number(this.q.get('emi')) || 0;
  private readonly incomeParam = Number(this.q.get('income')) || 0;

  constructor() {
    const product = this.q.get('product');
    if (product && PRODUCT_PAGES.some((p) => p.slug === product)) this.type = product;
  }

  protected fmt(v: number): string {
    return formatInr(v);
  }

  protected readonly expert = IMG.expert;

  protected icon(slug: string): string | null {
    return loanIcon(slug);
  }

  protected pick(slug: string): void {
    this.type = slug;
    document.getElementById('check')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /** Scrolls the loan cards by one visible page, left (-1) or right (1). */
  protected scrollCards(el: HTMLElement, dir: -1 | 1): void {
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  }

  protected up(event: Event): void {
    event.preventDefault();
    document.getElementById('check')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  protected applyParams(): Record<string, string | number> {
    const p: Record<string, string | number> = { product: this.type };
    if (this.requestedAmount() > 0) p['amount'] = this.requestedAmount();
    if (this.years > 0) p['years'] = this.years;
    return p;
  }

  /** After signing up / logging in the customer lands on the application form with these pre-filled. */
  protected accountParams(): { redirectTo: string } {
    const qs = new URLSearchParams(Object.entries(this.applyParams()).map(([k, v]) => [k, String(v)]));
    return { redirectTo: `/account/apply?${qs.toString()}` };
  }

  protected check(): void {
    if (!this.type) {
      this.error.set('Please select a loan type.');
      return;
    }
    const band = ELIG.incomeBands.find((b) => b.label === this.income);
    const monthlyIncome = this.incomeParam || band?.assumed || 0;
    if (!monthlyIncome) {
      this.error.set('Please select your monthly income range.');
      return;
    }
    const product = PRODUCT_PAGES.find((p) => p.slug === this.type);
    if (this.busy() || !product) return;

    this.busy.set(true);
    this.error.set(null);
    this.web
      .checkEligibility({
        product: this.type,
        // The design collects no amount: ask for a nominal one and read the indicative maximum from the result.
        loan_amount: this.requestedAmount() || 100000,
        tenure_months: this.years > 0 ? Math.round(this.years * 12) : null,
        monthly_income: monthlyIncome,
        existing_emi: this.emi || null,
        employment_type: (this.emp || null) as never,
      })
      .subscribe({
        next: (r) => {
          this.result.set(r);
          this.busy.set(false);
          setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        },
        error: (err: { message?: string }) => {
          this.error.set(err?.message ?? 'Could not check eligibility. Please try again.');
          this.busy.set(false);
        },
      });
  }
}
