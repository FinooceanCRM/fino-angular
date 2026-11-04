import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminOffer, OfferAnalytics, OfferInput, OfferMeta, OfferSettings } from '@core/models/offer.model';
import { OfferService } from '@core/services/offer.service';

type Tab = 'offers' | 'settings' | 'analytics';

/** Website pages the popup can be limited to. A choice may cover several URL patterns (a page and everything under it). */
const KNOWN_PAGES: { label: string; patterns: string[] }[] = [
  { label: 'Home', patterns: ['/'] },
  { label: 'Services (all service pages)', patterns: ['/services', '/services/*'] },
  { label: 'About Us', patterns: ['/about'] },
  { label: 'Loan Calculator', patterns: ['/calculator'] },
  { label: 'Check Eligibility', patterns: ['/eligibility'] },
  { label: 'FAQs', patterns: ['/faq'] },
  { label: 'Testimonials', patterns: ['/testimonials'] },
  { label: 'News & Blog', patterns: ['/blog', '/blog/*'] },
  { label: 'Contact Us', patterns: ['/contact'] },
];

const toDateInput = (iso: string | null): string => (iso ? iso.slice(0, 10) : '');

/** Offer lead generation for the super admin: manage offers, popup timing and pages, and see how it performs. */
@Component({
  selector: 'app-super-admin-offers',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="top">
      <div><h1>Lead Offers</h1><p>Offers shown to guest visitors, the timed popup, and how many leads they bring in. Every lead goes straight to the Customer Inquiries queue.</p></div>
    </header>

    <nav class="tabs" role="tablist">
      <button type="button" role="tab" [class.on]="tab() === 'offers'" [attr.aria-selected]="tab() === 'offers'" (click)="tab.set('offers')">Offers</button>
      <button type="button" role="tab" [class.on]="tab() === 'settings'" [attr.aria-selected]="tab() === 'settings'" (click)="tab.set('settings')">Popup settings</button>
      <button type="button" role="tab" [class.on]="tab() === 'analytics'" [attr.aria-selected]="tab() === 'analytics'" (click)="tab.set('analytics'); loadAnalytics()">Analytics</button>
    </nav>

    @if (message(); as m) { <div class="msg" [class.msg--err]="m.err" role="status">{{ m.text }}</div> }

    <!-- ───────── Offers ───────── -->
    @if (tab() === 'offers') {
      @if (!editing()) {
        <div class="bar"><span class="muted">{{ offers().length }} offer{{ offers().length === 1 ? '' : 's' }}</span><button type="button" class="btn btn--p" (click)="startNew()">+ New offer</button></div>
        @if (loading()) { <div class="card muted">Loading…</div> }
        @else if (offers().length === 0) {
          <div class="card empty"><h2>No offers yet</h2><p>Create your first offer, then switch the popup on under “Popup settings”.</p><button type="button" class="btn btn--p" (click)="startNew()">Create an offer</button></div>
        } @else {
          <div class="list">
            @for (o of offers(); track o.id) {
              <article class="card offer">
                <div class="offer__thumb">@if (img(o); as src) { <img [src]="src" alt="" /> } @else { <span class="material-icons">redeem</span> }</div>
                <div class="offer__main">
                  <div class="offer__h"><h3>{{ o.name }}</h3>
                    <span class="pill" [class.pill--ok]="o.is_live" [class.pill--off]="!o.is_live">{{ o.is_live ? 'Live' : o.is_active ? 'Not in validity window' : 'Inactive' }}</span>
                    @if (o.show_popup) { <span class="pill pill--info">In popup</span> }</div>
                  <p class="muted">{{ o.type_label }} · “{{ o.headline }}”</p>
                  <p class="muted small">Valid {{ o.valid_from ? (o.valid_from | date: 'd MMM y') : 'from now' }} → {{ o.valid_until ? (o.valid_until | date: 'd MMM y') : 'no end date' }} · <code>/offers/{{ o.slug }}</code></p>
                  <div class="nums"><span><b>{{ o.impressions ?? 0 }}</b> shown</span><span><b>{{ o.clicks ?? 0 }}</b> clicks</span><span><b>{{ o.visits ?? 0 }}</b> visits</span><span><b>{{ o.leads ?? 0 }}</b> leads</span></div>
                </div>
                <div class="offer__act">
                  <button type="button" class="btn" (click)="edit(o)">Edit</button>
                  <button type="button" class="btn" (click)="toggleActive(o)">{{ o.is_active ? 'Deactivate' : 'Activate' }}</button>
                  <button type="button" class="btn" (click)="copyLink(o)">Copy link</button>
                  <button type="button" class="btn btn--d" (click)="remove(o)">Remove</button>
                </div>
              </article>
            }
          </div>
        }
      } @else {
        <section class="card">
          <div class="bar"><h2>{{ editing() === 'new' ? 'New offer' : 'Edit offer' }}</h2><button type="button" class="btn" (click)="cancel()">← Back to offers</button></div>
          <form [formGroup]="form" (ngSubmit)="save()" novalidate class="form">
            <label>Offer name (internal) *<input formControlName="name" maxlength="150" /></label>
            <label>Offer type *<select formControlName="type">@for (t of meta()?.types ?? []; track t.value) { <option [value]="t.value">{{ t.label }}</option> }</select></label>
            <label class="wide">Headline *<input formControlName="headline" maxlength="200" placeholder="e.g. Get a free loan consultation" /></label>
            <label class="wide">Description * (shown in the popup and on the offer page)<textarea formControlName="description" rows="3" maxlength="2000"></textarea></label>
            <label class="wide">Benefits (one per line, up to 6)<textarea formControlName="benefitsText" rows="4" placeholder="Expert advice on the best loan for you&#10;No paperwork needed for the call"></textarea></label>
            <label>Button text<input formControlName="cta_text" maxlength="60" placeholder="Claim My Offer" /></label>
            <label>Badge (small label on the popup)<input formControlName="badge_text" maxlength="60" placeholder="e.g. Limited time" /></label>
            <label>Valid from<input type="date" formControlName="valid_from" /></label>
            <label>Valid until (the whole day)<input type="date" formControlName="valid_until" /></label>
            <label>Priority (lower shows first in the popup)<input type="number" min="0" max="999" formControlName="sort_order" /></label>
            <div class="checks">
              <label class="chk"><input type="checkbox" formControlName="is_active" /> Active</label>
              <label class="chk"><input type="checkbox" formControlName="show_popup" /> Show in the popup</label>
            </div>

            <div class="wide imgbox">
              <b>Promotional image</b>
              <p class="muted small">JPG, PNG or WebP, up to 2 MB. Shown on the popup and the offer page.</p>
              <div class="imgrow">
                @if (previewUrl(); as src) { <img [src]="src" alt="Offer image preview" /> } @else { <span class="noimg">No image</span> }
                <label class="btn">Choose image<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden (change)="pickImage($event)" /></label>
                @if (previewUrl()) { <button type="button" class="btn btn--d" (click)="dropImage()">Remove image</button> }
              </div>
            </div>

            @if (formError()) { <div class="msg msg--err wide" role="alert">{{ formError() }}</div> }
            <div class="wide row"><button type="submit" class="btn btn--p" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save offer' }}</button><button type="button" class="btn" (click)="cancel()">Cancel</button></div>
          </form>
        </section>
      }
    }

    <!-- ───────── Popup settings ───────── -->
    @if (tab() === 'settings') {
      @if (!settings()) { <div class="card muted">Loading…</div> } @else {
        <section class="card">
          <form [formGroup]="sForm" (ngSubmit)="saveSettings()" novalidate class="form">
            <div class="wide sw"><label class="chk"><input type="checkbox" formControlName="popup_enabled" /> <b>Show the offer popup to guest visitors</b></label>
              <p class="muted small">Only visitors who are not signed in. Needs at least one live offer that is set to “Show in the popup”.</p></div>
            <div class="wide sw"><label class="chk"><input type="checkbox" formControlName="callback_enabled" /> <b>Start with the small “share your details” form</b></label>
              <p class="muted small">Works on its own, even with the offer popup switched off. The first thing a new guest sees on opening the website: name, mobile and city. The details are saved in Customer Inquiries as data; nobody is called automatically. Shown once per visitor, no offer needed. The offer popups below follow it.</p></div>
            <label>First offer popup appears after (seconds on the site; 0 = at once)<input type="number" [min]="settings()!.ranges.first[0]" [max]="settings()!.ranges.first[1]" formControlName="first_delay_seconds" /></label>
            <label>Second offer popup appears this many seconds after the first is closed<input type="number" [min]="settings()!.ranges.second[0]" [max]="settings()!.ranges.second[1]" formControlName="second_delay_seconds" /></label>
            <label>Then again every (seconds after the previous one is closed)<input type="number" [min]="settings()!.ranges.repeat[0]" [max]="settings()!.ranges.repeat[1]" formControlName="repeat_gap_seconds" /></label>
            <p class="muted small wide">A visitor who submits the offer form never sees the popup again.</p>

            <fieldset class="wide pages"><legend>Pages where the popup may appear</legend>
              <label class="chk"><input type="checkbox" [checked]="allPages()" (change)="setAllPages($any($event.target).checked)" /> <b>All website pages</b></label>
              @if (!allPages()) {
                <div class="grid">@for (p of known; track p.label) { <label class="chk"><input type="checkbox" [checked]="isPicked(p.patterns)" (change)="pick(p.patterns, $any($event.target).checked)" /> {{ p.label }}</label> }</div>
                <label class="wide">Other pages (optional, comma separated, e.g. <code>/services/home-loan</code>)<input [value]="extra()" (input)="extra.set($any($event.target).value)" placeholder="/some/page, /other/*" /></label>
              }
              <p class="muted small">The popup never appears on the offer page, the login or register pages, or inside the customer dashboard.</p>
            </fieldset>

            @if (settingsError()) { <div class="msg msg--err wide" role="alert">{{ settingsError() }}</div> }
            <div class="wide row"><button type="submit" class="btn btn--p" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save settings' }}</button></div>
          </form>
        </section>
      }
    }

    <!-- ───────── Analytics ───────── -->
    @if (tab() === 'analytics') {
      <div class="bar filters">
        <label>Period<select [value]="days()" (change)="days.set(+$any($event.target).value); loadAnalytics()"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label>
        <label>Offer<select [value]="offerFilter()" (change)="offerFilter.set(+$any($event.target).value); loadAnalytics()"><option value="0">All offers</option>@for (o of offers(); track o.id) { <option [value]="o.id">{{ o.name }}</option> }</select></label>
      </div>
      @if (!analytics()) { <div class="card muted">Loading…</div> } @else {
        @if (analytics(); as a) {
          <div class="stats">
            <div class="stat"><span>Popup impressions</span><b>{{ a.totals.impressions }}</b><small>{{ a.totals.unique_visitors_shown }} visitors</small></div>
            <div class="stat"><span>Popup clicks</span><b>{{ a.totals.clicks }}</b><small>{{ pct(a.totals.click_through_percent) }} click-through</small></div>
            <div class="stat"><span>Landing page visits</span><b>{{ a.totals.landing_visits }}</b></div>
            <div class="stat stat--k"><span>Leads generated</span><b>{{ a.totals.leads }}</b><small>{{ a.totals.duplicates }} repeat enquiries noted</small></div>
            <div class="stat stat--k"><span>Conversion</span><b>{{ pct(a.totals.conversion_percent) }}</b><small>leads ÷ landing visits</small></div>
            <div class="stat"><span>Details shared</span><b>{{ a.totals.callback_requests ?? 0 }}</b><small>from the first small popup</small></div>
            <div class="stat"><span>Overall</span><b>{{ pct(a.totals.overall_percent) }}</b><small>leads ÷ impressions</small></div>
          </div>

          <div class="two">
            <section class="card"><h2>Best-performing offers</h2>
              @if (a.best_offers.length === 0) { <p class="muted">No activity in this period yet.</p> } @else {
                <table><thead><tr><th>Offer</th><th>Shown</th><th>Clicks</th><th>Visits</th><th>Leads</th><th>Conv.</th></tr></thead>
                  <tbody>@for (b of a.best_offers; track b.id) { <tr><td>{{ b.name }}@if (!b.is_active) { <small class="muted"> (inactive)</small> }</td><td>{{ b.impressions }}</td><td>{{ b.clicks }}</td><td>{{ b.visits }}</td><td><b>{{ b.leads }}</b></td><td>{{ pct(b.conversion_percent) }}</td></tr> }</tbody></table>
              }
            </section>
            <section class="card"><h2>Lead sources</h2>
              @for (s of a.sources; track s.value) { <div class="bar2"><span>{{ s.label }}</span><div class="track"><i [style.width.%]="share(s.count, a.totals.leads)"></i></div><b>{{ s.count }}</b></div> }
              <h2 class="sp">Lead status</h2>
              @for (s of a.statuses; track s.value) { <div class="bar2"><span>{{ s.label }}</span><div class="track"><i class="alt" [style.width.%]="share(s.count, a.totals.leads)"></i></div><b>{{ s.count }}</b></div> }
            </section>
          </div>

          <section class="card"><h2>Leads per day</h2>
            @if (a.leads_by_day.length === 0) { <p class="muted">No leads in this period yet.</p> } @else {
              <div class="spark">@for (d of a.leads_by_day; track d.date) { <div class="col" [title]="d.date + ': ' + d.count"><i [style.height.%]="share(d.count, maxDay())"></i><small>{{ d.date.slice(5) }}</small></div> }</div>
            }
          </section>
        }
      }
    }
  `,
  styles: [
    `
      :host { display: block; padding: 20px; max-width: 1200px; margin: 0 auto; color: var(--mat-sys-on-surface, #1b1b1f); font-family: inherit; }
      h1 { margin: 0 0 4px; font-size: 1.6rem; } h2 { margin: 0 0 10px; font-size: 1.1rem; } h3 { margin: 0; font-size: 1.02rem; } .top p { margin: 0 0 14px; color: var(--mat-sys-on-surface-variant, #5b6b82); max-width: 720px; }
      .muted { color: var(--mat-sys-on-surface-variant, #5b6b82); } .small { font-size: 0.8rem; margin: 2px 0; }
      .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--mat-sys-outline-variant, #d5dbe6); margin-bottom: 16px; } .tabs button { background: none; border: 0; padding: 10px 18px; font: 500 0.92rem inherit; cursor: pointer; border-bottom: 3px solid transparent; color: inherit; } .tabs button.on { border-bottom-color: #1c6df0; color: #1c6df0; font-weight: 600; }
      .card { background: var(--mat-sys-surface-container-lowest, #fff); border: 1px solid var(--mat-sys-outline-variant, #d5dbe6); border-radius: 14px; padding: 18px; margin-bottom: 14px; } .empty { text-align: center; padding: 36px; }
      .bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
      .btn { display: inline-block; border: 1px solid var(--mat-sys-outline, #aab4c4); background: transparent; color: inherit; border-radius: 10px; padding: 8px 14px; font: 500 0.86rem inherit; cursor: pointer; } .btn:hover { background: rgba(28, 109, 240, 0.08); } .btn--p { background: #1c6df0; color: #fff; border-color: #1c6df0; } .btn--p:hover { background: #1558c8; } .btn--d { color: #b91c1c; border-color: #f5b9b9; } .btn:disabled { opacity: 0.55; cursor: not-allowed; }
      .msg { padding: 10px 14px; border-radius: 10px; background: #e6f7ec; color: #166534; margin-bottom: 12px; font-size: 0.88rem; } .msg--err { background: #fde8e8; color: #991b1b; }
      .offer { display: grid; grid-template-columns: 96px 1fr auto; gap: 16px; align-items: start; } .offer__thumb { width: 96px; height: 96px; border-radius: 12px; background: linear-gradient(135deg, #0d3a75, #1c6df0); display: grid; place-items: center; overflow: hidden; color: #ffd166; } .offer__thumb img { width: 100%; height: 100%; object-fit: cover; } .offer__thumb .material-icons { font-size: 42px; }
      .offer__h { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; } .offer__main p { margin: 3px 0; } .offer__act { display: grid; gap: 6px; } .offer code { background: rgba(0, 0, 0, 0.05); padding: 1px 6px; border-radius: 4px; }
      .nums { display: flex; gap: 18px; margin-top: 6px; font-size: 0.84rem; color: var(--mat-sys-on-surface-variant, #5b6b82); } .nums b { color: var(--mat-sys-on-surface, #1b1b1f); font-size: 1rem; }
      .pill { font-size: 0.72rem; font-weight: 600; border-radius: 999px; padding: 2px 10px; background: #eef2f8; color: #5b6b82; } .pill--ok { background: #dcfce7; color: #15803d; } .pill--off { background: #fee2e2; color: #b91c1c; } .pill--info { background: #dbeafe; color: #1d4ed8; }
      .form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 18px; } .wide { grid-column: 1 / -1; } .form label { display: grid; gap: 5px; font-size: 0.84rem; font-weight: 500; }
      .form input:not([type=checkbox]):not([type=range]), .form select, .form textarea, .filters select { border: 1px solid var(--mat-sys-outline, #aab4c4); border-radius: 8px; padding: 9px 11px; font: 400 0.92rem inherit; background: transparent; color: inherit; width: 100%; box-sizing: border-box; } .form textarea { resize: vertical; }
      .checks { display: flex; gap: 22px; align-items: center; } .chk { display: flex !important; gap: 8px; align-items: center; font-weight: 500; } .chk input { width: 18px; height: 18px; }
      .imgbox { border: 1px dashed var(--mat-sys-outline, #aab4c4); border-radius: 12px; padding: 14px; } .imgrow { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; } .imgrow img { height: 90px; border-radius: 10px; object-fit: cover; } .noimg { width: 150px; height: 90px; display: grid; place-items: center; background: rgba(0, 0, 0, 0.05); border-radius: 10px; color: #7b8aa0; font-size: 0.82rem; }
      .row { display: flex; gap: 10px; } .pages { border: 1px solid var(--mat-sys-outline-variant, #d5dbe6); border-radius: 12px; padding: 14px; } .pages legend { font-weight: 600; padding: 0 6px; } .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; margin: 10px 0; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 14px; } .stat { background: var(--mat-sys-surface-container-lowest, #fff); border: 1px solid var(--mat-sys-outline-variant, #d5dbe6); border-radius: 14px; padding: 14px 16px; display: grid; gap: 2px; } .stat span { font-size: 0.78rem; color: var(--mat-sys-on-surface-variant, #5b6b82); } .stat b { font-size: 1.7rem; } .stat small { font-size: 0.74rem; color: var(--mat-sys-on-surface-variant, #5b6b82); } .stat--k { border-color: #1c6df0; background: rgba(28, 109, 240, 0.05); }
      .two { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; } table { width: 100%; border-collapse: collapse; font-size: 0.86rem; } th { text-align: left; font-size: 0.74rem; color: var(--mat-sys-on-surface-variant, #5b6b82); padding: 6px 8px; border-bottom: 1px solid var(--mat-sys-outline-variant, #d5dbe6); } td { padding: 8px; border-bottom: 1px solid var(--mat-sys-outline-variant, #eef1f6); }
      .bar2 { display: grid; grid-template-columns: 150px 1fr 36px; gap: 10px; align-items: center; margin: 6px 0; font-size: 0.84rem; } .track { height: 10px; background: #eef2f8; border-radius: 99px; overflow: hidden; } .track i { display: block; height: 100%; background: #1c6df0; border-radius: 99px; } .track i.alt { background: #16a34a; } .sp { margin-top: 18px; }
      .spark { display: flex; gap: 6px; align-items: flex-end; height: 130px; overflow-x: auto; padding-top: 6px; } .col { flex: 0 0 26px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; } .col i { width: 18px; background: #1c6df0; border-radius: 4px 4px 0 0; min-height: 3px; } .col small { font-size: 0.6rem; color: #7b8aa0; }
      .filters label { display: flex; gap: 8px; align-items: center; font-size: 0.84rem; } .filters select { width: auto; }
      @media (max-width: 900px) { .offer { grid-template-columns: 1fr; } .offer__act { grid-template-columns: repeat(2, 1fr); } .form, .two, .grid { grid-template-columns: 1fr; } .bar2 { grid-template-columns: 110px 1fr 30px; } }
    `,
  ],
})
export class SuperAdminOffersComponent implements OnInit {
  private readonly svc = inject(OfferService);
  private readonly fb = inject(FormBuilder);

  protected readonly known = KNOWN_PAGES;
  protected readonly tab = signal<Tab>('offers');
  protected readonly offers = signal<AdminOffer[]>([]);
  protected readonly meta = signal<OfferMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly message = signal<{ text: string; err: boolean } | null>(null);

  protected readonly editing = signal<null | 'new' | AdminOffer>(null);
  protected readonly formError = signal<string | null>(null);
  private pendingFile: File | null = null;
  private readonly localPreview = signal<string | null>(null);
  private readonly removeExisting = signal(false);

  protected readonly settings = signal<OfferSettings | null>(null);
  protected readonly settingsError = signal<string | null>(null);
  protected readonly allPages = signal(true);
  protected readonly picked = signal<string[]>([]);
  protected readonly extra = signal('');

  protected readonly analytics = signal<OfferAnalytics | null>(null);
  protected readonly days = signal(30);
  protected readonly offerFilter = signal(0);
  protected readonly maxDay = computed(() => Math.max(1, ...(this.analytics()?.leads_by_day.map((d) => d.count) ?? [1])));

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['free_consultation', Validators.required],
    headline: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    benefitsText: [''],
    cta_text: ['Claim My Offer'],
    badge_text: [''],
    valid_from: [''],
    valid_until: [''],
    sort_order: [0],
    is_active: [true],
    show_popup: [true],
  });

  protected readonly sForm = this.fb.nonNullable.group({
    popup_enabled: [false],
    callback_enabled: [true],
    first_delay_seconds: [15, [Validators.required, Validators.min(0)]],
    second_delay_seconds: [120, [Validators.required, Validators.min(5)]],
    repeat_gap_seconds: [900, [Validators.required, Validators.min(30)]],
  });

  ngOnInit(): void {
    this.reload();
    this.svc.meta().subscribe({ next: (m) => this.meta.set(m), error: () => undefined });
    this.svc.settings().subscribe({ next: (s) => this.applySettings(s), error: () => undefined });
  }

  // ── offers ──────────────────────────────────────────────────────────────────

  private reload(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: (o) => { this.offers.set(o); this.loading.set(false); },
      error: (e: { message?: string }) => { this.loading.set(false); this.say(e?.message ?? 'Could not load offers.', true); },
    });
  }

  protected img(o: AdminOffer): string | null {
    return this.svc.imageUrl(o);
  }

  protected startNew(): void {
    this.form.reset({ name: '', type: 'free_consultation', headline: '', description: '', benefitsText: '', cta_text: 'Claim My Offer', badge_text: '', valid_from: '', valid_until: '', sort_order: 0, is_active: true, show_popup: true });
    this.resetImage();
    this.formError.set(null);
    this.editing.set('new');
  }

  protected edit(o: AdminOffer): void {
    this.form.reset({
      name: o.name, type: o.type, headline: o.headline, description: o.description, benefitsText: o.benefits.join('\n'), cta_text: o.cta_text,
      badge_text: o.badge_text ?? '', valid_from: toDateInput(o.valid_from), valid_until: toDateInput(o.valid_until), sort_order: o.sort_order, is_active: o.is_active, show_popup: o.show_popup,
    });
    this.resetImage();
    this.formError.set(null);
    this.editing.set(o);
  }

  protected cancel(): void {
    this.editing.set(null);
    this.resetImage();
  }

  private resetImage(): void {
    this.pendingFile = null;
    this.localPreview.set(null);
    this.removeExisting.set(false);
  }

  protected previewUrl(): string | null {
    const local = this.localPreview();
    if (local) return local;
    const e = this.editing();

    return e && e !== 'new' && !this.removeExisting() ? this.img(e) : null;
  }

  protected pickImage(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return void this.formError.set('Please choose a JPG, PNG or WebP image.');
    if (file.size > 2 * 1024 * 1024) return void this.formError.set('That image is larger than 2 MB.');
    this.formError.set(null);
    this.pendingFile = file;
    this.removeExisting.set(false);
    this.localPreview.set(URL.createObjectURL(file));
  }

  protected dropImage(): void {
    this.pendingFile = null;
    this.localPreview.set(null);
    this.removeExisting.set(true);
  }

  protected save(): void {
    this.formError.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) return void this.formError.set('Please fill in the name, headline and a description (at least 10 characters).');
    const f = this.form.getRawValue();
    const body: Partial<OfferInput> = {
      name: f.name.trim(), type: f.type, headline: f.headline.trim(), description: f.description.trim(),
      benefits: f.benefitsText.split('\n').map((b) => b.trim()).filter(Boolean).slice(0, 6),
      cta_text: f.cta_text.trim() || 'Claim My Offer', badge_text: f.badge_text.trim() || null,
      valid_from: f.valid_from || null, valid_until: f.valid_until || null, sort_order: Number(f.sort_order) || 0, is_active: f.is_active, show_popup: f.show_popup,
    };
    const current = this.editing();
    const existing = current && current !== 'new' ? current : null;

    this.busy.set(true);
    const call = existing ? this.svc.update(existing.id, body) : this.svc.create(body);
    call.subscribe({
      next: (saved) => this.afterSave(saved, existing !== null),
      error: (e: { message?: string; errors?: Record<string, string[]> }) => { this.busy.set(false); this.formError.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'The offer could not be saved.'); },
    });
  }

  /** The image is a separate upload, so it goes after the offer exists. */
  private afterSave(saved: AdminOffer, wasEdit: boolean): void {
    const done = (): void => { this.busy.set(false); this.editing.set(null); this.resetImage(); this.say(wasEdit ? 'Offer saved.' : 'Offer created.', false); this.reload(); };
    const fail = (e: { message?: string; errors?: Record<string, string[]> }): void => { this.busy.set(false); this.formError.set('The offer was saved, but the image failed: ' + (Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'please try again.')); this.reload(); };
    if (this.pendingFile) this.svc.uploadImage(saved.id, this.pendingFile).subscribe({ next: done, error: fail });
    else if (this.removeExisting()) this.svc.removeImage(saved.id).subscribe({ next: done, error: fail });
    else done();
  }

  protected toggleActive(o: AdminOffer): void {
    this.svc.update(o.id, { is_active: !o.is_active }).subscribe({
      next: () => { this.say(o.is_active ? 'Offer deactivated — its page and popup are off.' : 'Offer activated.', false); this.reload(); },
      error: (e: { message?: string }) => this.say(e?.message ?? 'Could not update.', true),
    });
  }

  protected remove(o: AdminOffer): void {
    if (!confirm(`Remove “${o.name}”? Its page and popup stop working. Leads it already brought in are kept.`)) return;
    this.svc.remove(o.id).subscribe({ next: () => { this.say('Offer removed.', false); this.reload(); }, error: (e: { message?: string }) => this.say(e?.message ?? 'Could not remove.', true) });
  }

  protected copyLink(o: AdminOffer): void {
    const url = `${location.origin}/offers/${o.slug}`;
    navigator.clipboard?.writeText(url).then(() => this.say('Link copied: ' + url, false), () => this.say(url, false));
  }

  // ── popup settings ──────────────────────────────────────────────────────────

  private applySettings(s: OfferSettings): void {
    this.settings.set(s);
    this.sForm.reset({ popup_enabled: s.popup_enabled, callback_enabled: s.callback_enabled, first_delay_seconds: s.first_delay_seconds, second_delay_seconds: s.second_delay_seconds, repeat_gap_seconds: s.repeat_gap_seconds });
    const all = s.pages.length === 0 || s.pages.includes('*');
    this.allPages.set(all);
    const known = new Set(KNOWN_PAGES.flatMap((p) => p.patterns));
    this.picked.set(all ? [] : s.pages.filter((p) => known.has(p)));
    this.extra.set(all ? '' : s.pages.filter((p) => !known.has(p)).join(', '));
  }

  protected setAllPages(on: boolean): void {
    this.allPages.set(on);
  }

  protected isPicked(patterns: string[]): boolean {
    return patterns.every((p) => this.picked().includes(p));
  }

  protected pick(patterns: string[], on: boolean): void {
    this.picked.update((cur) => (on ? Array.from(new Set([...cur, ...patterns])) : cur.filter((p) => !patterns.includes(p))));
  }

  protected saveSettings(): void {
    this.settingsError.set(null);
    const f = this.sForm.getRawValue();
    const r = this.settings()?.ranges;
    const within = (v: number, x?: [number, number]): boolean => !x || (Number.isFinite(v) && v >= x[0] && v <= x[1]);
    if (this.sForm.invalid || !within(+f.first_delay_seconds, r?.first) || !within(+f.second_delay_seconds, r?.second) || !within(+f.repeat_gap_seconds, r?.repeat)) {
      return void this.settingsError.set(`Seconds must be within: first ${r?.first[0]}–${r?.first[1]}, second ${r?.second[0]}–${r?.second[1]}, repeat ${r?.repeat[0]}–${r?.repeat[1]}.`);
    }
    const extra = this.extra().split(',').map((p) => p.trim()).filter(Boolean);
    const pages = this.allPages() ? [] : [...this.picked(), ...extra];
    if (!this.allPages() && pages.length === 0) return void this.settingsError.set('Choose at least one page, or tick “All website pages”.');

    this.busy.set(true);
    this.svc.saveSettings({ popup_enabled: f.popup_enabled, callback_enabled: f.callback_enabled, first_delay_seconds: Number(f.first_delay_seconds), second_delay_seconds: Number(f.second_delay_seconds), repeat_gap_seconds: Number(f.repeat_gap_seconds), pages }).subscribe({
      next: (s) => { this.busy.set(false); this.applySettings(s); this.say('Popup settings saved.', false); },
      error: (e: { message?: string; errors?: Record<string, string[]> }) => { this.busy.set(false); this.settingsError.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'Could not save the settings.'); },
    });
  }

  // ── analytics ───────────────────────────────────────────────────────────────

  protected loadAnalytics(): void {
    const to = new Date();
    const from = new Date(Date.now() - (this.days() - 1) * 86400000);
    const iso = (d: Date): string => d.toISOString().slice(0, 10);
    this.analytics.set(null);
    this.svc.analytics({ from: iso(from), to: iso(to), offer_id: this.offerFilter() || undefined }).subscribe({
      next: (a) => this.analytics.set(a),
      error: (e: { message?: string }) => this.say(e?.message ?? 'Could not load analytics.', true),
    });
  }

  protected pct(v: number | null): string {
    return v === null ? '—' : `${v}%`;
  }

  protected share(n: number, total: number): number {
    return total > 0 ? Math.round((n / total) * 100) : 0;
  }

  private say(text: string, err: boolean): void {
    this.message.set({ text, err });
    setTimeout(() => this.message.set(null), 5000);
  }
}
