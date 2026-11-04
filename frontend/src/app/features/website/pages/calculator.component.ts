import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { formatInr, summariseEmi, yearlySchedule } from '@core/utils/emi';

import { CALC } from '../site-content.data';
import { WEBSITE } from '../website.config';
import { BandComponent } from '../shared/band.component';
import { PageHeroComponent } from '../shared/page-hero.component';

/** Loan Calculator — layout and wording follow images/04_Calculator (full loan-type tabs variant). */
@Component({
  selector: 'app-website-calculator',
  standalone: true,
  imports: [RouterLink, PageHeroComponent, BandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero [crumbs]="[{ label: 'Loan Calculator' }]" [title]="[c.heroTitle]" [sub]="c.heroSub" [text]="c.heroText" [script]="c.heroScript" [checks]="c.heroChecks" />

    <div class="fw-container">
      <div #tabsEl class="tabs" role="tablist" aria-label="Loan type">
        <span class="bubble" aria-hidden="true" [style.width.px]="bubble().w" [style.height.px]="bubble().h" [style.transform]="'translate(' + bubble().x + 'px,' + bubble().y + 'px)'"></span>
        @for (t of c.tabs; track t.key) {
          <button type="button" role="tab" [attr.aria-selected]="tab() === t.key" [class.on]="tab() === t.key" (click)="select(t.key)">
            <span class="material-icons">{{ t.icon }}</span>{{ t.label }}
          </button>
        }
      </div>

      <div class="grid">
        <!-- Inputs -->
        <section class="fw-card">
          <h2 class="fw-h2">{{ current().label }} Calculator</h2>
          <p class="fw-muted fw-small">{{ c.subtitle }}</p>

          <div class="ctl">
            <label for="amt">Loan Amount</label>
            <div class="box"><span>₹</span><input id="amt" type="text" inputmode="numeric" maxlength="10" autocomplete="off" aria-label="Loan amount (up to 10 digits)" [value]="amount()" (input)="typeAmount($event)" (blur)="settleAmount($event)" /></div>
            <input class="rng" [style.--p]="pct(amount(), c.amount.min, c.amount.max)" type="range" [min]="c.amount.min" [max]="c.amount.max" [step]="c.amount.step" [value]="amount()" (input)="setAmount($event)" aria-label="Loan amount slider" />
            <div class="ends"><span>{{ fmt(c.amount.min) }}</span><span>{{ fmt(c.amount.max) }}</span></div>
          </div>

          <div class="ctl">
            <label for="rate">Interest Rate (p.a.)</label>
            <div class="box"><input id="rate" type="number" inputmode="decimal" [min]="c.rate.min" [max]="c.rate.max" [step]="0.1" [value]="rate()" (input)="setRate($event)" /><span>%</span></div>
            <input class="rng" [style.--p]="pct(rate(), c.rate.min, c.rate.max)" type="range" [min]="c.rate.min" [max]="c.rate.max" [step]="c.rate.step" [value]="rate()" (input)="setRate($event)" aria-label="Interest rate slider" />
            <div class="ends"><span>{{ c.rate.min }}%</span><span>{{ c.rate.max }}%</span></div>
          </div>

          <div class="ctl">
            <label for="ten">Loan Tenure</label>
            <div class="box"><input id="ten" type="number" inputmode="decimal" min="0.5" [max]="current().maxYears" step="0.5" [value]="years()" (input)="setYears($event)" /><span>{{ years() === 1 ? 'Year' : 'Years' }}</span></div>
            <input class="rng" [style.--p]="pct(years(), 0.5, current().maxYears)" type="range" min="0.5" [max]="current().maxYears" step="0.5" [value]="years()" (input)="setYears($event)" aria-label="Tenure slider" />
            <div class="ends"><span>6 Months</span><span>{{ current().maxYears }} Years</span></div>
          </div>

          <div class="acts">
            <button type="button" class="fw-btn fw-btn--primary" (click)="calculate()">Calculate EMI <span class="material-icons">arrow_forward</span></button>
            <button type="button" class="fw-btn fw-btn--ghost" (click)="reset()"><span class="material-icons">refresh</span> Reset</button>
          </div>
          <div class="emi-mini" aria-hidden="true"><span>Monthly EMI</span><strong>{{ fmtN(summary().emi) }}</strong></div>
          <ul class="badges"><li><span class="material-icons">check_circle</span>No Obligation</li><li><span class="material-icons">check_circle</span>Instant Result</li><li><span class="material-icons">check_circle</span>Secure &amp; Private</li></ul>
        </section>

        <!-- Summary -->
        <section id="loan-summary" class="fw-card summary" [class.hl]="highlight()" aria-live="polite">
          <h2 class="fw-h3">Your Loan Summary</h2>
          <div class="emi"><span>Monthly EMI</span><strong>{{ fmtN(summary().emi) }}</strong></div>
          <div class="trio">
            <div><span>Loan Amount</span><b>{{ fmtN(amount()) }}</b></div>
            <div><span>Total Interest</span><b>{{ fmtN(summary().totalInterest) }}</b></div>
            <div><span>Total Payment</span><b>{{ fmtN(summary().totalPayment) }}</b></div>
          </div>
          <div class="donut-row">
            <div class="donut" [style.background]="donut()" role="img" [attr.aria-label]="'Principal ' + pPct() + ' percent, interest ' + iPct() + ' percent'"><div><b>{{ fmtN(summary().totalPayment) }}</b><span>Total Payment</span></div></div>
            <ul>
              <li><i class="d d--p"></i><span>Principal Amount</span><b>{{ fmtN(amount()) }} ({{ pPct() }}%)</b></li>
              <li><i class="d d--i"></i><span>Total Interest</span><b>{{ fmtN(summary().totalInterest) }} ({{ iPct() }}%)</b></li>
            </ul>
          </div>
          <p class="fw-small fw-muted">Note: This is an estimated calculation. Actual figures may vary based on lender’s terms and conditions.</p>
        </section>

        <!-- Side cards -->
        <aside class="side">
          <div class="fw-card side__c"><span class="ic material-icons">description</span><div><h3>Download Amortization Schedule</h3><p>Get the complete month-wise breakup of your loan repayment.</p></div>
            <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm fw-btn--block" (click)="download()">Download Schedule <span class="material-icons">download</span></button></div>
          <div class="fw-card side__c"><span class="ic material-icons">share</span><div><h3>Share Your Results</h3><p>Share this calculation with your family or advisor.</p></div>
            <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm fw-btn--block" (click)="share()">Share Calculator <span class="material-icons">share</span></button>
            @if (shareMsg()) { <span class="fw-small fw-muted" role="status">{{ shareMsg() }}</span> }</div>
          <div class="fw-card side__q"><h3>{{ c.quote.title }}</h3><p>{{ c.quote.text }}</p><a class="fw-btn fw-btn--primary fw-btn--sm fw-btn--block" [routerLink]="inPortal ? '/account/help' : '/contact'"><span class="material-icons">phone</span> {{ c.quote.cta }}</a></div>
        </aside>
      </div>

      <!-- Yearly schedule -->
      <section class="fw-card sched">
        <div class="sched__h"><h2 class="fw-h3">Amortization Schedule</h2><button type="button" class="link" (click)="schedOpen.set(!schedOpen())">{{ schedOpen() ? 'Hide' : 'Show' }} yearly breakup</button></div>
        @if (schedOpen()) {
          <div class="tw"><table><thead><tr><th>Year</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead>
            <tbody>@for (r of schedule(); track r.year) { <tr><td>{{ r.year }}</td><td>{{ fmtN(r.principalPaid) }}</td><td>{{ fmtN(r.interestPaid) }}</td><td>{{ fmtN(r.balance) }}</td></tr> }</tbody></table></div>
        }
      </section>

      <div class="strip">
        @for (s of c.strip; track s.title) { <div><span class="ic2 material-icons">{{ s.icon }}</span><span><b>{{ s.title }}</b><small>{{ s.text }}</small></span></div> }
      </div>

      <div class="faqs">
        <div>
          <div class="fh"><div><h2 class="fw-h2">{{ c.faqTitle }}</h2><p class="fw-muted fw-small">{{ c.faqSub }}</p></div><a [routerLink]="inPortal ? '/account/help' : '/faq'" class="more">View All FAQs →</a></div>
          <div class="faq-grid">@for (f of c.faqs; track f.q) { <details><summary>{{ f.q }}</summary><p>{{ f.a }}</p></details> }</div>
        </div>
        <div class="fw-card help">
          <h3>{{ c.help.title }}</h3><p class="fw-muted fw-small">{{ c.help.text }}</p>
          <a class="row" [href]="site.phoneHref"><span class="material-icons">phone</span><span><b>Call Us</b><small>{{ site.phone }}</small></span></a>
          <a class="row" [href]="site.whatsappHref" target="_blank" rel="noopener"><span class="material-icons wa">chat</span><span><b>WhatsApp</b><small>Chat with Us</small></span></a>
          <a class="row" [href]="'mailto:' + site.email"><span class="material-icons">mail</span><span><b>Email Us</b><small>{{ site.email }}</small></span></a>
        </div>
      </div>
    </div>

    <app-band title="Ready to Take the Next Step?" text="Get expert guidance and the best loan offers tailored to your needs." cta="Apply for a Loan" link="/apply" [params]="{ product: tab() }" />
  `,
  styles: [
    `
      a { color: inherit; } .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; } .material-icons { font-size: 20px; }
      .tabs { display: flex; gap: 8px; margin: -18px 0 18px; position: relative; z-index: 2; overflow-x: auto; padding: 4px 2px 8px; }
      .tabs button { flex: 1 0 auto; min-width: 104px; display: grid; justify-items: center; gap: 4px; padding: 12px 10px; background: #fff; border: 1px solid var(--fw-line); border-radius: 10px; font: 500 0.78rem Poppins, sans-serif; color: var(--fw-ink); cursor: pointer; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.08); }
      .tabs button.on { background: var(--fw-blue); border-color: var(--fw-blue); color: #fff; }
      .tabs .material-icons { font-size: 24px; color: var(--fw-blue); } .tabs .on .material-icons { color: #fff; }
      .grid { display: grid; grid-template-columns: 1.15fr 1fr 0.8fr; gap: 16px; align-items: start; }
      .ctl { margin: 14px 0; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 6px 10px; }
      .ctl label { font-size: 0.84rem; font-weight: 500; }
      .ctl .rng, .ctl .ends { grid-column: 1 / -1; }
      .box { display: flex; align-items: center; gap: 6px; border: 1.5px solid var(--fw-line-strong); border-radius: 8px; padding: 0 12px; height: 40px; width: 170px; background: #fff; }
      .box input { border: 0; outline: 0; width: 100%; font: 500 0.92rem Poppins, sans-serif; text-align: right; background: transparent; min-width: 0; }
      .rng { width: 100%; accent-color: var(--fw-blue); } .ends { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--fw-muted); }
      .acts { display: flex; gap: 12px; align-items: center; margin-top: 8px; flex-wrap: wrap; } .acts .fw-btn--primary { flex: 1; }
      .badges { display: flex; gap: 12px; list-style: none; padding: 0; margin: 12px 0 0; font-size: 0.72rem; color: var(--fw-muted); flex-wrap: wrap; } .badges .material-icons { font-size: 15px; color: var(--fw-blue); margin-right: 3px; vertical-align: -3px; }
      .emi { background: var(--fw-blue-soft); border-radius: 10px; text-align: center; padding: 12px; margin: 10px 0; display: grid; } .emi span { font-size: 0.85rem; } .emi strong { font-size: 2rem; color: var(--fw-blue); }
      .trio { display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; gap: 6px; margin-bottom: 12px; } .trio span { display: block; font-size: 0.7rem; color: var(--fw-muted); } .trio b { font-size: 0.95rem; color: var(--fw-navy); }
      .donut-row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
      .donut { width: 150px; height: 150px; border-radius: 50%; display: grid; place-items: center; flex: none; } .donut > div { width: 98px; height: 98px; border-radius: 50%; background: #fff; display: grid; place-content: center; text-align: center; } .donut b { font-size: 0.85rem; } .donut span { font-size: 0.66rem; color: var(--fw-muted); }
      .donut-row ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; font-size: 0.78rem; } .donut-row li { display: grid; grid-template-columns: auto 1fr; column-gap: 8px; } .donut-row li b { grid-column: 2; font-size: 0.84rem; }
      .d { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; } .d--p { background: #1c6df0; } .d--i { background: #14b8a6; }
      .side { display: grid; gap: 14px; } .side__c { display: grid; gap: 10px; } .side__c > div { display: block; } .side__c h3, .side__q h3 { margin: 0 0 4px; font-size: 0.92rem; } .side__c p, .side__q p { margin: 0; font-size: 0.76rem; color: var(--fw-muted); line-height: 1.5; }
      .side__c .ic { color: var(--fw-blue); font-size: 30px; } .side__q { background: var(--fw-blue-soft); border-radius: 12px; padding: 16px; display: grid; gap: 8px; }
      .sched { margin-top: 16px; } .sched__h { display: flex; justify-content: space-between; align-items: center; } .sched__h h2 { margin: 0; }
      .link { background: none; border: 0; color: var(--fw-blue); font: 600 0.85rem Poppins, sans-serif; cursor: pointer; }
      .tw { overflow-x: auto; margin-top: 10px; } table { width: 100%; border-collapse: collapse; font-size: 0.84rem; } th, td { padding: 9px 12px; text-align: right; border-bottom: 1px solid var(--fw-line); white-space: nowrap; } th:first-child, td:first-child { text-align: left; } th { color: var(--fw-muted); font-weight: 600; }
      .strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: var(--fw-blue-soft); border-radius: 12px; padding: 14px; margin: 16px 0; }
      .strip > div { display: flex; gap: 10px; align-items: center; } .strip span:last-child { display: grid; line-height: 1.3; } .strip small { color: var(--fw-muted); font-size: 0.72rem; } .ic2 { color: var(--fw-blue); font-size: 30px; }
      .faqs { display: grid; grid-template-columns: 1.7fr 1fr; gap: 20px; margin-bottom: 28px; align-items: start; }
      .fh { display: flex; justify-content: space-between; gap: 12px; align-items: flex-end; margin-bottom: 10px; } .fh h2 { margin: 0; } .fh p { margin: 0; } .more { color: var(--fw-blue); text-decoration: none; font-size: 0.82rem; font-weight: 600; white-space: nowrap; }
      .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; } details { border: 1px solid var(--fw-line); border-radius: 8px; background: #fff; padding: 10px 14px; } summary { cursor: pointer; font-size: 0.85rem; font-weight: 500; } details p { margin: 8px 0 0; font-size: 0.8rem; color: var(--fw-muted); line-height: 1.55; }
      .help { background: var(--fw-blue-soft); display: grid; gap: 10px; } .help h3 { margin: 0; } .help p { margin: 0; } .row { display: flex; gap: 10px; align-items: center; text-decoration: none; font-size: 0.84rem; } .row span:last-child { display: grid; } .row small { color: var(--fw-muted); } .row .material-icons { background: var(--fw-blue); color: #fff; border-radius: 50%; padding: 7px; font-size: 18px; } .row .wa { background: #22c55e; }
      .emi-mini { display: none; }
      .bubble { display: none; }
      /* "Calculate EMI" points at the result: a blue ring that fades after a moment */
      .summary { transition: border-color 0.3s, box-shadow 0.3s; scroll-margin-top: 84px; }
      .summary.hl { border-color: var(--fw-blue); box-shadow: 0 0 0 3px rgba(28, 109, 240, 0.28), 0 12px 30px rgba(28, 109, 240, 0.3); }
      @media (max-width: 1100px) { .grid { grid-template-columns: 1fr 1fr; } .side { grid-column: 1 / -1; grid-template-columns: repeat(3, 1fr); } .faqs { grid-template-columns: 1fr; } }
      @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } .side { grid-template-columns: 1fr; } .strip { grid-template-columns: 1fr 1fr; } .faq-grid { grid-template-columns: 1fr; } .tabs { margin-top: 12px; } }
      /* ───── Phone calculator: the inputs card and the summary card are compact so both fit on one screen ───── */
      @media (max-width: 760px) {
        .grid { gap: 10px; }
        .grid > .fw-card { padding: 12px 14px; border-radius: 14px; }
        .grid > section:first-child .fw-h2, .grid > section:first-child > p { display: none; }
        /* Loan-type chips: one swipeable row of slim pills */
        .tabs { gap: 8px; margin: 10px -20px 8px; padding: 4px 20px 6px; scroll-snap-type: x proximity; scrollbar-width: none; }
        .tabs::-webkit-scrollbar { display: none; }
        .tabs button { flex: none; min-width: 0; display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border-radius: 99px; font-size: 0.78rem; white-space: nowrap; box-shadow: none; scroll-snap-align: start; }
        .tabs .material-icons { font-size: 17px; }
        /* The blue bubble glides (with a little overshoot) to the chosen chip; the chips fade out at the edges. */
        .tabs { position: relative; -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%); mask-image: linear-gradient(90deg, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%); }
        .bubble { display: block; position: absolute; left: 0; top: 0; border-radius: 99px; background: linear-gradient(135deg, #3b86ff, #1c6df0 55%, #1558c8); box-shadow: 0 8px 18px rgba(28, 109, 240, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35); pointer-events: none; transition: transform 0.5s cubic-bezier(0.34, 1.45, 0.5, 1), width 0.5s cubic-bezier(0.34, 1.45, 0.5, 1), height 0.3s; }
        .tabs button { position: relative; z-index: 1; transition: color 0.25s, transform 0.15s, border-color 0.25s; -webkit-tap-highlight-color: transparent; }
        .tabs button:active { transform: scale(0.93); }
        .tabs button.on { background: transparent; border-color: transparent; color: #fff; box-shadow: none; font-weight: 600; }
        .tabs button .material-icons { transition: transform 0.4s cubic-bezier(0.34, 1.6, 0.5, 1); }
        .tabs button.on .material-icons { transform: scale(1.15) rotate(-6deg); }
        @media (prefers-reduced-motion: reduce) { .bubble, .tabs button, .tabs button .material-icons { transition: none; } }
        /* Inputs: label left, small value box right, slider underneath */
        .ctl { grid-template-columns: 1fr auto; gap: 2px 10px; margin: 6px 0 8px; }
        .ctl label { font-size: 0.82rem; font-weight: 600; color: var(--fw-navy); }
        .box { width: 124px; height: 34px; border-radius: 9px; padding: 0 10px; border: 1.5px solid var(--fw-line-strong); box-shadow: none; }
        .box:focus-within { border-color: var(--fw-blue); }
        .box input { font-size: 0.92rem; font-weight: 600; color: var(--fw-navy); text-align: right; }
        .box span { font-size: 0.82rem; font-weight: 600; color: var(--fw-muted); }
        .rng { -webkit-appearance: none; appearance: none; height: 6px; margin: 8px 0 2px; border-radius: 99px; outline: 0; background: linear-gradient(90deg, var(--fw-blue) var(--p, 0%), #cfdcf2 var(--p, 0%)); }
        .rng::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--fw-blue); border: 3px solid #fff; box-shadow: 0 1px 6px rgba(28, 109, 240, 0.6); }
        .rng::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--fw-blue); border: 3px solid #fff; box-shadow: 0 1px 6px rgba(28, 109, 240, 0.6); }
        .ends { font-size: 0.64rem; }
        .acts { flex-wrap: nowrap; gap: 8px; margin-top: 4px; }
        .acts .fw-btn { padding: 9px 10px; font-size: 0.84rem; justify-content: center; box-sizing: border-box; }
        .acts .fw-btn--primary { flex: 1.7; } .acts .fw-btn--ghost { flex: 1; }
        .badges { flex-wrap: nowrap; justify-content: space-between; gap: 4px; margin-top: 8px; font-size: 0.64rem; white-space: nowrap; }
        .badges .material-icons { font-size: 13px; margin-right: 2px; }
        .emi-mini { display: none; }
        /* Summary: EMI, three totals, then the donut beside its legend */
        .grid > section:nth-child(2) .fw-h3 { font-size: 0.95rem; margin: 0 0 4px; }
        .emi { padding: 8px; margin: 6px 0 8px; } .emi span { font-size: 0.78rem; } .emi strong { font-size: 1.7rem; line-height: 1.15; }
        .trio { gap: 0; margin-bottom: 8px; } .trio > div + div { border-left: 1px solid var(--fw-line); }
        .trio span { font-size: 0.64rem; } .trio b { font-size: 0.82rem; }
        .donut-row { flex-wrap: nowrap; gap: 12px; }
        .donut { width: 104px; height: 104px; } .donut > div { width: 68px; height: 68px; } .donut b { font-size: 0.7rem; } .donut span { font-size: 0.56rem; }
        .donut-row ul { gap: 8px; font-size: 0.7rem; min-width: 0; } .donut-row li b { font-size: 0.74rem; }
        .grid > section:nth-child(2) > p { font-size: 0.62rem; line-height: 1.4; margin: 8px 0 0; padding: 6px 8px; border-radius: 8px; background: var(--fw-blue-soft); }
        /* Download + share side by side, quote bar underneath */
        .side { grid-template-columns: 1fr 1fr; gap: 10px; }
        .side__c { padding: 10px 12px; gap: 6px; }
        .side__c .ic { font-size: 22px; } .side__c h3 { font-size: 0.78rem; line-height: 1.25; } .side__c p { display: none; }
        .side__c .fw-btn { padding: 7px 8px; font-size: 0.7rem; justify-content: center; box-sizing: border-box; } .side__c .fw-btn .material-icons { font-size: 15px; }
        .side__q { grid-column: 1 / -1; grid-template-columns: 1fr auto; align-items: center; gap: 2px 12px; padding: 10px 12px; }
        .side__q h3 { font-size: 0.86rem; } .side__q p { font-size: 0.7rem; grid-column: 1; }
        .side__q .fw-btn { grid-column: 2; grid-row: 1 / span 2; width: auto; white-space: nowrap; }
        .sched__h { gap: 8px; flex-wrap: wrap; }
        .strip { padding: 12px; gap: 10px; }
        .fh { flex-direction: column; align-items: flex-start; }
      }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteCalculatorComponent {
  /** Inside the customer dashboard (/account) links stay in the dashboard instead of going to the public site. */
  protected readonly inPortal = inject(Router).url.startsWith('/account');
  private readonly route = inject(ActivatedRoute);

  protected readonly c = CALC;
  protected readonly site = WEBSITE;

  protected readonly tab = signal(CALC.tabs[0].key);
  protected readonly amount = signal(CALC.amount.default);
  protected readonly rate = signal(CALC.rate.default);
  protected readonly years = signal(CALC.tenure.defaultYears);
  protected readonly shown = signal(true);
  protected readonly schedOpen = signal(false);
  protected readonly shareMsg = signal('');
  protected readonly highlight = signal(false);
  private readonly tabsEl = viewChild.required<ElementRef<HTMLElement>>('tabsEl');
  /** Where the sliding bubble sits behind the active chip (phone layout only; hidden elsewhere). */
  protected readonly bubble = signal({ x: 0, y: 0, w: 0, h: 0 });
  private highlightTimer?: ReturnType<typeof setTimeout>;

  protected readonly current = computed(() => CALC.tabs.find((t) => t.key === this.tab()) ?? CALC.tabs[0]);
  protected readonly months = computed(() => Math.round(this.years() * 12));
  protected readonly summary = computed(() => summariseEmi(this.amount(), this.rate(), this.months()));
  protected readonly schedule = computed(() => yearlySchedule(this.amount(), this.rate(), this.months()));
  protected readonly pPct = computed(() => Math.round(this.summary().principalPercent));
  protected readonly iPct = computed(() => 100 - this.pPct());
  protected readonly donut = computed(() => `conic-gradient(#1c6df0 0 ${this.pPct()}%, #14b8a6 ${this.pPct()}% 100%)`);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.tabsEl().nativeElement;
      this.placeBubble(false);
      const ro = new ResizeObserver(() => this.placeBubble(false));
      ro.observe(el);
      destroyRef.onDestroy(() => ro.disconnect());
    });

    // Honour values passed from elsewhere on the site (?product=&amount=&years=).
    const q = this.route.snapshot.queryParamMap;
    const product = q.get('product');
    if (product && CALC.tabs.some((t) => t.key === product)) this.tab.set(product);
    const amount = Number(q.get('amount'));
    if (amount >= CALC.amount.min && amount <= CALC.amount.max) this.amount.set(amount);
    const years = Number(q.get('years'));
    if (years >= 0.5 && years <= this.current().maxYears) this.years.set(years);
  }

  /** Moves the bubble under the active chip and, when asked, slides that chip to the middle of the row. */
  private placeBubble(center: boolean): void {
    const row = this.tabsEl().nativeElement;
    const index = CALC.tabs.findIndex((t) => t.key === this.tab());
    const chip = row.querySelectorAll<HTMLElement>('button')[index];
    if (!chip) return;
    this.bubble.set({ x: chip.offsetLeft, y: chip.offsetTop, w: chip.offsetWidth, h: chip.offsetHeight });
    if (center) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  /** Phones: scroll down to the summary card. Every screen size: flash a blue border and shadow around it. */
  protected calculate(): void {
    this.shown.set(true);
    const card = document.getElementById('loan-summary');
    if (card && window.matchMedia('(max-width: 760px)').matches) {
      card.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
    this.highlight.set(true);
    clearTimeout(this.highlightTimer);
    this.highlightTimer = setTimeout(() => this.highlight.set(false), 1000);
  }

  protected select(key: string): void {
    this.tab.set(key);
    this.placeBubble(true);
    this.years.set(Math.min(this.years(), this.current().maxYears));
  }

  private clamp(v: number, min: number, max: number): number {
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
  }
  /** The box takes up to 10 digits; it is only clamped to the minimum once the user leaves it, so typing is not interrupted. */
  protected typeAmount(e: Event): void {
    const el = e.target as HTMLInputElement;
    const digits = el.value.replace(/D/g, '').slice(0, 10);
    if (el.value !== digits) el.value = digits;
    this.amount.set(Number(digits));
  }

  protected settleAmount(e: Event): void {
    this.amount.update((v) => Math.max(v, CALC.amount.min));
    (e.target as HTMLInputElement).value = String(this.amount());
  }

  protected setAmount(e: Event): void { this.amount.set(this.clamp(+(e.target as HTMLInputElement).value, CALC.amount.min, CALC.amount.max)); }
  protected setRate(e: Event): void { this.rate.set(this.clamp(+(e.target as HTMLInputElement).value, CALC.rate.min, CALC.rate.max)); }
  protected setYears(e: Event): void { this.years.set(this.clamp(+(e.target as HTMLInputElement).value, 0.5, this.current().maxYears)); }

  protected reset(): void {
    this.amount.set(CALC.amount.default);
    this.rate.set(CALC.rate.default);
    this.years.set(Math.min(CALC.tenure.defaultYears, this.current().maxYears));
  }

  /** Slider fill (0-100%) for the phone styling. */
  protected pct(v: number, min: number, max: number): string { return (max > min ? ((v - min) / (max - min)) * 100 : 0).toFixed(1) + '%'; }

  protected fmt(v: number): string { return '₹' + new Intl.NumberFormat('en-IN').format(v); }
  protected fmtN(v: number): string { return formatInr(Math.round(v)); }

  /** Month-wise schedule as a CSV the visitor can open in Excel. */
  protected download(): void {
    const r = this.rate() / 12 / 100;
    const emi = this.summary().emi;
    let balance = this.amount();
    const rows = ['Month,EMI,Principal,Interest,Balance'];
    for (let m = 1; m <= this.months(); m++) {
      const interest = balance * r;
      const principal = Math.min(balance, emi - interest);
      balance = Math.max(0, balance - principal);
      rows.push([m, emi.toFixed(2), principal.toFixed(2), interest.toFixed(2), balance.toFixed(2)].join(','));
    }
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `finoocean-${this.tab()}-schedule.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  protected async share(): Promise<void> {
    const link = `${location.origin}/calculator?product=${this.tab()}&amount=${Math.round(this.amount())}&years=${this.years()}`;
    const text = `${this.current().label}: EMI ${this.fmtN(this.summary().emi)} per month on ${this.fmtN(this.amount())}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'FINOOCEAN Loan Calculator', text, url: link });
      } else {
        await navigator.clipboard.writeText(`${text} — ${link}`);
        this.shareMsg.set('Link copied to clipboard.');
      }
    } catch {
      this.shareMsg.set('Sharing was cancelled.');
    }
  }
}
