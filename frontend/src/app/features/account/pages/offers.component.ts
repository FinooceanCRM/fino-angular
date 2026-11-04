import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HScrollDirective } from '../../website/shared/h-scroll.directive';
import { BreadcrumbComponent } from '@shared/components/breadcrumb.component';

interface Offer {
  slug: string;
  group: string;
  name: string;
  text: string;
  badge: string;
  badgeTone: 'green' | 'blue' | 'orange';
  icon: string;
  tone: string;
  rate: string;
  upto: string;
  points: string[];
}

/** Illustrative starting rates only — the final rate and amount are decided by the lender. */
const OFFERS: Offer[] = [
  { slug: 'personal-loan', group: 'personal', name: 'Personal Loan', text: 'For your personal needs', badge: 'Recommended', badgeTone: 'green', icon: 'savings', tone: 'green', rate: '10.50%', upto: '10,00,000', points: ['Minimal documentation', 'Quick approval', 'Flexible repayment tenure'] },
  { slug: 'home-loan', group: 'home', name: 'Home Loan', text: 'Make your dream home a reality', badge: 'Special Offer', badgeTone: 'blue', icon: 'home', tone: 'blue', rate: '8.40%', upto: '75,00,000', points: ['Lowest interest rates', 'Long repayment tenure', 'Tax benefits under Section 80C'] },
  { slug: 'business-loan', group: 'business', name: 'Business Loan', text: 'Grow your business', badge: 'Pre-Approved', badgeTone: 'green', icon: 'business', tone: 'purple', rate: '11.25%', upto: '50,00,000', points: ['Working capital support', 'Quick processing', 'Flexible EMI options'] },
  { slug: 'loan-against-property', group: 'lap', name: 'Loan Against Property', text: 'Unlock the value of your property', badge: 'Special Rate', badgeTone: 'orange', icon: 'apartment', tone: 'orange', rate: '9.00%', upto: '1,50,00,000', points: ['Higher loan amount', 'Lower interest rate', 'Flexible repayment options'] },
  { slug: 'education-loan', group: 'govt', name: 'Education Loan', text: 'Invest in a brighter future', badge: 'Student Special', badgeTone: 'blue', icon: 'school', tone: 'blue', rate: '9.50%', upto: '50,00,000', points: ['Cover tuition, living & more', 'Flexible repayment after course', 'No collateral for select courses'] },
  { slug: 'mudra-loan', group: 'govt', name: 'MUDRA Loan', text: 'Support for small businesses', badge: 'Government Scheme', badgeTone: 'orange', icon: 'account_balance', tone: 'green', rate: '8.80%', upto: '10,00,000', points: ['Backed by Government of India', 'Minimal documentation', 'Ideal for startups & small businesses'] },
];

const TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All Offers' },
  { key: 'personal', label: 'Personal Loan' },
  { key: 'home', label: 'Home Loan' },
  { key: 'business', label: 'Business Loan' },
  { key: 'lap', label: 'LAP' },
  { key: 'govt', label: 'Government Schemes' },
];

