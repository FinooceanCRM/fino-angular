import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PRODUCT_PAGES, ProductPage } from '../product-pages.data';
import { WEBSITE } from '../website.config';
import { HScrollDirective } from '../shared/h-scroll.directive';

const ICONS: [RegExp, string][] = [
  [/travel/i, 'flight'], [/wedding/i, 'favorite'], [/renovation/i, 'home_repair_service'], [/medical/i, 'medical_services'],
  [/gadget/i, 'devices'], [/much more|more sectors/i, 'more_horiz'], [/education/i, 'school'], [/debt/i, 'account_balance_wallet'],
  [/working capital/i, 'payments'], [/expansion/i, 'trending_up'], [/machinery/i, 'precision_manufacturing'],
  [/new (business )?setup|new business/i, 'storefront'], [/franchise/i, 'store'], [/buy/i, 'home'], [/construct/i, 'construction'],
  [/plot/i, 'landscape'], [/balance/i, 'swap_horiz'], [/personal goals/i, 'flag'], [/manufactur/i, 'factory'],
  [/services/i, 'miscellaneous_services'], [/trading/i, 'swap_horiz'], [/agri/i, 'agriculture'], [/retail/i, 'shopping_bag'],
  [/micro/i, 'business'], [/real estate/i, 'apartment'], [/infrastructure/i, 'engineering'], [/health/i, 'local_hospital'],
  [/hospitality/i, 'hotel'], [/renewable/i, 'bolt'], [/food/i, 'restaurant'], [/handicraft/i, 'palette'], [/rural/i, 'landscape'],
  [/transport/i, 'local_shipping'],
];
const FLAGS: Record<string, string> = { India: '🇮🇳', USA: '🇺🇸', UK: '🇬🇧', Canada: '🇨🇦', Australia: '🇦🇺', Germany: '🇩🇪' };
const STRIP_ICONS = ['savings', 'percent', 'calendar_month', 'groups'];
const WHY_ICONS = ['bolt', 'description', 'percent', 'event_repeat', 'support_agent', 'verified_user'];
const TEXT_LISTS = ['Popular Car Loan Brands'];

/** Parses "₹5 Lakh" / "₹1 Crore" / "5 Years" style option labels. */
function parseInr(label: string): number {
  const n = parseFloat(label.replace(/[^0-9.]/g, ''));
  if (!isFinite(n)) return 0;
  return /crore/i.test(label) ? n * 1e7 : /lakh/i.test(label) ? n * 1e5 : n;
}

