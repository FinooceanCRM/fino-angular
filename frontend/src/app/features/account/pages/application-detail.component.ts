import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';

import { CustomerApplication, CustomerRequiredDocument } from '@core/models/customer-portal.model';
import { CustomerPortalService } from '@core/services/customer-portal.service';
import { formatInr } from '@core/utils/emi';

import { loanSquare } from '../../website/loan-images';
import { WEBSITE } from '../../website/website.config';
import { loanTypeSlug } from '../loan-type-icon';
import { BreadcrumbComponent } from '@shared/components/breadcrumb.component';
import { BackButtonComponent } from '@shared/components/back-button.component';
import { acceptFor, typeError } from '../document-rules';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];
const STAGES = ['Application Submitted', 'Document Verification', 'Lender Review', 'Decision', 'Completed'];

type Tab = 'overview' | 'documents' | 'bank' | 'timeline' | 'communication' | 'offers' | 'help';

/** Application Details — layout follows images/12_Dashboard/02_My_Applications/02_Application_Details.png. `id` binds from the route. */
@Component({
  selector: 'app-account-application-detail',
  standalone: true,
  imports: [BackButtonComponent, BreadcrumbComponent, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb variant="portal" />

    @if (error()) {
      <div class="fw-alert fw-alert--error" role="alert">{{ error() }} <a routerLink="/account/applications">Back to My Applications</a></div>
    } @else if (!app()) {
      <div class="fw-skeleton" style="height:90px;margin-bottom:14px"></div>
      <div class="fw-skeleton" style="height:260px"></div>
    } @else {
      @if (app(); as a) {
        <header class="head">
          <div>
            <h1>Application Details</h1>
            <p>Track your loan application status, check document verification, view updates and more.</p>
          </div>
          <span class="fw-pill" [class]="'fw-pill fw-pill--' + a.status.tone">{{ a.status.label }}</span>
          <div class="meta">
            <div><small>Application ID</small><b>{{ a.reference }}</b></div>
            <div><small>Applied On</small><b>{{ a.applied_on | date: 'd MMM y, h:mm a' }}</b></div>
            <div><small>Loan Type</small><b>{{ a.loan_type_label }}</b></div>
          </div>
          <app-back-button class="back" />
        </header>

        <div class="tabs" role="tablist">
          @for (t of tabs; track t.key) {
            <button type="button" role="tab" [attr.aria-selected]="tab() === t.key" [class.on]="tab() === t.key" (click)="tab.set(t.key)"><span class="material-icons">{{ t.icon }}</span>{{ t.label }}</button>
          }
        </div>

        @if (uploadError()) { <div class="fw-alert fw-alert--error" role="alert">{{ uploadError() }}</div> }

        @switch (tab()) {
          @case ('overview') {
            <div class="row1">
              <section class="panel">
                <h2>Application Progress</h2>
                <ol class="steps" aria-label="Progress">
                  @for (s of stages; track s; let i = $index) {
                    <li [class]="'st st--' + stageState(a, i)">
                      <span class="dot"><span class="material-icons">{{ stageState(a, i) === 'done' ? 'check' : stageState(a, i) === 'now' ? 'hourglass_top' : 'schedule' }}</span></span>
                      <b>{{ s }}</b>
                      @if (i === 0) { <small>{{ a.applied_on | date: 'd MMM y, h:mm a' }}</small> }
                      <em [class]="'em em--' + stageState(a, i)">{{ stageState(a, i) === 'done' ? 'Completed' : stageState(a, i) === 'now' ? 'In Progress' : 'Pending' }}</em>
                    </li>
                  }
                </ol>
              </section>
              <section class="hero" [class.action]="a.status.action_required">
                @if (art(); as src) { <img [src]="src" alt="" width="84" height="84" /> }
                <div><h3>{{ a.loan_type_label }}</h3><small>{{ a.status.label }}</small></div>
                <p>{{ a.status.message }}</p>
              </section>
            </div>

            <div class="row2">
              <section class="panel">
                <h2>Application Information</h2>
                <dl>
                  <dt>Loan Type</dt><dd>{{ a.loan_type_label }}</dd>
                  <dt>Loan Amount</dt><dd>{{ fmt(a.loan_amount) }}</dd>
                  @if (a.tenure_months) { <dt>Tenure</dt><dd>{{ tenure(a.tenure_months) }}</dd> }
                  @if (a.details?.employment_type) { <dt>Employment Type</dt><dd>{{ label(a.details?.employment_type) }}</dd> }
                  @if (a.details?.monthly_income) { <dt>Monthly Income</dt><dd>{{ fmt(a.details?.monthly_income ?? 0) }}</dd> }
                  @if (a.city) { <dt>City</dt><dd>{{ a.city }}</dd> }
                </dl>
              </section>

              <section class="panel">
                <div class="ph"><h2>Document Status</h2><button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="tab.set('documents')">View All</button></div>
                @for (d of requiredDocs(); track d.type) {
                  <div class="drow"><span class="material-icons dic">description</span>{{ d.label }}<em [class]="'em em--' + d.status">{{ stateLabel(d) }}</em></div>
                }
              </section>

              <section class="panel team">
                <h2>Your Finoocean Team</h2>
                <p>A Finoocean advisor is handling your application and will contact you with updates.</p>
                <a class="line" [href]="site.phoneHref"><span class="material-icons">phone</span>{{ site.phone }}</a>
                <a class="line" [href]="'mailto:' + site.email"><span class="material-icons">mail_outline</span>{{ site.email }}</a>
                <small>{{ site.hours }}</small>
              </section>
            </div>

            <div class="row3">
              <section class="panel">
                <div class="ph"><h2>Latest Updates</h2><button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="tab.set('timeline')">View All</button></div>
                @for (t of latest(); track $index) {
                  <div class="trow"><span class="when">{{ t.at | date: 'd MMM y' }}<small>{{ t.at | date: 'h:mm a' }}</small></span><span class="tdot"></span><div><b>{{ t.label }}</b><small>{{ t.message }}</small></div></div>
                } @empty { <p class="muted">No updates yet. We’ll post here as your application moves forward.</p> }
              </section>

              <section class="panel">
                <h2>What’s Next?</h2>
                <ul class="next">
                  <li><span class="material-icons">fact_check</span><div><b>Document verification (1–2 working days)</b><small>We verify the documents you submit.</small></div></li>
                  <li><span class="material-icons">account_balance</span><div><b>Lender review (2–5 working days)</b><small>Your application is reviewed with our lending partners.</small></div></li>
                  <li><span class="material-icons">verified</span><div><b>Decision &amp; offer</b><small>Once decided, your advisor shares the details with you.</small></div></li>
                  <li><span class="material-icons">payments</span><div><b>Disbursal</b><small>After final verification, the amount is credited to your bank account.</small></div></li>
                </ul>
                <div class="assist"><span class="material-icons">lightbulb</span><div><b>Need Assistance?</b><small>Our loan experts are here to help you at every step.</small></div><a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/help">Talk to an Expert</a></div>
              </section>
            </div>
          }

          @case ('documents') {
            <section class="panel">
              <h2>Documents</h2>
              <p class="muted">PDF, JPG or PNG, up to 5 MB each. Files are stored privately and only you and our team can open them.</p>
              @for (d of a.documents ?? []; track d.type) {
                <div class="doc">
                  <div class="doc__main">
                    <strong>{{ d.label }}@if (d.required === false) { <em class="opt">optional</em> }</strong>
                    @if (d.file_name) { <span class="muted">{{ d.file_name }}</span> }
                    @if (d.remarks) { <span class="rej">Reason: {{ d.remarks }}</span> }
                  </div>
                  <span class="fw-pill" [class]="'fw-pill fw-pill--' + pill(d)">{{ stateLabel(d) }}</span>
                  @if (d.status !== 'verified') {
                    <label class="fw-btn fw-btn--ghost fw-btn--sm up" [class.is-busy]="busy() === d.type">
                      {{ busy() === d.type ? 'Uploading…' : d.status === 'not_uploaded' ? 'Upload' : 'Replace' }}
                      <input type="file" [attr.accept]="accept(d.type)" [disabled]="busy() !== null" (change)="upload(a, d, $event)" />
                    </label>
                  }
                  @if (d.document_id) { <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="download(d)">View</button> }
                </div>
              }
            </section>
          }

          @case ('bank') {
            <section class="panel empty"><span class="material-icons">account_balance</span><h2>Bank details</h2><p>Bank details for disbursal are collected by your advisor once your application is approved. Nothing is needed from you right now.</p></section>
          }

          @case ('timeline') {
            <section class="panel">
              <h2>Timeline</h2>
              @for (t of reversed(a.timeline ?? []); track $index) {
                <div class="trow"><span class="when">{{ t.at | date: 'd MMM y' }}<small>{{ t.at | date: 'h:mm a' }}</small></span><span class="tdot"></span><div><b>{{ t.label }}</b><small>{{ t.message }}</small></div></div>
              } @empty { <p class="muted">No updates yet.</p> }
            </section>
          }

          @case ('communication') {
            <section class="panel">
              <h2>Communication</h2>
              <p class="muted">Reach your advisor about this application. Please quote <b>{{ a.reference }}</b>.</p>
              <div class="comm">
                <a [href]="site.phoneHref"><span class="material-icons">phone</span><b>Call us</b><small>{{ site.phone }}</small></a>
                <a [href]="site.whatsappHref" target="_blank" rel="noopener"><span class="material-icons">chat</span><b>WhatsApp</b><small>Chat with our experts</small></a>
                <a [href]="'mailto:' + site.email + '?subject=' + a.reference"><span class="material-icons">mail_outline</span><b>Email</b><small>{{ site.email }}</small></a>
              </div>
            </section>
          }

          @case ('offers') {
            <section class="panel empty"><span class="material-icons">local_offer</span><h2>Offers for you</h2><p>See personalised loan offers based on your profile.</p><a class="fw-btn fw-btn--primary" routerLink="/account/offers">View Offers</a></section>
          }

          @case ('help') {
            <section class="panel">
              <h2>Help</h2>
              <div class="comm">
                <a routerLink="/account/help"><span class="material-icons">support_agent</span><b>Support</b><small>Raise a question to our team</small></a>
                <a routerLink="/account/help"><span class="material-icons">help_outline</span><b>FAQs</b><small>Answers to common questions</small></a>
                <a routerLink="/account/documents"><span class="material-icons">folder_open</span><b>My Documents</b><small>Upload and track documents</small></a>
              </div>
            </section>
          }
        }
      }
    }
  `,
  styles: [
    `
      .crumbs { display: flex; gap: 8px; font-size: 0.82rem; color: var(--fw-muted); margin-bottom: 8px; flex-wrap: wrap; } .crumbs a { color: inherit; text-decoration: none; }
      .head { display: grid; grid-template-columns: 1fr auto auto; gap: 14px 22px; align-items: center; margin-bottom: 16px; }
      h1 { margin: 0 0 4px; font-size: clamp(1.7rem, 3vw, 2.2rem); color: var(--fw-navy); } .head p { margin: 0; color: var(--fw-muted); font-size: 0.9rem; }
      .meta { display: flex; gap: 22px; grid-column: 1 / 3; } .meta div { display: grid; line-height: 1.3; } .meta small { color: var(--fw-muted); font-size: 0.72rem; } .meta b { font-size: 0.86rem; }
      .back { grid-column: 3; grid-row: 1 / 3; align-self: start; white-space: nowrap; }
      .tabs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
      .tabs button { display: inline-flex; gap: 8px; align-items: center; border: 1px solid var(--fw-line); background: #fff; border-radius: 10px; padding: 10px 16px; font: 500 0.84rem Poppins, sans-serif; cursor: pointer; color: var(--fw-ink); }
      .tabs button.on { background: var(--fw-blue); color: #fff; border-color: var(--fw-blue); } .tabs .material-icons { font-size: 18px; }
      .panel { background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; padding: 18px; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.04); min-width: 0; }
      .panel h2 { margin: 0 0 12px; font-size: 1.05rem; } .ph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; } .ph h2 { margin: 0; }
      .muted { color: var(--fw-muted); font-size: 0.84rem; margin: 0 0 8px; }
      .row1 { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(260px, 1fr); gap: 16px; margin-bottom: 16px; }
      .row2 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
      .row3 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      .steps { list-style: none; margin: 8px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); }
      .st { position: relative; display: grid; justify-items: center; text-align: center; gap: 2px; padding: 0 4px; }
      .st:not(:last-child)::after { content: ''; position: absolute; top: 20px; left: calc(50% + 22px); right: calc(-50% + 22px); height: 3px; background: #d7dfec; } .st--done:not(:last-child)::after { background: #16a34a; }
      .dot { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: #cdd6e4; color: #fff; position: relative; z-index: 1; } .st--done .dot { background: #16a34a; } .st--now .dot { background: var(--fw-blue); box-shadow: 0 0 0 5px rgba(28, 109, 240, 0.18); }
      .st b { font-size: 0.78rem; margin-top: 8px; line-height: 1.25; } .st small { font-size: 0.68rem; color: var(--fw-muted); }
      .em { font-style: normal; font-size: 0.72rem; border-radius: 6px; padding: 2px 8px; margin-top: 4px; background: #eef2f8; color: var(--fw-muted); } .em--done, .em--verified { background: #dcfce7; color: #15803d; } .em--now, .em--pending { background: #dbeafe; color: #1d4ed8; } .em--rejected { background: #fee2e2; color: #b91c1c; }
      .hero { background: linear-gradient(135deg, #eaf2ff, #dbe8fb); border-radius: 14px; padding: 18px; display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; align-content: center; } .hero.action { background: linear-gradient(135deg, #fff7e0, #fdecc0); }
      .hero img { grid-row: 1; width: 84px; height: 84px; object-fit: cover; border-radius: 12px; } .hero div { align-self: center; } .hero h3 { margin: 0; font-size: 1.3rem; color: var(--fw-navy); } .hero small { color: var(--fw-muted); } .hero p { grid-column: 1 / -1; margin: 6px 0 0; font-size: 0.84rem; color: var(--fw-ink); }
      dl { display: grid; grid-template-columns: 120px 1fr; gap: 9px 10px; margin: 0; font-size: 0.86rem; } dt { color: var(--fw-muted); } dd { margin: 0; font-weight: 500; }
      .drow { display: flex; align-items: center; gap: 8px; font-size: 0.86rem; padding: 7px 0; border-top: 1px solid var(--fw-line); } .drow:first-of-type { border-top: 0; } .dic { color: var(--fw-blue); font-size: 22px; } .drow .em { margin: 0 0 0 auto; }
      .team p { font-size: 0.84rem; color: var(--fw-muted); margin: 0 0 8px; } .line { display: flex; gap: 8px; align-items: center; text-decoration: none; color: var(--fw-ink); font-size: 0.86rem; padding: 4px 0; overflow-wrap: anywhere; } .line .material-icons { color: var(--fw-blue); font-size: 20px; } .team small { color: var(--fw-muted); }
      .trow { display: grid; grid-template-columns: 82px 14px 1fr; gap: 10px; padding: 10px 0; font-size: 0.84rem; position: relative; } .when { display: grid; color: var(--fw-muted); font-size: 0.78rem; } .when small { font-size: 0.72rem; }
      .tdot { width: 12px; height: 12px; border-radius: 50%; background: var(--fw-blue); margin-top: 4px; } .trow div { display: grid; line-height: 1.35; } .trow div small { color: var(--fw-muted); font-size: 0.78rem; }
      .next { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 10px; } .next li { display: flex; gap: 12px; align-items: flex-start; } .next .material-icons { color: var(--fw-blue); background: var(--fw-blue-soft); border-radius: 50%; padding: 7px; font-size: 20px; } .next div { display: grid; line-height: 1.3; } .next b { font-size: 0.84rem; } .next small { color: var(--fw-muted); font-size: 0.76rem; }
      .assist { display: flex; gap: 12px; align-items: center; background: #effaf2; border-radius: 12px; padding: 12px 14px; flex-wrap: wrap; } .assist > .material-icons { color: #16a34a; } .assist div { display: grid; flex: 1; min-width: 160px; } .assist small { color: var(--fw-muted); font-size: 0.74rem; }
      .doc { display: flex; gap: 10px; align-items: center; padding: 12px 0; border-top: 1px solid var(--fw-line); flex-wrap: wrap; } .doc__main { flex: 1; display: grid; min-width: 150px; } .rej { color: var(--fw-red); font-size: 0.8rem; } .opt { font-style: normal; font-size: 0.68rem; color: var(--fw-muted); background: #eef2f8; border-radius: 6px; padding: 1px 6px; margin-left: 6px; }
      .up { position: relative; overflow: hidden; } .up input { position: absolute; inset: 0; opacity: 0; cursor: pointer; } .up.is-busy { opacity: 0.6; }
      .empty { text-align: center; display: grid; justify-items: center; gap: 8px; padding: 36px 20px; } .empty .material-icons { font-size: 48px; color: var(--fw-blue); } .empty h2 { margin: 0; } .empty p { margin: 0; color: var(--fw-muted); max-width: 460px; }
      .comm { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 10px; } .comm a { display: grid; justify-items: center; gap: 4px; padding: 20px 10px; border: 1px solid var(--fw-line); border-radius: 12px; text-decoration: none; color: var(--fw-ink); text-align: center; overflow-wrap: anywhere; } .comm a:hover { border-color: var(--fw-blue); } .comm .material-icons { font-size: 30px; color: var(--fw-blue); } .comm small { color: var(--fw-muted); font-size: 0.76rem; }
      .fw-btn { white-space: nowrap; }
      @media (max-width: 1180px) { .row1, .row3 { grid-template-columns: minmax(0, 1fr); } .row2 { grid-template-columns: minmax(0, 1fr); } .head { grid-template-columns: 1fr auto; } .back { grid-column: 1 / -1; grid-row: auto; justify-self: start; } .meta { grid-column: 1 / -1; flex-wrap: wrap; } }
      @media (max-width: 700px) { .comm { grid-template-columns: 1fr; }
        /* Application progress → compact horizontal tracker; labels alternate above/below the line (zig-zag). */
        .head p { display: none; }
        .steps { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0; margin-top: 10px; }
        .st { grid-template-rows: 34px 34px 34px; grid-template-columns: minmax(0, 1fr); justify-items: center; align-items: center; gap: 0; padding: 0; border: 0; border-radius: 0; background: none; box-shadow: none; }
        .st small, .st .em { display: none; }
        .dot { grid-row: 2; width: 34px; height: 34px; }
        .dot .material-icons { font-size: 18px; }
        .st:not(:last-child)::after { display: block; content: ''; position: absolute; top: 50%; left: calc(50% + 17px); right: calc(-50% + 17px); width: auto; height: 3px; margin-top: -1.5px; bottom: auto; border-radius: 2px; background: #d7dfec; z-index: 0; }
        .st--done:not(:last-child)::after { background: #16a34a; }
        .st--now .dot { animation: stpulse 1.8s ease-out infinite; box-shadow: none; }
        .st b { margin: 0; width: max-content; max-width: 112px; font-size: 0.68rem; line-height: 1.2; text-align: center; }
        .st:nth-child(odd) b { grid-row: 1; align-self: end; padding-bottom: 3px; }
        .st:nth-child(even) b { grid-row: 3; align-self: start; padding-top: 3px; }
        .st:first-child b { justify-self: start; text-align: left; }
        .st:last-child b { justify-self: end; text-align: right; }
        .st--now b { color: var(--fw-blue); }
        @keyframes stpulse { 0% { box-shadow: 0 0 0 0 rgba(28, 109, 240, 0.4); } 100% { box-shadow: 0 0 0 10px rgba(28, 109, 240, 0); } }
      }
    `,
  ],
  styleUrl: '../../website/website-ui.scss',
})
export class AccountApplicationDetailComponent {
  private readonly portal = inject(CustomerPortalService);

  readonly id = input.required<string>();

  protected readonly site = WEBSITE;
  protected readonly stages = STAGES;
  protected readonly tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'home' },
    { key: 'documents', label: 'Documents', icon: 'description' },
    { key: 'bank', label: 'Bank Details', icon: 'account_balance' },
    { key: 'timeline', label: 'Timeline', icon: 'timeline' },
    { key: 'communication', label: 'Communication', icon: 'forum' },
    { key: 'offers', label: 'Offers', icon: 'local_offer' },
    { key: 'help', label: 'Help', icon: 'help' },
  ];

  protected readonly tab = signal<Tab>('overview');
  protected readonly app = signal<CustomerApplication | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly busy = signal<string | null>(null);

  protected readonly requiredDocs = computed(() => (this.app()?.documents ?? []).filter((d) => d.required !== false));
  protected readonly latest = computed(() => [...(this.app()?.timeline ?? [])].reverse().slice(0, 4));
  protected readonly art = computed(() => {
    const a = this.app();
    return a ? loanSquare(loanTypeSlug(a.loan_type)) : null;
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        tap(() => { this.app.set(null); this.error.set(null); this.tab.set('overview'); }),
        switchMap((id) => this.portal.application(Number(id))),
      )
      .subscribe({
        next: (a) => this.app.set(a),
        error: (e: { status?: number; message?: string }) =>
          this.error.set(e?.status === 404 ? 'We couldn’t find that application.' : e?.message ?? 'We could not load this application.'),
      });
  }

  protected fmt(v: number): string {
    return formatInr(v);
  }

  protected reversed<T>(list: T[]): T[] {
    return [...list].reverse();
  }

  protected tenure(months: number): string {
    if (months % 12 === 0) return `${months / 12} Year${months === 12 ? '' : 's'} (${months} Months)`;
    return months < 12 ? `${months} Months` : `${(months / 12).toFixed(1)} Years (${months} Months)`;
  }

  protected label(v?: string): string {
    return (v ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected stageState(a: CustomerApplication, i: number): 'done' | 'now' | 'todo' {
    const step = a.status.step;
    if (step >= STAGES.length - 1) return 'done';
    return i < step ? 'done' : i === step ? 'now' : 'todo';
  }

  protected stateLabel(d: CustomerRequiredDocument): string {
    return { not_uploaded: 'Pending', pending: 'Under Review', verified: 'Verified', rejected: 'Rejected' }[d.status];
  }

  protected pill(d: CustomerRequiredDocument): string {
    return { not_uploaded: 'neutral', pending: 'info', verified: 'success', rejected: 'danger' }[d.status];
  }

  protected download(d: CustomerRequiredDocument): void {
    if (d.document_id) this.portal.downloadDocument({ id: d.document_id, file_name: d.file_name });
  }

  protected readonly accept = acceptFor;

  protected upload(app: CustomerApplication, doc: CustomerRequiredDocument, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    // Client-side checks are a convenience only; the server re-validates type, size and content.
    const blocked = typeError(doc.type, file);
    if (blocked) {
      this.uploadError.set(blocked);
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      this.uploadError.set('Please choose a PDF, JPG or PNG file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.uploadError.set('That file is larger than 5 MB.');
      return;
    }

    this.uploadError.set(null);
    this.busy.set(doc.type);
    this.portal.uploadDocument(app.id, doc.type, file).subscribe({
      next: () => {
        this.busy.set(null);
        this.portal.application(app.id).subscribe((a) => this.app.set(a));
      },
      error: (e: { message?: string; errors?: Record<string, string[]> }) => {
        this.busy.set(null);
        this.uploadError.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'Upload failed. Please try again.');
      },
    });
  }
}
