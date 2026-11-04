import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Channel, CommunicationPrefs, EventKey, MarketingKey } from '@core/models/customer-profile.model';
import { AuthService } from '@core/services/auth.service';
import { CustomerProfileService } from '@core/services/customer-profile.service';

import { ProfileHeadComponent } from './profile-head.component';

const EVENTS: { key: EventKey; label: string; text: string; icon: string; tone: string }[] = [
  { key: 'payment_reminders', label: 'Payment Reminders', text: 'Get reminders before your EMI due date.', icon: 'event', tone: 'blue' },
  { key: 'payment_confirmations', label: 'Payment Confirmations', text: 'Receive confirmation after successful payments.', icon: 'check_circle', tone: 'green' },
  { key: 'disbursal_updates', label: 'Loan Disbursal Updates', text: 'Get notified about loan disbursal status.', icon: 'description', tone: 'blue' },
  { key: 'application_updates', label: 'Application Status Updates', text: 'Receive updates on your loan application.', icon: 'assignment', tone: 'purple' },
  { key: 'account_alerts', label: 'Important Account Alerts', text: 'Get notified about important account activities.', icon: 'notifications_active', tone: 'orange' },
];
const MARKETING: { key: MarketingKey; label: string; icon: string }[] = [
  { key: 'exclusive_offers', label: 'Exclusive Loan Offers', icon: 'local_offer' },
  { key: 'education_tips', label: 'Financial Education & Tips', icon: 'school' },
  { key: 'product_updates', label: 'New Product Updates', icon: 'campaign' },
  { key: 'festive_offers', label: 'Festive Offers & Deals', icon: 'redeem' },
  { key: 'surveys', label: 'Surveys & Feedback Requests', icon: 'rate_review' },
];
const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'email', label: 'Email' }, { key: 'sms', label: 'SMS' }, { key: 'whatsapp', label: 'WhatsApp' }, { key: 'in_app', label: 'In-App' },
];
const LANGS = [{ v: 'en', l: 'English' }, { v: 'hi', l: 'Hindi' }, { v: 'mr', l: 'Marathi' }];

