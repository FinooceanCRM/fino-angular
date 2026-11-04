import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CustomerDashboard } from '@core/models/customer-portal.model';
import { CustomerPortalService } from '@core/services/customer-portal.service';
import { formatInr } from '@core/utils/emi';

import { loanIcon } from '../../website/loan-images';
import { loanTypeIcon } from '../loan-type-icon';
import { PRODUCT_PAGES } from '../../website/product-pages.data';
import { HScrollDirective } from '../../website/shared/h-scroll.directive';
import { WEBSITE } from '../../website/website.config';

/** Customer dashboard home — layout follows images/12_Dashboard/01_Dashboard_Home.png. */
@Component({
  selector: 'app-account-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, HScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error()) {
      <div class="fw-alert fw-alert--error" role="alert">{{ error() }} <button class="retry" (click)="load()">Retry</button></div>
    } @else if (!data()) {
      <div class="fw-skeleton" style="height:190px;margin-bottom:16px"></div>
      <div class="fw-grid fw-grid--3"><div class="fw-skeleton" style="height:100px"></div><div class="fw-skeleton" style="height:100px"></div><div class="fw-skeleton" style="height:100px"></div></div>
    } @else {
      @if (data(); as d) {
        <section class="hero">
          <div class="hero__copy">
            <h1>Welcome Back, {{ first(d.name) }}!</h1>
            <p>Continue your financial journey with Finoocean.</p>
            <ul class="feats">
              <li><a routerLink="/account/applications"><span class="material-icons">assignment_turned_in</span><b>Track Applications</b><small>Real-time updates</small></a></li>
              <li><a routerLink="/account/documents"><span class="material-icons">folder_shared</span><b>Manage Documents</b><small>Secure &amp; easy access</small></a></li>
              <li><a routerLink="/account/offers"><span class="material-icons">local_offer</span><b>Get Personalized Offers</b><small>Based on your profile</small></a></li>
              <li><a routerLink="/account/help"><span class="material-icons">support_agent</span><b>Expert Support</b><small>Always here for you</small></a></li>
            </ul>
          </div>
          <p class="hero__script" aria-hidden="true">Smarter Loans<br />Brighter Tomorrow</p>
        </section>

        <div class="quick">
          <a routerLink="/account/apply"><span class="q q--blue material-icons">note_add</span>Apply for a New Loan</a>
          <a routerLink="/account/calculator"><span class="q q--purple material-icons">calculate</span>Use Loan Calculator</a>
          <a routerLink="/account/documents"><span class="q q--orange material-icons">upload_file</span>Upload Documents</a>
          <a routerLink="/account/offers"><span class="q q--green material-icons">local_offer</span>View Offers</a>
        </div>

        @if (d.pending_actions.length) {
          <section class="fw-card todo">
            <h2 class="fw-h3"><span class="material-icons">priority_high</span> Needs your attention</h2>
            @for (a of d.pending_actions; track a.lead_id) {
              <a class="todo__row" [routerLink]="['/account/applications', a.lead_id]">
                <div><strong>{{ a.reference }}</strong><span class="fw-small fw-muted"> — {{ a.message }}</span>
                  @if (a.missing_documents.length) { <div class="fw-small fw-muted">Missing: {{ a.missing_documents.join(', ') }}</div> }
                </div>
                <span class="material-icons">chevron_right</span>
              </a>
            }
          </section>
        }

        <div class="cols">
          <div class="main">
            <section class="panel">
              <div class="head"><h2>My Loan Applications</h2><a routerLink="/account/applications">View All →</a></div>
              @if (d.recent_applications.length === 0) {
                <div class="empty">
                  <span class="material-icons">description</span>
                  <p>You haven’t applied for a loan yet.</p>
                  <a class="fw-btn fw-btn--primary fw-btn--sm" routerLink="/account/apply">Start an application</a>
                </div>
              } @else {
                @for (a of d.recent_applications; track a.id) {
                  <div class="app">
                    <div class="app__top">
                      <span class="app__ic material-icons">{{ iconFor(a.loan_type) }}</span>
                      <div class="app__c"><strong>{{ a.loan_type_label }}</strong><small>Application ID</small><b>{{ a.reference }}</b></div>
                    </div>
                    <div class="app__meta">
                      <div class="app__c"><small>Loan Amount</small><b>{{ fmt(a.loan_amount) }}</b></div>
                      <div class="app__c app__status"><small>Status</small><span class="fw-pill" [class]="'fw-pill fw-pill--' + a.status.tone">{{ a.status.label }}</span></div>
                      <div class="app__c"><small>Applied On</small><b>{{ a.applied_on | date: 'd MMM y' }}</b></div>
                    </div>
                    <a class="fw-btn fw-btn--ghost fw-btn--sm" [routerLink]="['/account/applications', a.id]">View Details <span class="material-icons">arrow_forward</span></a>
                  </div>
                }
              }
            </section>

            <section class="panel">
              <div class="head"><h2>Explore Our Loan Services</h2><a routerLink="/account/apply">View All Services →</a></div>
              <div class="svcs m-hscroll" appHScroll style="--m-bleed: 18px; --m-card-w: 48%">
                @for (p of products; track p.slug) {
                  <a class="svc" routerLink="/account/apply" [queryParams]="{ product: p.slug }">
                    @if (icon(p.slug); as src) { <img [src]="src" alt="" width="28" height="28" /> } @else { <span class="material-icons">{{ p.icon }}</span> }
                    <span><b>{{ p.name }}</b><small>{{ blurb[p.slug] }}</small></span>
                  </a>
                }
              </div>
            </section>
          </div>

          <aside class="side">
            <section class="panel">
              <div class="head"><h2>Your Profile Status</h2><b>{{ d.profile_completion.percent }}%</b></div>
              <div class="bar" role="progressbar" [attr.aria-valuenow]="d.profile_completion.percent" aria-valuemin="0" aria-valuemax="100"><i [style.width.%]="d.profile_completion.percent"></i></div>
              @for (s of d.profile_completion.steps; track s.key) {
                <div class="step"><span class="material-icons" [class.done]="s.done">{{ s.done ? 'check_circle' : 'check_circle_outline' }}</span>{{ s.label }}<em [class.done]="s.done">{{ s.done ? 'Completed' : 'Pending' }}</em></div>
              }
              <a class="fw-btn fw-btn--primary fw-btn--block" routerLink="/account/profile">Complete Your Profile <span class="material-icons">arrow_forward</span></a>
            </section>

            <section class="offer">
              <span class="material-icons">redeem</span>
              <div>
                <h3>Special Offers for You</h3>
                <p>You may be eligible for a lower interest rate on your next loan!</p>
                <a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/apply">View Offers <span class="material-icons">arrow_forward</span></a>
              </div>
            </section>

            <section class="panel">
              <div class="head"><h2>Quick Support</h2></div>
              <a class="sup" [href]="site.phoneHref"><span class="sup__i sup__i--call material-icons">call</span><span><b>Call Us</b><strong>{{ site.phone }}</strong><small>{{ site.hours }}</small></span><span class="material-icons">chevron_right</span></a>
              <a class="sup" [href]="site.whatsappHref" target="_blank" rel="noopener"><span class="sup__i sup__i--wa material-icons">chat</span><span><b>WhatsApp Us</b><small>Chat with our experts</small><small>Get quick answers</small></span><span class="material-icons">chevron_right</span></a>
            </section>
          </aside>
        </div>

        <section class="band">
          <div><h2>Your Goals. Our Support.</h2><p>Get expert guidance, better offers and a smoother loan process with Finoocean.</p></div>
          <a class="fw-btn fw-btn--light" routerLink="/account/help">Talk to an Expert <span class="material-icons">arrow_forward</span></a>
        </section>
      }
    }
  `,
  styles: [
    `
      .hero { display: flex; justify-content: space-between; gap: 20px; background: linear-gradient(110deg, #061a3d 0%, #0a2f66 60%, #0d4a9a 100%); color: #fff; border-radius: 16px 16px 0 0; padding: 26px 28px 20px; }
      .hero h1 { margin: 0 0 6px; font-size: clamp(1.6rem, 3vw, 2.2rem); } .hero p { margin: 0 0 18px; color: #dbe8ff; }
      .hero__script { font-family: Lora, serif; font-style: italic; font-size: 1.5rem; line-height: 1.2; color: #e6f0ff; text-align: right; align-self: center; margin: 0; }
      .hero__copy { min-width: 0; flex: 1; }
      /* Four equal tiles: one row on desktop, a tidy 2 x 2 grid on tablets and phones. */
      .feats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; list-style: none; margin: 0; padding: 0; max-width: 820px; }
      .feats li { display: flex; min-width: 0; }
      .feats a { flex: 1; display: grid; justify-items: center; align-content: center; text-align: center; gap: 4px; padding: 16px 10px; color: inherit; text-decoration: none; border-radius: 14px; background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.14); transition: background 0.2s, transform 0.2s, border-color 0.2s, box-shadow 0.2s; }
      .feats a:hover, .feats a:focus-visible { background: rgba(255, 255, 255, 0.15); border-color: rgba(77, 196, 255, 0.7); transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0, 0, 0, 0.25); outline: none; }
      .feats .material-icons { font-size: 28px; color: #4dc4ff; width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; background: rgba(77, 196, 255, 0.14); margin-bottom: 4px; }
      .feats b { font-size: 0.88rem; line-height: 1.25; } .feats small { color: #b9d0f5; font-size: 0.74rem; line-height: 1.3; }
      .quick { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; background: #fff; border: 1px solid var(--fw-line); border-top: 0; border-radius: 0 0 16px 16px; padding: 14px; margin-bottom: 18px; }
      .quick a { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background: var(--fw-blue-soft); color: var(--fw-ink); text-decoration: none; font-weight: 600; font-size: 0.9rem; min-width: 0; transition: transform 0.15s, box-shadow 0.15s; }
      .quick a:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(16, 33, 58, 0.1); }
      .q { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-size: 22px; flex: none; }
      .q--blue { background: #1c6df0; } .q--green { background: #16a34a; } .q--purple { background: #7c3aed; } .q--orange { background: #f97316; }
      .todo { border-color: #f3d99a; background: #fffaf0; margin-bottom: 18px; }
      .todo .fw-h3 { display: flex; align-items: center; gap: 6px; color: #7a4b00; }
      .todo__row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid #f3e2b8; text-decoration: none; color: inherit; }
      .cols { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr); gap: 18px; align-items: start; }
      .main, .side { display: grid; gap: 18px; min-width: 0; }
      .panel { background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; padding: 18px; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.04); }
      .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; } .head h2 { margin: 0; font-size: 1.05rem; }
      .head a { color: var(--fw-blue); text-decoration: none; font-size: 0.82rem; font-weight: 600; }
      .app { display: grid; grid-template-columns: 44px minmax(170px, 1.5fr) 1fr 1fr 1fr auto; gap: 14px; align-items: center; padding: 14px 0; border-top: 1px solid var(--fw-line); }
      .app:first-of-type { border-top: 0; }
      .app__top, .app__meta { display: contents; } .app__c { min-width: 0; }
      .app__ic { width: 44px; height: 44px; border-radius: 12px; background: var(--fw-blue-soft); color: var(--fw-blue); display: grid; place-items: center; font-size: 24px; }
      .app__c { display: grid; line-height: 1.35; font-size: 0.8rem; } .app__c strong { font-size: 0.92rem; } .app__c small { color: var(--fw-muted); font-size: 0.72rem; } .app__c b { font-size: 0.84rem; white-space: nowrap; }
      .app__c .fw-pill { justify-self: start; }
      .svcs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
      .svc { display: flex; gap: 10px; align-items: center; padding: 12px; border: 1px solid var(--fw-line); border-radius: 12px; text-decoration: none; color: var(--fw-ink); background: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
      .svc:hover { border-color: var(--fw-blue); box-shadow: 0 6px 16px rgba(28, 109, 240, 0.12); }
      .svc img { width: 28px; height: 28px; object-fit: contain; flex: none; } .svc .material-icons { color: var(--fw-blue); font-size: 26px; flex: none; }
      .svc span:last-child { display: grid; line-height: 1.25; min-width: 0; } .svc b { font-size: 0.82rem; } .svc small { color: var(--fw-muted); font-size: 0.7rem; }
      .bar { height: 8px; background: #e6ecf6; border-radius: 99px; overflow: hidden; margin-bottom: 14px; } .bar i { display: block; height: 100%; background: #16a34a; }
      .step { display: flex; gap: 8px; align-items: center; padding: 6px 0; font-size: 0.86rem; } .step .material-icons { color: #b3bfd1; font-size: 20px; } .step .done { color: #16a34a; }
      .step em { margin-left: auto; font-style: normal; font-size: 0.76rem; color: #d97706; } .step em.done { color: #16a34a; }
      .panel .fw-btn--block { margin-top: 12px; }
      .offer { display: flex; gap: 14px; align-items: flex-start; background: #fdf1f4; border: 1px solid #f6d6de; border-radius: 14px; padding: 18px; }
      .offer > .material-icons { font-size: 38px; color: #e11d48; } .offer h3 { margin: 0 0 4px; font-size: 1rem; } .offer p { margin: 0 0 10px; font-size: 0.82rem; color: var(--fw-muted); }
      .sup { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid var(--fw-line); text-decoration: none; color: var(--fw-ink); } .sup:first-of-type { border-top: 0; }
      .sup > span:nth-child(2) { display: grid; line-height: 1.3; flex: 1; } .sup b { font-size: 0.86rem; } .sup strong { font-size: 0.92rem; } .sup small { color: var(--fw-muted); font-size: 0.74rem; }
      .sup__i { width: 40px; height: 40px; border-radius: 50%; color: #fff; display: grid; place-items: center; flex: none; } .sup__i--call { background: var(--fw-blue); } .sup__i--wa { background: #22c55e; }
      .band { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 18px; background: linear-gradient(90deg, #061a3d, #0d3a75); color: #fff; border-radius: 14px; padding: 22px 26px; }
      .band h2 { margin: 0 0 4px; font-size: 1.4rem; } .band p { margin: 0; color: #cfe0ff; font-size: 0.9rem; }
      .empty { text-align: center; padding: 18px; display: grid; gap: 8px; justify-items: center; color: var(--fw-muted); } .empty .material-icons { font-size: 40px; color: var(--fw-blue); }
      .retry { margin-left: 8px; background: none; border: 0; text-decoration: underline; cursor: pointer; color: inherit; }
      @media (max-width: 1180px) { .cols { grid-template-columns: 1fr; } .svcs { grid-template-columns: repeat(3, 1fr); } .app { grid-template-columns: 44px 1fr 1fr; } .app .fw-btn { grid-column: 1 / -1; justify-self: start; } }
      /* Phones and tablets: each application is a self-contained card (title row, tinted details box, full-width button). */
      @media (max-width: 1180px) {
        .app { display: flex; flex-direction: column; align-items: stretch; gap: 12px; padding: 14px; margin-top: 12px; border: 1px solid var(--fw-line); border-radius: 14px; background: #fff; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.05); }
        .app:first-of-type { border-top: 1px solid var(--fw-line); margin-top: 0; }
        .app__top { display: flex; align-items: center; gap: 12px; }
        .app__top .app__c { flex: 1; }
        .app__meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; padding: 12px; border-radius: 10px; background: var(--fw-blue-soft); }
        .app__status { grid-column: 1 / -1; order: -1; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .app .fw-btn { width: 100%; justify-content: center; justify-self: stretch; box-sizing: border-box; }
      }
      @media (max-width: 800px) { .hero__script { display: none; } .hero { padding: 20px 16px 16px; } .feats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .feats a { padding: 14px 8px; } .feats b { font-size: 0.82rem; } .quick { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .quick a { padding: 12px 10px; gap: 10px; font-size: 0.84rem; } .svcs { grid-template-columns: repeat(2, 1fr); } }
    `,
  ],
  styleUrl: '../../website/website-ui.scss',
})
export class AccountDashboardComponent {
  private readonly portal = inject(CustomerPortalService);

  protected readonly site = WEBSITE;
  protected readonly products = PRODUCT_PAGES.slice(0, 8);
  protected readonly blurb: Record<string, string> = {
    'personal-loan': 'Up to ₹50 Lakh',
    'business-loan': 'Grow your business',
    'home-loan': 'Build your dream home',
    'loan-against-property': 'Unlock property value',
    'car-loan': 'Drive your dreams',
    'education-loan': 'Invest in your future',
    'stand-up-india': 'Government backed',
    'project-funding': 'Fund your project',
  };
  protected readonly data = signal<CustomerDashboard | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.portal.dashboard().subscribe({
      next: (d) => this.data.set(d),
      error: (e: { message?: string }) => this.error.set(e?.message ?? 'We could not load your dashboard.'),
    });
  }

  protected first(name: string): string {
    return name.split(' ')[0];
  }

  protected fmt(v: number): string {
    return formatInr(v);
  }

  protected icon(slug: string): string | null {
    return loanIcon(slug);
  }

  protected iconFor(type: string): string {
    return loanTypeIcon(type);
  }
}