/** One loan product page, rendered from product-pages.data.ts. `slug` binds from the route. */
@Component({
  selector: 'app-website-service-detail',
  standalone: true,
  imports: [HScrollDirective, RouterLink, FormsModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!page()) {
      <div class="fw-container fw-section">
        <h1 class="fw-h2">We couldn’t find that loan product</h1>
        <a class="fw-btn fw-btn--primary" routerLink="/services">See all services</a>
      </div>
    } @else {
      @if (page(); as p) {
        <!-- ───────── Hero ───────── -->
        <section class="hero">
          <div class="fw-container hero__inner" [class.hero__inner--card]="p.eligibility.where === 'hero'">
            <div class="hero__copy">
              <nav class="crumbs" aria-label="Breadcrumb"><a routerLink="/">Home</a><span>›</span><a routerLink="/services">Services</a><span>›</span><span aria-current="page">{{ p.name }}</span></nav>
              @if (p.kicker) { <p class="kicker">{{ p.kicker }}</p> }
              <h1>{{ titleStart() }} <span>{{ titleEnd() }}</span></h1>
              <h2>{{ p.tagline }}</h2>
              <p class="desc">{{ p.description }}</p>
              <div class="cta">
                <a class="fw-btn fw-btn--primary" routerLink="/apply" [queryParams]="{ product: p.slug }">{{ p.applyLabel }} <span class="material-icons">arrow_forward</span></a>
                @if (p.secondaryCta === 'Consult an Expert') {
                  <a class="fw-btn fw-btn--outline-light" routerLink="/contact">{{ p.secondaryCta }}</a>
                } @else {
                  <a class="fw-btn fw-btn--outline-light" href="#eligibility" (click)="jump($event, 'eligibility')">{{ p.secondaryCta }} <span class="material-icons">arrow_forward</span></a>
                }
              </div>
              <ul class="feats">
                @for (f of p.heroFeatures; track f.label) { <li><span class="material-icons">{{ f.icon }}</span>{{ f.label }}</li> }
              </ul>
            </div>

            <div class="hero__mid">
              <p class="script" aria-hidden="true">{{ p.script }}</p>
              @if (p.scheme; as s) {
                <div class="scheme">
                  <div class="scheme__head"><strong>{{ s.title }}</strong><span>{{ s.subtitle }}</span></div>
                  <ul>@for (b of s.bullets; track b) { <li><span class="material-icons">check_circle</span>{{ b }}</li> }</ul>
                </div>
              }
            </div>

            @if (p.eligibility.where === 'hero') {
              <div class="hero__card" id="eligibility">
                <ng-container *ngTemplateOutlet="form" />
              </div>
            } @else if (p.heroSide; as side) {
              <div class="side" [class.side--list]="!side.title">
                @if (side.title) { <h3>{{ side.title }}</h3> }
                <ul>@for (i of side.items; track i) { <li><span class="material-icons">{{ iconFor(i) }}</span>{{ i }}</li> }</ul>
              </div>
            }
          </div>
        </section>

        <!-- ───────── Facts strip ───────── -->
        <div class="fw-container">
          <div class="strip">
            @for (s of p.strip; track s.label; let i = $index) {
              <div class="strip__i"><span class="strip__ic material-icons">{{ s.icon ?? stripIcon(i) }}</span><div><span class="strip__l">{{ s.label }}</span><strong>{{ s.value }}</strong></div></div>
            }
          </div>
        </div>

        <!-- ───────── Why + side panels ───────── -->
        <section class="fw-section body">
          <div class="fw-container body__grid">
            <div class="why">
              <h2 class="fw-h2">{{ p.whyTitle }}</h2>
              <p class="fw-muted why__sub">{{ p.whySub }}</p>
              <div class="why__grid m-hscroll" appHScroll style="--m-card-w: 78%">
                @for (w of p.why; track w.title; let i = $index) {
                  <div class="why__c"><span class="why__ic material-icons">{{ w.icon ?? whyIcon(i) }}</span><div><strong>{{ w.title }}</strong>@if (w.text) { <span>{{ w.text }}</span> }</div></div>
                }
              </div>
            </div>

            <div class="panels">
              @if (p.eligibility.where === 'body') {
                <div class="elig" [class.elig--dark]="p.eligibility.dark" id="eligibility"><ng-container *ngTemplateOutlet="form" /></div>
              }
              <div class="quote" [class.quote--wide]="!!p.quote.stats">
                <p class="quote__t">{{ p.quote.text }}</p>
                @if (p.quote.bullets) { <ul class="quote__b">@for (b of p.quote.bullets; track b) { <li><span class="material-icons">check_circle</span>{{ b }}</li> }</ul> }
                @if (p.quote.stats; as st) {
                  <div class="quote__stats">@for (s of st; track s.label) { <div><strong>{{ s.value }}</strong><span>{{ s.label }}</span></div> }</div>
                }
                @if (p.quote.footer) { <p class="quote__f">{{ p.quote.footer }}</p> }
                @if (p.talk.title === '' && !p.talk.phoneNote) {
                  <a class="fw-btn fw-btn--light fw-btn--sm" routerLink="/contact">{{ p.talk.cta }} <span class="material-icons">arrow_forward</span></a>
                }
              </div>
              @if (p.talk.title) {
                <div class="talk">
                  <h3>{{ p.talk.title }}</h3>
                  <p>{{ p.talk.text }}</p>
                  <a class="talk__phone" [href]="site.phoneHref"><span class="material-icons">phone_in_talk</span><span><b>{{ site.phone }}</b><small>{{ site.hours.replace(' · ', ' ') }}</small></span></a>
                  <a class="fw-btn fw-btn--light fw-btn--block" routerLink="/contact">{{ p.talk.cta }} <span class="material-icons">arrow_forward</span></a>
                  <ul class="talk__b">@for (b of p.talk.badges; track b) { <li><span class="material-icons">verified</span>{{ b }}</li> }</ul>
                </div>
              } @else if (p.talk.phoneNote) {
                <div class="talk talk--mini">
                  <p>Get Expert Consultation Today!</p>
                  <a class="talk__phone" [href]="site.phoneHref"><span class="material-icons">phone_in_talk</span><span><b>{{ site.phone }}</b><small>{{ site.hours.replace(' · ', ' ') }}</small></span></a>
                  <a class="fw-btn fw-btn--light fw-btn--block" routerLink="/contact">{{ p.talk.cta }} <span class="material-icons">arrow_forward</span></a>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- ───────── How it works + list ───────── -->
        <section class="fw-section how">
          <div class="fw-container how__grid">
            <div>
              <h2 class="fw-h2">{{ p.how.title }}</h2>
              <p class="fw-muted">{{ p.how.sub }}</p>
              <ol class="steps m-hscroll" appHScroll style="--m-card-w: 64%">
                @for (s of p.how.steps; track s.title; let i = $index) { <li><span class="steps__n">{{ i + 1 }}</span><div><strong>{{ s.title }}</strong><span>{{ s.text }}</span></div></li> }
              </ol>
            </div>
            <div>
              <h2 class="fw-h2 small-h">{{ p.listTitle }}</h2>
              <ul class="uses" [class.uses--text]="isTextList()">
                @for (u of p.list; track u) {
                  <li>@if (!isTextList()) { @if (flag(u); as f) { <span class="uses__flag">{{ f }}</span> } @else { <span class="uses__ic material-icons">{{ iconFor(u) }}</span> } }{{ u }}</li>
                }
              </ul>
            </div>
          </div>
          @if (p.partners; as ps) {
            <div class="fw-container partners"><strong>Our Banking Partners</strong>@for (b of ps; track b) { <span>{{ b }}</span> }<span class="more">and more…</span></div>
          }
        </section>

        <!-- ───────── Closing band ───────── -->
        <section class="band">
          <div class="fw-container band__inner">
            <div><h2>{{ p.band.title }}</h2><p>{{ p.band.text }}</p></div>
            <a class="fw-btn fw-btn--primary" routerLink="/apply" [queryParams]="{ product: p.slug }">{{ p.band.cta }} <span class="material-icons">arrow_forward</span></a>
          </div>
        </section>

        <p class="fw-container disclaimer fw-small fw-muted">Rates, amounts, tenures and subsidies shown are indicative and depend on the lender, the scheme and your profile. Approval is at the lender’s discretion; FINOOCEAN is a loan facilitator.</p>

        <!-- Shared eligibility form (hero card / body card) -->
        <ng-template #form>
          <h3 class="f__title">{{ p.eligibility.title }}</h3>
          <p class="f__sub">{{ p.eligibility.subtitle }}</p>
          @if (p.eligibility.toggle; as t) {
            <div class="toggle" role="tablist">@for (o of t; track o; let i = $index) { <button type="button" role="tab" [attr.aria-selected]="tog() === i" [class.on]="tog() === i" (click)="tog.set(i)">{{ o }}</button> }</div>
          }
          <form (ngSubmit)="check()" class="f">
            @for (f of p.eligibility.fields; track f.key + f.label) {
              @if (f.kind === 'radio') {
                <div class="radios">@for (o of f.options ?? []; track o) { <label><input type="radio" [name]="f.key" [value]="o" [ngModel]="vals()[f.key] ?? (f.options ?? [])[0]" (ngModelChange)="set(f.key, $event)" /> {{ o }}</label> }</div>
              } @else {
                <label class="f__l" [attr.for]="'f-' + f.key">{{ f.label }}</label>
                @if (f.kind === 'select') {
                  <select [id]="'f-' + f.key" [name]="f.key" [ngModel]="vals()[f.key] ?? ''" (ngModelChange)="set(f.key, $event)">
                    <option value="">{{ f.placeholder }}</option>
                    @for (o of f.options ?? []; track o) { <option [value]="o">{{ o }}</option> }
                  </select>
                } @else {
                  <input [id]="'f-' + f.key" [name]="f.key" type="number" inputmode="numeric" min="0" [placeholder]="f.placeholder ?? ''" [ngModel]="vals()[f.key] ?? ''" (ngModelChange)="set(f.key, $event)" />
                }
              }
            }
            <button type="submit" class="fw-btn fw-btn--primary fw-btn--block">Check Eligibility <span class="material-icons">arrow_forward</span></button>
            <ul class="f__badges">@for (b of p.eligibility.badges; track b) { <li><span class="material-icons">check_circle</span>{{ b }}</li> }</ul>
          </form>
        </ng-template>
      }
    }
  `,
  styles: [
    `
      a { color: inherit; } .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; } .fw-btn--light { color: var(--fw-navy); }
      .material-icons { font-size: 20px; }
      /* Hero */
      .hero { background: linear-gradient(115deg, #061a3d 0%, #0a2f66 55%, #0d4a9a 100%); color: #fff; padding: 22px 0 34px; position: relative; overflow: hidden; }
      .hero::after { content: ''; position: absolute; right: -10%; top: -30%; width: 60%; height: 160%; background: radial-gradient(closest-side, rgba(77, 163, 255, 0.28), transparent 70%); pointer-events: none; }
      .hero__inner { position: relative; z-index: 1; display: grid; grid-template-columns: 1.25fr 0.9fr 270px; gap: 24px; align-items: start; }
      .hero__inner--card { grid-template-columns: 1.3fr 0.7fr 330px; }
      .crumbs { display: flex; gap: 8px; font-size: 0.76rem; color: #cfe0ff; margin-bottom: 12px; flex-wrap: wrap; } .crumbs a { text-decoration: none; }
      .kicker { text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.5px; margin: 0 0 4px; color: #dbe8ff; }
      h1 { font-size: clamp(2.2rem, 4.4vw, 3.4rem); line-height: 1.05; margin: 0 0 8px; font-weight: 700; }
      h1 span { color: #4dc4ff; }
      .hero h2 { font-size: clamp(1.05rem, 1.8vw, 1.35rem); margin: 0 0 10px; font-weight: 500; line-height: 1.3; }
      .desc { font-size: 0.9rem; line-height: 1.6; color: #dbe8ff; margin: 0 0 16px; max-width: 560px; }
      .cta { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
      .feats { display: flex; gap: 6px 20px; flex-wrap: wrap; list-style: none; padding: 0; margin: 0; font-size: 0.78rem; color: #dbe8ff; }
      .feats .material-icons { font-size: 18px; margin-right: 6px; color: #7db4ff; }
      .hero__mid { display: grid; gap: 14px; align-content: start; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.45rem; line-height: 1.25; color: #e6f0ff; margin: 28px 0 0; }
      .scheme { background: #fff; color: var(--fw-ink); border-radius: 12px; padding: 12px; }
      .scheme__head { text-align: center; display: grid; padding-bottom: 8px; border-bottom: 1px solid var(--fw-line); margin-bottom: 8px; } .scheme__head strong { font-size: 1.1rem; color: var(--fw-navy); } .scheme__head span { font-size: 0.74rem; color: var(--fw-muted); }
      .scheme ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 0.78rem; } .scheme li { display: flex; gap: 6px; align-items: center; } .scheme .material-icons { color: #16a34a; font-size: 17px; }
      .side { background: #fff; color: var(--fw-ink); border-radius: 12px; padding: 12px; }
      .side h3 { margin: 0 0 8px; font-size: 1rem; color: var(--fw-navy); }
      .side ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 0.82rem; }
      .side li { display: flex; gap: 8px; align-items: center; } .side .material-icons { color: var(--fw-blue); font-size: 18px; }
      .side--list { background: transparent; padding: 0; } .side--list li { background: #fff; border-radius: 8px; padding: 9px 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
      .hero__card, .elig { background: #fff; color: var(--fw-ink); border-radius: 12px; padding: 16px; box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25); }
      .elig { box-shadow: none; border: 1px solid var(--fw-line); background: var(--fw-blue-soft); }
      .elig--dark { background: #0a2f66; color: #fff; border-color: transparent; }
      .elig--dark .f__sub, .elig--dark .f__l { color: #cfe0ff; }
      /* Eligibility form */
      .f__title { margin: 0 0 2px; font-size: 1.02rem; } .f__sub { margin: 0 0 10px; font-size: 0.78rem; color: var(--fw-muted); }
      .toggle { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 10px; border: 1px solid var(--fw-line-strong); border-radius: 6px; overflow: hidden; }
      .toggle button { border: 0; background: #fff; padding: 7px; font: 500 0.78rem Poppins, sans-serif; cursor: pointer; color: var(--fw-ink); } .toggle .on { background: var(--fw-blue); color: #fff; }
      .f { display: grid; gap: 4px; } .f__l { font-size: 0.74rem; font-weight: 600; margin-top: 4px; }
      .f input[type='number'], .f select { width: 100%; box-sizing: border-box; height: 38px; border: 1px solid var(--fw-line-strong); border-radius: 6px; padding: 0 10px; font: 400 0.84rem Poppins, sans-serif; background: #fff; color: var(--fw-ink); }
      .f input:focus, .f select:focus { outline: 2px solid var(--fw-blue); outline-offset: 0; }
      .radios { display: flex; gap: 16px; font-size: 0.8rem; margin: 4px 0; color: inherit; }
      .f .fw-btn { margin-top: 8px; } .f__badges { display: flex; justify-content: space-between; gap: 6px; flex-wrap: wrap; list-style: none; padding: 0; margin: 8px 0 0; font-size: 0.68rem; color: var(--fw-muted); }
      .elig--dark .f__badges { color: #cfe0ff; } .f__badges .material-icons { font-size: 14px; color: var(--fw-blue); margin-right: 3px; vertical-align: -3px; }
      /* Strip */
      .strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); background: var(--fw-blue-soft); border: 1px solid #dbe8fb; border-radius: 12px; margin-top: -1px; padding: 14px 6px; }
      .strip__i { display: flex; gap: 12px; align-items: center; padding: 0 14px; border-left: 1px solid #d3e1f6; } .strip__i:first-child { border-left: 0; }
      .strip__ic { width: 42px; height: 42px; flex: none; border-radius: 50%; background: var(--fw-blue); color: #fff; display: grid; place-items: center; font-size: 22px; }
      .strip__i div { display: grid; line-height: 1.3; } .strip__l { font-size: 0.74rem; color: var(--fw-muted); } .strip__i strong { font-size: 0.92rem; color: var(--fw-navy); }
      /* Body */
      .body { padding-top: 28px; } .body__grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: start; }
      .why__sub { margin: 0 0 14px; font-size: 0.88rem; line-height: 1.6; }
      .why__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .why__c { display: flex; gap: 10px; align-items: flex-start; background: #fff; border: 1px solid var(--fw-line); border-radius: 10px; padding: 12px; box-shadow: 0 1px 6px rgba(16, 33, 58, 0.05); }
      .why__ic { width: 36px; height: 36px; flex: none; border-radius: 50%; background: var(--fw-blue); color: #fff; display: grid; place-items: center; font-size: 19px; }
      .why__c div { display: grid; gap: 2px; } .why__c strong { font-size: 0.84rem; } .why__c span:not(.why__ic) { font-size: 0.74rem; color: var(--fw-muted); line-height: 1.4; }
      .panels { display: grid; gap: 14px; }
      .quote { background: linear-gradient(135deg, #0a2f66, #0d4a9a); color: #fff; border-radius: 12px; padding: 18px; display: grid; gap: 10px; align-content: start; }
      .quote__t { font-family: Lora, serif; font-style: italic; font-size: 1.35rem; line-height: 1.3; margin: 0; } .quote__f { margin: 0; font-size: 0.86rem; color: #cfe0ff; }
      .quote__b { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: 0.82rem; } .quote__b .material-icons { font-size: 16px; margin-right: 6px; color: #7db4ff; vertical-align: -3px; }
      .quote__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 10px; text-align: center; }
      .quote__stats strong { display: block; font-size: 1.1rem; } .quote__stats span { font-size: 0.7rem; color: #cfe0ff; }
      .talk { background: #072452; color: #fff; border-radius: 12px; padding: 18px; display: grid; gap: 10px; }
      .talk h3 { margin: 0; font-size: 1.05rem; } .talk p { margin: 0; font-size: 0.82rem; color: #cfe0ff; line-height: 1.5; }
      .talk__phone { display: flex; gap: 10px; align-items: center; color: #fff; text-decoration: none; } .talk__phone .material-icons { background: var(--fw-blue); border-radius: 50%; padding: 8px; font-size: 20px; }
      .talk__phone span:last-child { display: grid; } .talk__phone b { font-size: 1.05rem; } .talk__phone small { color: #cfe0ff; font-size: 0.72rem; }
      .talk__b { display: flex; gap: 6px 14px; flex-wrap: wrap; list-style: none; margin: 0; padding: 0; font-size: 0.7rem; color: #cfe0ff; } .talk__b .material-icons { font-size: 15px; color: #7db4ff; margin-right: 3px; vertical-align: -3px; }
      .talk--mini { background: var(--fw-blue-soft); color: var(--fw-ink); border: 1px solid #dbe8fb; } .talk--mini p { color: var(--fw-navy); font-weight: 600; } .talk--mini .talk__phone { color: var(--fw-navy); } .talk--mini .talk__phone small { color: var(--fw-muted); }
      .talk--mini .fw-btn--light { border: 1px solid var(--fw-blue); color: var(--fw-blue); background: #fff; }
      /* How */
      .how { padding-top: 6px; } .how__grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: start; }
      .steps { list-style: none; margin: 12px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .steps li { display: flex; gap: 10px; align-items: center; background: #fff; border: 1px solid var(--fw-line); border-radius: 10px; padding: 10px; position: relative; }
      .steps__n { width: 30px; height: 30px; flex: none; border-radius: 50%; background: var(--fw-blue); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 0.85rem; }
      .steps li div { display: grid; line-height: 1.3; } .steps strong { font-size: 0.8rem; } .steps span:not(.steps__n) { font-size: 0.7rem; color: var(--fw-muted); }
      .small-h { font-size: 1.1rem; }
      .uses { list-style: none; margin: 12px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
      .uses li { display: grid; justify-items: center; gap: 6px; text-align: center; background: #fff; border: 1px solid var(--fw-line); border-radius: 10px; padding: 10px 6px; font-size: 0.72rem; font-weight: 500; }
      .uses__ic { color: var(--fw-blue); font-size: 24px; } .uses__flag { font-size: 24px; }
      .uses--text li { font-weight: 600; font-size: 0.8rem; padding: 14px 6px; }
      .partners { display: flex; flex-wrap: wrap; gap: 8px 18px; align-items: center; margin-top: 22px; font-size: 0.85rem; } .partners strong { margin-right: 6px; } .partners span { font-weight: 700; color: var(--fw-navy); } .partners .more { font-weight: 400; color: var(--fw-muted); }
      /* Band */
      .band { background: linear-gradient(90deg, #061a3d, #0d3a75); color: #fff; padding: 24px 0; margin-top: 14px; }
      .band__inner { display: flex; justify-content: space-between; align-items: center; gap: 18px; flex-wrap: wrap; }
      .band h2 { margin: 0 0 4px; font-size: 1.25rem; } .band p { margin: 0; color: #cfe0ff; font-size: 0.88rem; }
      .disclaimer { margin: 14px auto 24px; }
      @media (max-width: 1100px) {
        .hero__inner, .hero__inner--card { grid-template-columns: 1fr 300px; }
        .hero__mid { display: none; }
        .body__grid, .how__grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 860px) {
        .hero__inner, .hero__inner--card { grid-template-columns: 1fr; }
        .strip { grid-template-columns: 1fr 1fr; row-gap: 12px; } .strip__i:nth-child(3) { border-left: 0; }
        .steps { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 720px) { .strip { margin-top: 20px; } }
      @media (max-width: 560px) {
        .why__grid { grid-template-columns: 1fr; }
        .cta .fw-btn { flex: 1; }
      }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteServiceDetailComponent {
  private readonly router = inject(Router);

  readonly slug = input.required<string>();

  protected readonly site = WEBSITE;
  protected readonly page = computed<ProductPage | undefined>(() => PRODUCT_PAGES.find((p) => p.slug === this.slug()));
  protected readonly tog = signal(0);
  protected readonly vals = signal<Record<string, string | undefined>>({});

  /** "Personal Loan" → "Personal" + "Loan"; "Stand-Up India Loan" highlights "India Loan". */
  protected readonly titleStart = computed(() => {
    const words = (this.page()?.name ?? '').split(' ');
    return words.slice(0, this.page()?.slug === 'stand-up-india' ? 1 : -1).join(' ');
  });
  protected readonly titleEnd = computed(() => {
    const words = (this.page()?.name ?? '').split(' ');
    return words.slice(this.page()?.slug === 'stand-up-india' ? 1 : -1).join(' ');
  });
  protected readonly isTextList = computed(() => TEXT_LISTS.includes(this.page()?.listTitle ?? ''));

  protected iconFor(label: string): string {
    return ICONS.find(([re]) => re.test(label))?.[1] ?? 'check_circle';
  }
  protected flag(label: string): string | undefined {
    return FLAGS[label];
  }
  protected stripIcon(i: number): string {
    return STRIP_ICONS[i] ?? 'check_circle';
  }
  protected whyIcon(i: number): string {
    return WHY_ICONS[i % WHY_ICONS.length];
  }

  protected set(key: string, value: string): void {
    this.vals.update((v) => ({ ...v, [key]: value }));
  }

  protected jump(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Sends whatever the visitor entered to the indicative eligibility page,
   * mapping car price / down payment and course fees onto a loan amount.
   */
  protected check(): void {
    const v = this.vals();
    const num = (k: string) => {
      const raw = v[k] ?? '';
      return raw ? (/lakh|crore/i.test(raw) ? parseInr(raw) : Number(raw)) : 0;
    };
    const amount = num('amount') || (num('price') ? Math.max(0, num('price') - num('down')) : 0) || num('fees') || num('cost');
    const years = parseFloat(v['tenure'] ?? '') || 0;

    const q: Record<string, string | number> = { product: this.slug() };
    if (amount > 0) q['amount'] = Math.round(amount);
    if (years > 0) q['years'] = years;
    if (num('income') > 0) q['income'] = Math.round(num('income'));
    if (num('emi') > 0) q['emi'] = Math.round(num('emi'));
    void this.router.navigate(['/eligibility'], { queryParams: q });
  }
}