/** Communication Preferences — layout follows images/12_Dashboard/05_Profile_Settings/06_Communication.png. */
@Component({
  selector: 'app-profile-communication',
  standalone: true,
  imports: [ProfileHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-profile-head title="Communication Preferences" subtitle="Choose how you want to receive updates, alerts and important information from Finoocean."
      [crumbs]="[{ label: 'Profile', link: '/account/profile' }, { label: 'Communication Preferences' }]"
      secureTitle="Stay informed, always!" secureText="Get important updates about your loans, payments and exclusive offers through your preferred channels." />

    <nav class="tabs" aria-label="Sections">
      <button type="button" [class.on]="tab() === 'n'" (click)="go('n', 'sec-n')">Notification Preferences</button>
      <button type="button" [class.on]="tab() === 'm'" (click)="go('m', 'sec-m')">Marketing Preferences</button>
      <button type="button" [class.on]="tab() === 'l'" (click)="go('l', 'sec-l')">Preferred Language</button>
      <button type="button" (click)="history()">Communication History</button>
    </nav>

    @if (error()) {
      <div class="fw-alert fw-alert--error" role="alert">{{ error() }} <button class="link" type="button" (click)="load()">Retry</button></div>
    } @else if (!p()) {
      <div class="fw-skeleton" style="height:300px"></div>
    } @else {
      @if (p(); as prefs) {
        <div class="top">
          <section class="panel" id="sec-n">
            <h2>Transaction &amp; Loan Notifications</h2><p class="sub">Stay updated with important information about your loans and payments.</p>
            <div class="mx" role="table" aria-label="Notification channels">
              <div class="mx__h" role="row"><span></span>@for (c of channels; track c.key) { <b role="columnheader">{{ c.label }}</b> }</div>
              @for (e of events; track e.key) {
                <div class="mx__r" role="row">
                  <div class="ev"><span [class]="'ei ei--' + e.tone"><span class="material-icons">{{ e.icon }}</span></span><div><b>{{ e.label }}</b><small>{{ e.text }}</small></div></div>
                  @for (c of channels; track c.key) {
                    <span role="cell"><button type="button" role="switch" class="sw" [class.on]="prefs.events[e.key][c.key]" [attr.aria-checked]="prefs.events[e.key][c.key]" [attr.aria-label]="e.label + ' by ' + c.label" (click)="toggleEvent(e.key, c.key)"><i></i></button></span>
                  }
                </div>
              }
            </div>

            <!-- Phones: one card per notification with all four channels as tap chips (no sideways scrolling). -->
            <div class="mc">
              <div class="mc__all" role="group" aria-label="Turn a channel on or off for everything">
                <small>Quick set</small>
                @for (c of channels; track c.key) {
                  <button type="button" class="chip chip--all" [class.on]="channelAll(prefs, c.key)" [attr.aria-pressed]="channelAll(prefs, c.key)" (click)="toggleChannel(c.key)"><span class="material-icons" aria-hidden="true">{{ icons[c.key] }}</span>All {{ c.label }}</button>
                }
              </div>
              @for (e of events; track e.key) {
                <div class="mc__card">
                  <div class="ev"><span [class]="'ei ei--' + e.tone"><span class="material-icons">{{ e.icon }}</span></span><div><b>{{ e.label }}</b><small>{{ e.text }}</small></div></div>
                  <div class="mc__chips">
                    @for (c of channels; track c.key) {
                      <button type="button" class="chip" [class.on]="prefs.events[e.key][c.key]" [attr.aria-pressed]="prefs.events[e.key][c.key]" [attr.aria-label]="e.label + ' by ' + c.label" (click)="toggleEvent(e.key, c.key)"><span class="material-icons" aria-hidden="true">{{ prefs.events[e.key][c.key] ? 'check' : icons[c.key] }}</span>{{ c.label }}</button>
                    }
                  </div>
                </div>
              }
            </div>
          </section>

          <section class="panel contact">
            <div class="ph"><h2>Your Contact Information</h2></div>
            <div class="ci"><span class="material-icons">phone</span><b>{{ auth.user()?.phone ? '+91 ' + auth.user()?.phone : 'No mobile number' }}</b></div>
            <div class="ci"><span class="material-icons">mail_outline</span><b>{{ auth.user()?.email }}</b></div>
            <div class="ci"><span class="material-icons">chat</span><b>{{ auth.user()?.phone ? '+91 ' + auth.user()?.phone : 'No WhatsApp number' }}</b></div>
            <button type="button" class="link" (click)="editContact()">Edit contact details →</button>
            <div class="promo"><span class="material-icons bell">notifications_active</span><div><p class="script" aria-hidden="true">Never miss an<br />important update!</p><small>Get real-time alerts about your loans, payments and exclusive offers.</small></div></div>
          </section>
        </div>

        <div class="bottom">
          <section class="panel" id="sec-m">
            <h2>Marketing &amp; Promotional Communications</h2><p class="sub">Choose what type of promotional content you would like to receive.</p>
            @for (m of marketing; track m.key) {
              <div class="mrow"><span class="material-icons">{{ m.icon }}</span><b>{{ m.label }}</b>
                <button type="button" role="switch" class="sw" [class.on]="prefs.marketing[m.key]" [attr.aria-checked]="prefs.marketing[m.key]" [attr.aria-label]="m.label" (click)="toggleMarketing(m.key)"><i></i></button></div>
            }
          </section>

          <section class="panel" id="sec-l">
            <h2>Preferred Language</h2><p class="sub">Choose the language for communication.</p>
            @for (l of langs; track l.v) { <label class="radio"><input type="radio" name="lang" [checked]="lang() === l.v" (change)="lang.set(l.v)" />{{ l.l }}</label> }
            <button type="button" class="fw-btn fw-btn--ghost fw-btn--block" [disabled]="lang() === prefs.language" (click)="saveLanguage()">Update Language</button>
          </section>

        </div>

        <div class="foot">
          <div class="note"><span class="material-icons">check_circle</span><div><b>Your Preferences are Saved</b><small>Changes are saved as soon as you make them. We respect your privacy and will only send you relevant and important information.</small></div></div>
          <div class="note note--blue"><span class="material-icons">lock</span><div><b>Your data is secure with us.</b><small>We never share your information with third parties without your consent.</small></div></div>
        </div>
      }
    }

    @if (toast(); as t) { <div class="toast" [class.toast--err]="t.err" role="status">{{ t.text }}</div> }
  `,
  styles: [
    `
      .top { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr); gap: 16px; margin-bottom: 16px; align-items: start; }
      .bottom { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; align-items: start; }
      .mx { display: grid; gap: 2px; margin-top: 6px; overflow-x: auto; } .mx__h, .mx__r { display: grid; grid-template-columns: minmax(220px, 2.4fr) repeat(4, minmax(56px, 1fr)); align-items: center; gap: 6px; min-width: 520px; }
      .mx__h { font-size: 0.74rem; color: var(--fw-muted); text-align: center; } .mx__r { padding: 10px 0; border-top: 1px solid var(--fw-line); } .mx__r > span { display: grid; justify-items: center; }
      .mc { display: none; }
      .chip { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; padding: 0 10px; border-radius: 999px; border: 1.5px solid var(--fw-line-strong); background: #fff; color: var(--fw-muted); font: 500 0.82rem Poppins, sans-serif; cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s; }
      .chip .material-icons { font-size: 18px; } .chip.on { background: var(--fw-blue); border-color: var(--fw-blue); color: #fff; } .chip:focus-visible { outline: 2px solid rgba(28, 109, 240, 0.55); outline-offset: 2px; }
      .mc__all { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px 0 12px; } .mc__all small { grid-column: 1 / -1; color: var(--fw-muted); font-size: 0.74rem; } .chip--all { min-height: 36px; font-size: 0.78rem; }
      .mc__card { display: grid; gap: 10px; padding: 12px; margin-top: 10px; border: 1px solid var(--fw-line); border-radius: 14px; background: #fff; } .mc__chips { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .ev { display: flex; gap: 10px; align-items: center; } .ev div { display: grid; line-height: 1.3; } .ev b { font-size: 0.86rem; } .ev small { color: var(--fw-muted); font-size: 0.72rem; }
      .ei { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; flex: none; background: #dbeafe; color: #1d4ed8; } .ei--green { background: #dcfce7; color: #15803d; } .ei--purple { background: #ede9fe; color: #6d28d9; } .ei--orange { background: #ffedd5; color: #c2410c; }
      .contact .ci { display: flex; gap: 10px; align-items: center; padding: 10px 0; border-top: 1px solid var(--fw-line); font-size: 0.86rem; overflow-wrap: anywhere; } .contact .ci:nth-of-type(1) { border-top: 0; } .ci .material-icons { color: var(--fw-blue); }
      .promo { display: flex; gap: 12px; align-items: center; margin-top: 12px; background: linear-gradient(135deg, #eaf2ff, #dbe8fb); border-radius: 12px; padding: 12px; } .promo .bell { font-size: 44px; color: #f59e0b; } .promo .script { font-family: Lora, serif; font-style: italic; font-size: 1.05rem; line-height: 1.25; margin: 0 0 4px; color: var(--fw-navy-2); } .promo small { color: var(--fw-muted); font-size: 0.74rem; }
      .mrow { display: flex; gap: 10px; align-items: center; padding: 10px 0; border-top: 1px solid var(--fw-line); font-size: 0.86rem; } .mrow:first-of-type { border-top: 0; } .mrow .material-icons { color: var(--fw-blue); } .mrow b { flex: 1; font-weight: 500; }
      .radio { display: flex; gap: 10px; align-items: center; padding: 8px 0; font-size: 0.9rem; cursor: pointer; } .radio + .fw-btn, .radio:last-of-type { margin-bottom: 8px; }
      .foot { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } .note--blue { background: var(--fw-blue-soft); border-color: #dbe8fb; } .note--blue > .material-icons { color: var(--fw-blue); }
      @media (max-width: 1280px) { .top { grid-template-columns: minmax(0, 1fr); } }
      @media (max-width: 800px) { .bottom, .foot { grid-template-columns: minmax(0, 1fr); } }
      @media (max-width: 640px) { .mx { display: none; } .mc { display: block; } }
    `,
  ],
  styleUrls: ['../../website/website-ui.scss', './profile.scss'],
})
export class ProfileCommunicationComponent {
  private readonly svc = inject(CustomerProfileService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly events = EVENTS;
  protected readonly marketing = MARKETING;
  protected readonly channels = CHANNELS;
  protected readonly langs = LANGS;
  protected readonly icons: Record<Channel, string> = { email: 'mail_outline', sms: 'sms', whatsapp: 'chat', in_app: 'notifications_none' };

  protected readonly p = signal<CommunicationPrefs | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly tab = signal<'n' | 'm' | 'l'>('n');
  protected readonly lang = signal('en');
  protected readonly toast = signal<{ text: string; err: boolean } | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.svc.communication().subscribe({
      next: (p) => this.set(p),
      error: (e: { message?: string }) => this.error.set(e?.message ?? 'We could not load your preferences.'),
    });
  }

  private set(p: CommunicationPrefs): void {
    this.p.set(p);
    this.lang.set(p.language);
  }

  protected go(t: 'n' | 'm' | 'l', id: string): void {
    this.tab.set(t);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected history(): void {
    void this.router.navigateByUrl('/account/notifications');
  }

  protected editContact(): void {
    void this.router.navigateByUrl('/account/profile');
  }

  /** Switches update on screen at once and are saved straight away; a failed save puts the switch back. */
  protected toggleEvent(e: EventKey, c: Channel): void {
    const cur = this.p();
    if (!cur) return;
    const next = !cur.events[e][c];
    this.p.set({ ...cur, events: { ...cur.events, [e]: { ...cur.events[e], [c]: next } } });
    this.save({ events: { [e]: { [c]: next } } } as Partial<CommunicationPrefs>, cur);
  }

  /** True when every notification is on for that channel. */
  protected channelAll(prefs: CommunicationPrefs, c: Channel): boolean {
    return EVENTS.every((e) => prefs.events[e.key][c]);
  }

  /** One tap sets a whole channel: all on, or (when already all on) all off. */
  protected toggleChannel(c: Channel): void {
    const cur = this.p();
    if (!cur) return;
    const on = !this.channelAll(cur, c);
    const events = Object.fromEntries(EVENTS.map((e) => [e.key, { ...cur.events[e.key], [c]: on }])) as CommunicationPrefs['events'];
    this.p.set({ ...cur, events });
    this.save({ events: Object.fromEntries(EVENTS.map((e) => [e.key, { [c]: on }])) } as Partial<CommunicationPrefs>, cur);
  }

  protected toggleMarketing(m: MarketingKey): void {
    const cur = this.p();
    if (!cur) return;
    const next = !cur.marketing[m];
    this.p.set({ ...cur, marketing: { ...cur.marketing, [m]: next } });
    this.save({ marketing: { [m]: next } } as Partial<CommunicationPrefs>, cur);
  }

  protected saveLanguage(): void {
    const cur = this.p();
    if (!cur) return;
    this.save({ language: this.lang() }, cur, 'Language updated.');
  }

  private save(body: Partial<CommunicationPrefs>, previous: CommunicationPrefs, text = 'Preference saved.'): void {
    this.svc.saveCommunication(body).subscribe({
      next: (p) => { this.set(p); this.flash(text, false); },
      error: (e: { message?: string }) => { this.set(previous); this.flash(e?.message ?? 'We could not save that. Please try again.', true); },
    });
  }

  private flash(text: string, err: boolean): void {
    this.toast.set({ text, err });
    setTimeout(() => this.toast.set(null), 2500);
  }
}
