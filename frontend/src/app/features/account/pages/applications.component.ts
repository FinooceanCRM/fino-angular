import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CustomerApplication } from '@core/models/customer-portal.model';
import { CustomerPortalService } from '@core/services/customer-portal.service';
import { formatInr } from '@core/utils/emi';

import { WEBSITE } from '../../website/website.config';
import { loanTypeIcon, loanTypeTone } from '../loan-type-icon';
import { BreadcrumbComponent } from '@shared/components/breadcrumb.component';

/** Stages shown on every card; the API's `status.step` (0–4) says how far the application has got. */
const STAGES = ['Application Submitted', 'Document Verification', 'Lender Review', 'Decision', 'Completed'];

type Filter = 'all' | 'progress' | 'review' | 'approved' | 'rejected';

/** Which filter tab an application belongs to, from its customer-facing status. */
function group(a: CustomerApplication): Filter {
  const { key, tone } = a.status;
  if (key === 'under_review') return 'review';
  if (key === 'decision') return tone === 'success' ? 'approved' : 'rejected';
  if (key === 'completed') return tone === 'success' ? 'approved' : 'all';
  return 'progress';
}

/** My Applications — layout follows images/12_Dashboard/02_My_Applications/01_Applications_List.png. */
@Component({
  selector: 'app-account-applications',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb variant="portal" [withBack]="true" />
    <header class="head">
      <div><h1>My Applications</h1><p>Track, manage and complete your loan applications in one place.</p></div>
      <p class="script" aria-hidden="true">Your Financial Journey<br />Our Support Always</p>
      <a class="fw-btn fw-btn--primary" routerLink="/account/apply">Apply for New Loan <span class="material-icons">arrow_forward</span></a>
    </header>

    @if (error()) {
      <div class="fw-alert fw-alert--error" role="alert">{{ error() }} <button class="retry" type="button" (click)="load()">Retry</button></div>
    } @else if (loading()) {
      <div class="fw-skeleton" style="height:46px;margin-bottom:14px"></div>
      @for (i of [1, 2, 3]; track i) { <div class="fw-skeleton" style="height:150px;margin-bottom:12px"></div> }
    } @else if (items().length === 0) {
      <section class="panel empty">
        <span class="material-icons">description</span>
        <h2>No applications yet</h2>
        <p>When you apply for a loan it will appear here with live status updates.</p>
        <a class="fw-btn fw-btn--primary" routerLink="/account/apply">Apply for New Loan</a>
      </section>
    } @else {
      <div class="tabs" role="tablist">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" [attr.aria-selected]="filter() === t.key" [class.on]="filter() === t.key" (click)="setFilter(t.key)">{{ t.label }} ({{ count(t.key) }})</button>
        }
      </div>

      <div class="cols">
        <div class="list">
          @for (a of shown(); track a.id) {
            <article class="app" [class.sel]="a.id === selectedId()" (click)="select(a)" (keydown.enter)="select(a)" tabindex="0" [attr.aria-current]="a.id === selectedId() ? 'true' : null">
              <div class="app__top">
                <div class="app__id">
                  <span class="ic" [class]="'ic ic--' + tone(a.loan_type)"><span class="material-icons">{{ icon(a.loan_type) }}</span></span>
                  <div class="app__name"><b>{{ a.loan_type_label }}</b><small>Application ID</small><span>{{ a.reference }}</span></div>
                </div>
                <div class="app__meta">
                  <div class="cell"><small>Applied On</small><b>{{ a.applied_on | date: 'd MMM y' }}</b></div>
                  <div class="cell"><small>Loan Amount</small><b>{{ fmt(a.loan_amount) }}</b></div>
                  <div class="cell cell--status"><small>Status</small><span class="fw-pill" [class]="'fw-pill fw-pill--' + a.status.tone">{{ a.status.label }}</span></div>
                </div>
                <a class="fw-btn fw-btn--ghost fw-btn--sm" [routerLink]="['/account/applications', a.id]" (click)="$event.stopPropagation()">View Details <span class="material-icons">arrow_forward</span></a>
              </div>
              <ol class="steps" aria-label="Progress">
                @for (s of stages; track s; let i = $index) {
                  <li [class]="'st st--' + stageState(a, i)">
                    <span class="dot"><span class="material-icons">{{ stageState(a, i) === 'done' ? 'check' : stageState(a, i) === 'now' ? 'circle' : 'schedule' }}</span></span>
                    <b>{{ s }}</b>
                    <small>{{ stageNote(a, i) }}</small>
                  </li>
                }
              </ol>
            </article>
          } @empty {
            <div class="panel none">No {{ filterLabel() }} applications. <button type="button" class="link" (click)="setFilter('all')">Show all applications</button></div>
          }
          @if (lastPage() > 1) {
            <div class="pager">
              <button class="fw-btn fw-btn--ghost fw-btn--sm" type="button" [disabled]="page() <= 1" (click)="goto(page() - 1)">Previous</button>
              <span>Page {{ page() }} of {{ lastPage() }}</span>
              <button class="fw-btn fw-btn--ghost fw-btn--sm" type="button" [disabled]="page() >= lastPage()" (click)="goto(page() + 1)">Next</button>
            </div>
          }
        </div>

        @if (selected(); as a) {
          <aside class="detail panel" aria-label="Application summary">
            <div class="dh">
              <span class="ic" [class]="'ic ic--' + tone(a.loan_type)"><span class="material-icons">{{ icon(a.loan_type) }}</span></span>
              <div><b>{{ a.loan_type_label }}</b><small>Application ID: {{ a.reference }}</small></div>
              <span class="fw-pill" [class]="'fw-pill fw-pill--' + a.status.tone">{{ a.status.label }}</span>
            </div>
            <div class="dtabs" role="tablist">
              @for (t of dtabs; track t.key) { <button type="button" role="tab" [attr.aria-selected]="dtab() === t.key" [class.on]="dtab() === t.key" (click)="dtab.set(t.key)">{{ t.label }}</button> }
            </div>

            @if (!detail()) {
              <div class="fw-skeleton" style="height:180px"></div>
            } @else if (detail(); as d) {
              @switch (dtab()) {
                @case ('overview') {
                  <dl>
                    <dt>Loan Amount</dt><dd>{{ fmt(d.loan_amount) }}</dd>
                    <dt>Loan Tenure</dt><dd>{{ d.tenure_months ? tenure(d.tenure_months) : '—' }}</dd>
                    <dt>Applied On</dt><dd>{{ d.applied_on | date: 'd MMM y' }}</dd>
                    <dt>City</dt><dd>{{ d.city || '—' }}</dd>
                    @if (d.details?.employment_type) { <dt>Employment</dt><dd>{{ label(d.details?.employment_type) }}</dd> }
                    @if (d.details?.monthly_income) { <dt>Monthly Income</dt><dd>{{ fmt(d.details?.monthly_income ?? 0) }}</dd> }
                    <dt>Current Stage</dt><dd>{{ d.status.label }}</dd>
                    <dt>Last Updated</dt><dd>{{ d.updated_at | date: 'd MMM y' }}</dd>
                  </dl>
                  <p class="msg">{{ d.status.message }}</p>
                }
                @case ('documents') {
                  @for (x of d.documents ?? []; track x.type) {
                    <div class="drow"><span class="material-icons ck" [class.ck--ok]="x.status === 'verified' || x.status === 'pending'" [class.ck--bad]="x.status === 'rejected'">{{ x.status === 'rejected' ? 'cancel' : 'check_circle' }}</span>{{ x.label }}<em [class]="'em em--' + x.status">{{ docState(x.status) }}</em></div>
                  }
                }
                @case ('updates') {
                  @for (t of d.timeline ?? []; track $index) {
                    <div class="trow"><span class="dotl"></span><div><b>{{ t.label }}</b><small>{{ t.message }}</small><small>{{ t.at | date: 'd MMM y, h:mm a' }}</small></div></div>
                  } @empty { <p class="msg">No updates yet. We’ll post here as your application moves forward.</p> }
                }
              }

              @if (missing().length && dtab() !== 'documents') {
                <section class="complete">
                  <h3>Complete Your Application</h3>
                  <p>Please upload the remaining documents to proceed further.</p>
                  @for (x of docsToShow(); track x.type) {
                    <div class="drow"><span class="material-icons ck" [class.ck--ok]="x.status === 'verified' || x.status === 'pending'" [class.ck--bad]="x.status === 'rejected'">{{ x.status === 'rejected' ? 'cancel' : 'check_circle' }}</span>{{ x.label }}<em [class]="'em em--' + x.status">{{ x.status === 'not_uploaded' || x.status === 'rejected' ? 'Upload' : 'Uploaded' }}</em></div>
                  }
                  <a class="fw-btn fw-btn--primary fw-btn--block" routerLink="/account/documents">Upload Documents <span class="material-icons">arrow_forward</span></a>
                </section>
              }
            }
          </aside>
        }
      </div>

      <div class="foot">
        <section class="panel help">
          <span class="material-icons big">support_agent</span>
          <div><h3>Need Assistance?</h3><p>Our loan experts are here to help you at every step.</p>
            <a class="phone" [href]="site.phoneHref"><span class="material-icons">phone</span><span><b>{{ site.phone }}</b><small>{{ site.hours }}</small></span></a>
            <div class="mail"><span class="material-icons">mail_outline</span>{{ site.email }}</div></div>
          <a class="fw-btn fw-btn--primary fw-btn--sm" routerLink="/account/help">Talk to Expert <span class="material-icons">arrow_forward</span></a>
        </section>
        <section class="panel more">
          <h3>Explore More Loan Options</h3>
          <p>Looking for another loan? We have the right solution for you.</p>
          <div class="chips">
            <a routerLink="/account/apply" [queryParams]="{ product: 'personal-loan' }"><span class="material-icons">savings</span>Personal Loan</a>
            <a routerLink="/account/apply" [queryParams]="{ product: 'home-loan' }"><span class="material-icons">home</span>Home Loan</a>
            <a routerLink="/account/apply" [queryParams]="{ product: 'business-loan' }"><span class="material-icons">business</span>Business Loan</a>
            <a routerLink="/account/apply" [queryParams]="{ product: 'loan-against-property' }"><span class="material-icons">apartment</span>LAP Loan</a>
          </div>
        </section>
        <section class="panel req">
          <h3>Have a New Requirement?</h3>
          <p>Apply for a new loan and get the best offers.</p>
          <a class="fw-btn fw-btn--primary fw-btn--block" routerLink="/account/apply">Apply for New Loan <span class="material-icons">arrow_forward</span></a>
        </section>
      </div>
    }
  `,
  styles: [
    `
      .crumbs { display: flex; gap: 8px; font-size: 0.82rem; color: var(--fw-muted); margin-bottom: 8px; } .crumbs a { color: inherit; text-decoration: none; }
      .head { display: grid; grid-template-columns: 1fr auto auto; gap: 24px; align-items: center; margin-bottom: 16px; }
      h1 { margin: 0 0 4px; font-size: clamp(1.7rem, 3vw, 2.2rem); color: var(--fw-navy); } .head p { margin: 0; color: var(--fw-muted); font-size: 0.92rem; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.15rem; line-height: 1.25; color: var(--fw-navy-2); }
      .fw-btn { white-space: nowrap; }
      .tabs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
      .tabs button { border: 1px solid var(--fw-line); background: #fff; border-radius: 10px; padding: 10px 18px; font: 500 0.84rem Poppins, sans-serif; cursor: pointer; color: var(--fw-ink); }
      .tabs button.on { background: var(--fw-blue); color: #fff; border-color: var(--fw-blue); }
      .panel { background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; padding: 18px; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.04); }
      .cols { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(290px, 1fr); gap: 16px; align-items: start; margin-bottom: 16px; }
      .list { display: grid; gap: 14px; min-width: 0; }
      .app { background: #fff; border: 1.5px solid var(--fw-line); border-radius: 14px; padding: 16px; min-width: 0; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
      .app:hover { box-shadow: 0 6px 18px rgba(16, 33, 58, 0.08); } .app.sel, .app:focus-visible { border-color: var(--fw-blue); box-shadow: 0 0 0 3px rgba(28, 109, 240, 0.12); }
      .app__top { display: grid; grid-template-columns: 44px minmax(0, 1.25fr) minmax(0, 0.95fr) minmax(0, 0.95fr) minmax(0, 1.2fr) auto; gap: 12px; align-items: center; }
      .app__id, .app__meta { display: contents; }
      .ic { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; color: #fff; flex: none; } .ic--green { background: #16a34a; } .ic--blue { background: #1c6df0; } .ic--purple { background: #7c3aed; } .ic--orange { background: #f97316; }
      .app__name { display: grid; line-height: 1.3; } .app__name b { font-size: 1rem; } .app__name small, .cell small { color: var(--fw-muted); font-size: 0.72rem; } .app__name span { font-size: 0.8rem; font-weight: 600; overflow-wrap: anywhere; }
      .cell { display: grid; gap: 2px; justify-items: start; } .cell b { font-size: 0.84rem; } .cell .fw-pill { white-space: normal; text-align: left; line-height: 1.25; }
      .steps { list-style: none; margin: 16px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); }
      .st { position: relative; display: grid; justify-items: center; text-align: center; gap: 1px; padding: 0 4px; }
      .st:not(:last-child)::after { content: ''; position: absolute; top: 12px; left: calc(50% + 14px); right: calc(-50% + 14px); height: 2px; background: #d7dfec; }
      .st--done:not(:last-child)::after { background: #16a34a; }
      .dot { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: #d7dfec; color: #fff; position: relative; z-index: 1; } .dot .material-icons { font-size: 16px; }
      .st--done .dot { background: #16a34a; } .st--now .dot { background: #fff; border: 3px solid var(--fw-blue); color: var(--fw-blue); } .st--now .dot .material-icons { font-size: 9px; }
      .st b { font-size: 0.72rem; margin-top: 6px; line-height: 1.25; } .st small { font-size: 0.68rem; color: var(--fw-muted); } .st--done small { color: #15803d; } .st--now small { color: var(--fw-blue); }
      .detail { position: sticky; top: 76px; display: grid; gap: 12px; }
      .dh { display: flex; gap: 12px; align-items: center; } .dh > div { display: grid; flex: 1; line-height: 1.3; min-width: 0; } .dh small { color: var(--fw-muted); font-size: 0.74rem; }
      .dtabs { display: flex; gap: 22px; border-bottom: 1px solid var(--fw-line); } .dtabs button { background: none; border: 0; padding: 8px 2px; font: 500 0.86rem Poppins, sans-serif; color: var(--fw-ink); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; } .dtabs button.on { color: var(--fw-blue); border-bottom-color: var(--fw-blue); font-weight: 600; }
      dl { display: grid; grid-template-columns: 130px 1fr; gap: 9px 12px; margin: 0; font-size: 0.86rem; } dt { color: var(--fw-muted); } dd { margin: 0; font-weight: 500; }
      .msg { margin: 0; font-size: 0.82rem; color: var(--fw-muted); background: #f6f9fe; border-radius: 10px; padding: 10px 12px; }
      .complete { background: var(--fw-blue-soft); border-radius: 12px; padding: 14px; display: grid; gap: 6px; } .complete h3 { margin: 0; font-size: 1rem; } .complete p { margin: 0 0 4px; font-size: 0.8rem; color: var(--fw-muted); }
      .drow { display: flex; align-items: center; gap: 8px; font-size: 0.84rem; padding: 3px 0; } .ck { color: #b3bfd1; font-size: 20px; } .ck--ok { color: #16a34a; } .ck--bad { color: #dc2626; }
      .em { margin-left: auto; font-style: normal; font-size: 0.78rem; } .em--verified, .em--pending { color: #15803d; } .em--not_uploaded { color: var(--fw-blue); font-weight: 600; } .em--rejected { color: #dc2626; font-weight: 600; }
      .trow { display: flex; gap: 10px; padding: 8px 0; border-top: 1px solid var(--fw-line); font-size: 0.84rem; } .trow:first-child { border-top: 0; } .trow div { display: grid; line-height: 1.35; } .trow small { color: var(--fw-muted); font-size: 0.74rem; } .dotl { width: 10px; height: 10px; border-radius: 50%; background: var(--fw-blue); margin-top: 6px; flex: none; }
      .foot { display: grid; grid-template-columns: 1.3fr 1.3fr 1fr; gap: 16px; }
      .foot h3 { margin: 0 0 4px; font-size: 1rem; } .foot p { margin: 0 0 10px; font-size: 0.8rem; color: var(--fw-muted); }
      .help { display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap; } .help > div { flex: 1; min-width: 180px; } .big { font-size: 40px; color: var(--fw-blue); }
      .phone { display: flex; gap: 8px; align-items: center; text-decoration: none; color: var(--fw-ink); } .phone .material-icons { color: #fff; background: var(--fw-blue); border-radius: 50%; padding: 6px; font-size: 18px; } .phone span:last-child { display: grid; line-height: 1.2; } .phone small { color: var(--fw-muted); font-size: 0.7rem; }
      .mail { display: flex; gap: 8px; align-items: center; margin-top: 8px; font-size: 0.8rem; } .mail .material-icons { color: var(--fw-blue); font-size: 20px; }
      .chips { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; } .chips a { display: grid; justify-items: center; gap: 4px; text-align: center; border: 1px solid var(--fw-line); border-radius: 10px; padding: 12px 4px; font-size: 0.74rem; font-weight: 500; text-decoration: none; color: var(--fw-ink); } .chips a:hover { border-color: var(--fw-blue); } .chips .material-icons { color: var(--fw-blue); font-size: 26px; }
      .none, .empty { text-align: center; color: var(--fw-muted); } .empty { display: grid; justify-items: center; gap: 8px; padding: 36px 20px; } .empty .material-icons { font-size: 48px; color: var(--fw-blue); } .empty h2 { margin: 0; color: var(--fw-ink); }
      .link { background: none; border: 0; color: var(--fw-blue); font-weight: 600; cursor: pointer; text-decoration: underline; font: inherit; padding: 0; }
      .pager { display: flex; gap: 14px; justify-content: center; align-items: center; font-size: 0.82rem; color: var(--fw-muted); }
      .retry { margin-left: 8px; background: none; border: 0; text-decoration: underline; cursor: pointer; color: inherit; }
      @media (max-width: 1360px) { .app__top { grid-template-columns: 44px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); } .app__top .fw-btn { grid-column: 1 / -1; justify-self: start; } }
      @media (max-width: 1280px) { .cols { grid-template-columns: minmax(0, 1fr); } .detail { position: static; } .foot { grid-template-columns: 1fr; } .head { grid-template-columns: 1fr auto; } .script { display: none; } }
      @media (max-width: 800px) {
        /* Phone card: icon + name, a tinted details box (status first, then amount and date), then a full-width button. */
        .app { padding: 14px; }
        .app__top { display: flex; flex-direction: column; align-items: stretch; gap: 12px; }
        .app__id { display: flex; align-items: center; gap: 12px; min-width: 0; } .app__id .app__name { min-width: 0; flex: 1; }
        .app__meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; padding: 12px; border-radius: 10px; background: var(--fw-blue-soft); }
        .cell--status { grid-column: 1 / -1; order: -1; grid-auto-flow: column; justify-content: space-between; align-items: center; }
        .app__top .fw-btn { width: 100%; justify-content: center; box-sizing: border-box; }
        .steps { margin-top: 18px; } .st { padding: 0 1px; } .st b { font-size: 0.64rem; } .st small { display: none; }
      }
      @media (max-width: 800px) { .tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } .tabs button { padding: 11px 8px; font-size: 0.8rem; text-align: center; } .tabs button:first-child { grid-column: 1 / -1; } .st b { font-size: 0.64rem; } .st small { display: none; } .head { grid-template-columns: 1fr; } }
    `,
  ],
  styleUrl: '../../website/website-ui.scss',
})
export class AccountApplicationsComponent {
  private readonly portal = inject(CustomerPortalService);

  protected readonly site = WEBSITE;
  protected readonly stages = STAGES;
  protected readonly tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All Applications' },
    { key: 'progress', label: 'In Progress' },
    { key: 'review', label: 'Under Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];
  protected readonly dtabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'documents', label: 'Documents' },
    { key: 'updates', label: 'Updates' },
  ];

  protected readonly items = signal<CustomerApplication[]>([]);
  protected readonly page = signal(1);
  protected readonly lastPage = signal(1);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<Filter>('all');
  protected readonly selectedId = signal(0);
  protected readonly detail = signal<CustomerApplication | null>(null);
  protected readonly dtab = signal('overview');

  protected readonly shown = computed(() => (this.filter() === 'all' ? this.items() : this.items().filter((a) => group(a) === this.filter())));
  protected readonly selected = computed(() => this.items().find((a) => a.id === this.selectedId()) ?? null);
  protected readonly filterLabel = computed(() => this.tabs.find((t) => t.key === this.filter())?.label.toLowerCase() ?? '');
  /** Required documents still open on the selected application. */
  protected readonly missing = computed(() => (this.detail()?.documents ?? []).filter((d) => d.required !== false && (d.status === 'not_uploaded' || d.status === 'rejected')));
  protected readonly docsToShow = computed(() => (this.detail()?.documents ?? []).filter((d) => d.required !== false));

  constructor() {
    this.load();
  }

  protected load(): void {
    this.goto(1);
  }

  protected goto(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.portal.applications(page, 10).subscribe({
      next: (p) => {
        this.items.set(p.items);
        this.page.set(page);
        this.lastPage.set(p.lastPage);
        this.loading.set(false);
        if (p.items.length) this.select(p.items.find((a) => a.id === this.selectedId()) ?? p.items[0]);
      },
      error: (e: { message?: string }) => {
        this.error.set(e?.message ?? 'We could not load your applications.');
        this.loading.set(false);
      },
    });
  }

  protected setFilter(f: Filter): void {
    this.filter.set(f);
    const first = this.shown()[0];
    if (first && !this.shown().some((a) => a.id === this.selectedId())) this.select(first);
  }

  protected select(a: CustomerApplication): void {
    if (this.selectedId() === a.id && this.detail()) return;
    this.selectedId.set(a.id);
    this.detail.set(null);
    this.portal.application(a.id).subscribe({
      next: (d) => { if (this.selectedId() === a.id) this.detail.set(d); },
      error: () => undefined,
    });
  }

  protected count(f: Filter): number {
    return f === 'all' ? this.items().length : this.items().filter((a) => group(a) === f).length;
  }

  /** done = stage finished, now = where the application is, todo = still ahead. */
  protected stageState(a: CustomerApplication, i: number): 'done' | 'now' | 'todo' {
    const step = a.status.step;
    if (step >= STAGES.length - 1) return 'done';
    return i < step ? 'done' : i === step ? 'now' : 'todo';
  }

  protected stageNote(a: CustomerApplication, i: number): string {
    const s = this.stageState(a, i);
    if (i === 0 && s === 'done') return this.shortDate(a.applied_on);
    return s === 'done' ? 'Completed' : s === 'now' ? 'In Progress' : 'Pending';
  }

  private shortDate(v: string | null): string {
    return v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  }

  protected icon(type: string): string {
    return loanTypeIcon(type);
  }

  protected tone(type: string): string {
    return loanTypeTone(type);
  }

  protected fmt(v: number): string {
    return formatInr(v);
  }

  protected tenure(months: number): string {
    if (months % 12 === 0) return `${months / 12} Year${months === 12 ? '' : 's'}`;
    return months < 12 ? `${months} Months` : `${(months / 12).toFixed(1)} Years`;
  }

  protected label(v?: string): string {
    return (v ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected docState(s: string): string {
    return ({ verified: 'Verified', pending: 'Under review', rejected: 'Rejected', not_uploaded: 'Pending' } as Record<string, string>)[s] ?? s;
  }
}