/** Offers for Me — layout follows images/12_Dashboard/09_Offers.png. */
@Component({
  selector: 'app-account-offers',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink, HScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb variant="portal" [withBack]="true" />
    <header class="head">
      <div><h1>Offers for Me</h1><p>Personalized loan offers based on your profile, eligibility and financial goals.</p></div>
      <p class="script" aria-hidden="true">Better Options<br />Brighter Tomorrow</p>
      <div class="excl"><span class="material-icons">redeem</span><div><b>Exclusive Offers for You</b><small>Based on your profile and eligibility. Updated regularly.</small></div></div>
    </header>

    <div class="tabs m-hscroll" appHScroll data-no-dots role="tablist" style="--m-bleed: 14px; --m-card-w: auto; --m-card-max: none">
      @for (t of tabs; track t.key) {
        <button type="button" role="tab" [attr.aria-selected]="tab() === t.key" [class.on]="tab() === t.key" (click)="tab.set(t.key)">{{ t.label }} ({{ count(t.key) }})</button>
      }
    </div>

    <section class="kyc">
      <span class="material-icons">redeem</span>
      <div><b>You're Eligible for Special Pre-Approved Offers!</b><small>Complete your KYC and get access to higher loan amounts and lower interest rates.</small></div>
      <a class="fw-btn fw-btn--danger" routerLink="/account/profile">Complete KYC <span class="material-icons">arrow_forward</span></a>
    </section>

    <div class="grid m-hscroll" appHScroll style="--m-bleed: 14px; --m-card-w: 100%">
      @for (o of shown(); track o.slug) {
        <article class="offer">
          <div class="offer__h">
            <span class="ic" [class]="'ic ic--' + o.tone"><span class="material-icons">{{ o.icon }}</span></span>
            <div><b>{{ o.name }}</b><small>{{ o.text }}</small></div>
            <span class="tag" [class]="'tag tag--' + o.badgeTone">{{ o.badge }}</span>
          </div>
          <div class="nums">
            <div><strong>{{ o.rate }}</strong><small>p.a. onwards</small></div>
            <div><small>Up to</small><strong class="amt">₹ {{ o.upto }}</strong></div>
          </div>
          <ul>@for (p of o.points; track p) { <li><span class="material-icons">check_circle</span>{{ p }}</li> }</ul>
          <div class="btns">
            <a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/apply" [queryParams]="{ product: o.slug }">View Details</a>
            <a class="fw-btn fw-btn--primary fw-btn--sm" routerLink="/account/apply" [queryParams]="{ product: o.slug }">Apply Now <span class="material-icons">arrow_forward</span></a>
          </div>
        </article>
      }
    </div>
    <p class="swipe" aria-hidden="true">Swipe to see more offers <span class="material-icons">east</span></p>
    <p class="note">Rates shown are indicative starting rates. The final rate, amount and terms are decided by the lender after assessing your profile.</p>

    <section class="trust">
      <div><span class="material-icons">verified_user</span><span><b>100% Genuine Offers</b><small>From trusted banks &amp; NBFCs</small></span></div>
      <div><span class="material-icons">person_search</span><span><b>Personalized for You</b><small>Based on your profile &amp; eligibility</small></span></div>
      <div><span class="material-icons">receipt_long</span><span><b>No Hidden Charges</b><small>Transparent terms &amp; conditions</small></span></div>
      <div><span class="material-icons">support_agent</span><span><b>Expert Guidance</b><small>Our team is always here to help</small></span></div>
    </section>
  `,
  styles: [
    `
      .fw-btn { white-space: nowrap; }
      .crumbs { display: flex; gap: 8px; font-size: 0.82rem; color: var(--fw-muted); margin-bottom: 8px; } .crumbs a { color: inherit; text-decoration: none; }
      .head { display: grid; grid-template-columns: 1fr auto auto; gap: 22px; align-items: center; margin-bottom: 16px; }
      h1 { margin: 0 0 4px; font-size: clamp(1.7rem, 3vw, 2.2rem); color: var(--fw-navy); } .head p { margin: 0; color: var(--fw-muted); font-size: 0.92rem; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.2rem; line-height: 1.2; color: var(--fw-navy-2); text-align: right; }
      .excl { display: flex; gap: 12px; align-items: center; background: var(--fw-blue-soft); border: 1px solid #dbe8fb; border-radius: 12px; padding: 12px 16px; max-width: 320px; }
      .excl .material-icons { font-size: 34px; color: var(--fw-blue); } .excl div { display: grid; } .excl small { color: var(--fw-muted); font-size: 0.74rem; }
      .tabs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
      .tabs button { border: 1px solid var(--fw-line); background: #fff; border-radius: 10px; padding: 10px 18px; font: 500 0.84rem Poppins, sans-serif; cursor: pointer; color: var(--fw-ink); }
      .tabs button.on { background: var(--fw-blue); color: #fff; border-color: var(--fw-blue); }
      .kyc { display: flex; align-items: center; gap: 14px; background: #fdf1f4; border: 1px solid #f6d6de; border-radius: 14px; padding: 14px 18px; margin-bottom: 16px; }
      .kyc > .material-icons { font-size: 36px; color: #e11d48; } .kyc div { display: grid; flex: 1; } .kyc b { color: var(--fw-navy); } .kyc small { color: var(--fw-muted); }
      .fw-btn--danger { background: #e11d48; color: #fff; border: 0; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
      .offer { background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; padding: 16px; display: grid; gap: 12px; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.04); }
      .offer__h { display: flex; gap: 10px; align-items: center; } .offer__h > div { display: grid; flex: 1; line-height: 1.25; } .offer__h b { font-size: 0.98rem; } .offer__h small { color: var(--fw-muted); font-size: 0.74rem; }
      .ic { width: 42px; height: 42px; border-radius: 10px; display: grid; place-items: center; color: #fff; flex: none; } .ic--green { background: #16a34a; } .ic--blue { background: #1c6df0; } .ic--purple { background: #7c3aed; } .ic--orange { background: #f97316; }
      .tag { font-size: 0.68rem; font-weight: 600; border-radius: 8px; padding: 3px 9px; white-space: nowrap; align-self: flex-start; } .tag--green { background: #dcfce7; color: #15803d; } .tag--blue { background: #dbeafe; color: #1d4ed8; } .tag--orange { background: #ffedd5; color: #c2410c; }
      .nums { display: flex; justify-content: space-between; align-items: flex-end; } .nums div { display: grid; line-height: 1.15; } .nums div:first-child strong { font-size: 1.9rem; color: #16a34a; } .nums div:last-child { text-align: left; }
      .nums small { color: var(--fw-muted); font-size: 0.76rem; } .nums .amt { font-size: 1.25rem; color: var(--fw-navy); }
      ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; } li { display: flex; gap: 8px; align-items: center; font-size: 0.82rem; color: var(--fw-ink); } li .material-icons { color: #16a34a; font-size: 18px; }
      .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; } .btns .fw-btn { justify-content: center; }
      .note { color: var(--fw-muted); font-size: 0.76rem; margin: 12px 2px; }
      .trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; background: var(--fw-blue-soft); border: 1px solid #dbe8fb; border-radius: 14px; padding: 16px; margin-top: 8px; }
      .trust > div { display: flex; gap: 10px; align-items: center; } .trust .material-icons { color: var(--fw-blue); font-size: 30px; } .trust span:last-child { display: grid; line-height: 1.25; } .trust small { color: var(--fw-muted); font-size: 0.72rem; }
      @media (max-width: 1100px) { .grid { grid-template-columns: repeat(2, 1fr); } .head { grid-template-columns: 1fr; } .script, .excl { display: none; } .trust { grid-template-columns: 1fr 1fr; } }
      .swipe { display: none; }
      @media (max-width: 720px) { .swipe { display: flex; align-items: center; justify-content: center; gap: 6px; margin: -4px 0 12px; font-size: 0.8rem; font-weight: 500; color: var(--fw-blue); } .swipe .material-icons { font-size: 18px; animation: swipe-nudge 1.4s ease-in-out infinite; } }
      @keyframes swipe-nudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(6px); } }
      @media (prefers-reduced-motion: reduce) { .swipe .material-icons { animation: none; } }
      @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } .kyc { flex-wrap: wrap; } }
    `,
  ],
  styleUrl: '../../website/website-ui.scss',
})
export class AccountOffersComponent {
  protected readonly tabs = TABS;
  protected readonly tab = signal('all');
  protected readonly shown = computed(() => (this.tab() === 'all' ? OFFERS : OFFERS.filter((o) => o.group === this.tab())));

  protected count(key: string): number {
    return key === 'all' ? OFFERS.length : OFFERS.filter((o) => o.group === key).length;
  }
}
