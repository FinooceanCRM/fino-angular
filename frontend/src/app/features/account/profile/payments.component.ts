import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { UpiId } from '@core/models/customer-profile.model';
import { CustomerProfileService } from '@core/services/customer-profile.service';

import { WEBSITE } from '../../website/website.config';
import { ProfileHeadComponent } from './profile-head.component';

const VPA = /^[a-zA-Z0-9._\-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,32}$/;
type Tab = 'upi' | 'cards' | 'netbanking' | 'wallets' | 'nach';
type Brand = 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'upi';

/** UPI & Payment Methods — layout follows images/12_Dashboard/05_Profile_Settings/05_UPI_Payments.png. */
@Component({
  selector: 'app-profile-payments',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, ProfileHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-profile-head title="UPI & Payment Methods" subtitle="Manage your UPI IDs, cards and other payment methods for seamless and secure transactions."
      [crumbs]="[{ label: 'Profile', link: '/account/profile' }, { label: 'UPI & Payment Methods' }]"
      secureTitle="Your payments are secure" secureText="We use bank-grade encryption to keep your payment information safe." />

    <nav class="seg" aria-label="Payment methods">
      @for (t of tabs; track t.key) { <button type="button" [class.on]="tab() === t.key" (click)="tab.set(t.key)">{{ t.label }}</button> }
    </nav>

    @if (error()) { <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div> }
    @if (msg(); as m) { <div class="fw-alert fw-alert--success" role="status">{{ m }}</div> }

    @if (tab() === 'upi') {
      <div class="cols">
        <section class="panel add">
          <h2>Add UPI ID</h2>
          <form [formGroup]="form" (ngSubmit)="add()" novalidate>
            <label for="u-vpa">Enter your UPI ID</label>
            <div class="vpa">
              <input id="u-vpa" class="in" formControlName="vpa" placeholder="yourname&#64;upi" autocomplete="off" autocapitalize="none" />
              <select aria-label="Choose a UPI handle" (change)="suffix($any($event.target).value); $any($event.target).value = ''">
                <option value="">&#64;…</option>
                @for (h of handles; track h) { <option [value]="h">{{ h }}</option> }
              </select>
            </div>
            @if (form.controls.vpa.invalid && (form.controls.vpa.touched || form.controls.vpa.dirty)) { <small class="err">Enter a valid UPI ID, like yourname&#64;okaxis.</small> }
            <div class="apps">
              @for (a of apps; track a.name) {
                <button type="button" (click)="suffix(a.suffix)" [attr.aria-label]="'Use a ' + a.name + ' handle'">
                  <span [class]="'logo logo--' + a.brand">{{ a.mark }}</span>{{ a.name }}
                </button>
              }
            </div>
            <button type="submit" class="fw-btn fw-btn--primary fw-btn--block" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save UPI ID' }}</button>
          </form>
          <div class="info"><h3><span class="material-icons">info</span> Important Information</h3>
            <ul>
              <li>Enter a valid UPI ID (e.g. yourname&#64;okaxis).</li>
              <li>We don’t send a ₹1 test payment yet, so a new ID shows as “Not verified”.</li>
              <li>Only add UPI IDs that belong to you.</li>
              <li>Make sure your UPI app is active.</li>
            </ul></div>
        </section>

        <section class="panel mine">
          <div class="ph"><h2>My UPI IDs</h2><button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="focusAdd()"><span class="material-icons">add</span>Add New</button></div>
          @for (u of ids(); track u.id) {
            <div class="row">
              <span [class]="'logo logo--lg logo--' + brand(u)">{{ mark(brand(u)) }}</span>
              <div class="row__t">
                <div class="row__l"><b>{{ u.vpa }}</b>
                  <span [class]="'pill pill--' + u.status">{{ u.status === 'verified' ? 'Verified' : 'Not verified' }}</span>
                  @if (u.is_primary) { <span class="pill pill--info">Primary</span> }</div>
                <small>{{ u.app }} · Added on {{ u.added_at | date: 'd MMM y' }}</small>
              </div>
              @if (!u.is_primary) { <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="primary(u)">Set as Primary</button> }
              <div class="kebab">
                <button type="button" class="kebab__b" (click)="toggleMenu(u.id, $event)" [attr.aria-label]="'More actions for ' + u.vpa" [attr.aria-expanded]="menu() === u.id"><span class="material-icons">more_vert</span></button>
                @if (menu() === u.id) { <div class="kebab__m" role="menu"><button type="button" role="menuitem" (click)="remove(u)"><span class="material-icons">delete_outline</span>Remove UPI ID</button></div> }
              </div>
            </div>
          } @empty { <p class="muted empty">No UPI IDs saved yet. Add one to pay EMIs faster.</p> }
        </section>

        <div class="stack">
          <section class="panel promo">
            <div><p class="script" aria-hidden="true">Fast. Simple.<br />Secure.</p>
              <ul><li><span class="material-icons">check_circle</span>Easy payments</li><li><span class="material-icons">check_circle</span>Instant confirmation</li><li><span class="material-icons">check_circle</span>Multiple UPI apps</li><li><span class="material-icons">check_circle</span>Safe &amp; secure</li></ul></div>
            <span class="phone" aria-hidden="true"><span class="material-icons">smartphone</span><span class="phone__b"><span class="material-icons">verified_user</span></span></span>
          </section>
          <section class="panel guide"><h3><span class="material-icons">lightbulb</span> UPI Payment Guidelines</h3>
            <ul><li>Use the same UPI ID that is linked to your bank account.</li><li>Ensure your UPI app is active on your device.</li><li>Do not share your UPI PIN with anyone.</li><li>In case of payment failure, the amount will be refunded automatically.</li><li>For any issues, contact our support team.</li></ul></section>
        </div>
      </div>
    } @else {
      <section class="panel soon">
        <span class="material-icons">{{ current().icon }}</span>
        <h2>{{ current().label }}</h2>
        <p class="sub">{{ current().text }}</p>
        <span class="pill pill--info">Coming soon</span>
        <button type="button" class="link" (click)="tab.set('upi')">Back to UPI</button>
      </section>
    }

    <h2 class="sect">Other Payment Methods</h2>
    <div class="other">
      <button type="button" class="oc" (click)="tab.set('cards')"><span class="oc__i"><span class="material-icons">credit_card</span></span><b>Debit / Credit Cards</b><small>Save and manage your cards for quick payments.</small><span class="fw-btn fw-btn--ghost fw-btn--sm">Add Card</span><em>Coming soon</em></button>
      <button type="button" class="oc" (click)="tab.set('netbanking')"><span class="oc__i"><span class="material-icons">account_balance</span></span><b>Net Banking</b><small>Pay securely using your bank account.</small><span class="fw-btn fw-btn--ghost fw-btn--sm">Manage</span><em>Coming soon</em></button>
      <button type="button" class="oc" (click)="tab.set('wallets')"><span class="oc__i"><span class="material-icons">account_balance_wallet</span></span><b>Wallets</b><small>Link your wallet for easy payments.</small><span class="fw-btn fw-btn--ghost fw-btn--sm">Add Wallet</span><em>Coming soon</em></button>
      <button type="button" class="oc" (click)="tab.set('nach')"><span class="oc__i"><span class="material-icons">autorenew</span></span><b>Auto-Debit (NACH)</b><small>Set up auto-debit for hassle-free EMI payments.</small><span class="fw-btn fw-btn--ghost fw-btn--sm">Set Up</span><em>Coming soon</em></button>
      <section class="secure2"><div class="secure2__h"><span class="material-icons">verified_user</span><div><b>Your payment details stay protected</b><small>UPI IDs are kept private to your account, and card or bank numbers are never shown in full.</small></div></div>
        <div class="badges"><span><span class="material-icons">lock</span>Private to you</span><span><span class="material-icons">visibility_off</span>Masked numbers</span><span><span class="material-icons">tune</span>You stay in control</span></div></section>
    </div>

    <section class="help"><span class="material-icons ic">phone</span>
      <div><b>Need Help with Payments?</b><small>Talk to our support team</small></div>
      <a class="call" [href]="site.phoneHref"><span class="material-icons">phone</span>{{ site.phone }}</a><small class="hrs">({{ site.hours }})</small>
      <a class="wa" [href]="site.whatsappHref" target="_blank" rel="noopener"><span class="material-icons">chat</span>Chat on WhatsApp</a>
      <a class="fw-btn fw-btn--ghost" routerLink="/account/profile/bank">View Payment History <span class="material-icons">arrow_forward</span></a></section>
  `,
  styles: [
    `
      /* Segmented tab bar: one joined strip, the active tab filled blue. */
      .seg { display: grid; grid-template-columns: repeat(5, 1fr); margin-bottom: 14px; background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; overflow: hidden; }
      .seg button { border: 0; border-left: 1px solid var(--fw-line); background: #fff; padding: 13px 8px; font: 600 0.88rem Poppins, sans-serif; color: var(--fw-navy); cursor: pointer; } .seg button:first-child { border-left: 0; }
      .seg button.on { background: var(--fw-blue); color: #fff; } .seg button:not(.on):hover { background: var(--fw-blue-soft); }

      .cols { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.35fr) minmax(0, 1fr); gap: 14px; margin-bottom: 14px; align-items: start; } .stack { display: grid; gap: 14px; }
      .panel h2 { font-size: 1.1rem; }
      form { display: grid; gap: 8px; } form label { font-size: 0.8rem; font-weight: 500; }
      .vpa { display: flex; border: 1.5px solid var(--fw-line-strong); border-radius: 10px; background: #fff; overflow: hidden; } .vpa:focus-within { border-color: var(--fw-blue); box-shadow: 0 0 0 3px rgba(28, 109, 240, 0.15); }
      .vpa .in { border: 0; box-shadow: none !important; flex: 1; min-width: 0; height: 42px; } .vpa select { border: 0; border-left: 1px solid var(--fw-line); background: #f7faff; padding: 0 8px; font: 500 0.8rem Poppins, sans-serif; color: var(--fw-navy); cursor: pointer; max-width: 96px; }
      .apps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; } .apps button { display: grid; justify-items: center; gap: 4px; background: none; border: 0; padding: 4px 0; font: 500 0.74rem Poppins, sans-serif; color: var(--fw-muted); cursor: pointer; } .apps button:hover { color: var(--fw-blue); }
      .info { background: var(--fw-blue-soft); border-radius: 12px; padding: 12px 14px; margin-top: 12px; } .info h3 { display: flex; gap: 6px; align-items: center; font-size: 0.95rem; margin: 0 0 6px; } .info .material-icons { color: var(--fw-blue); } .info ul, .guide ul { margin: 0; padding-left: 18px; display: grid; gap: 5px; font-size: 0.78rem; color: var(--fw-ink); }

      /* Round brand-style badges (drawn in CSS - no third-party logos). */
      .logo { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font: 700 0.78rem Poppins, sans-serif; color: #fff; background: #94a3b8; border: 1px solid var(--fw-line); flex: none; } .logo--lg { width: 46px; height: 46px; }
      .logo--gpay { background: #fff; background-image: conic-gradient(from -45deg, #ea4335 0 25%, #fbbc05 0 50%, #34a853 0 75%, #4285f4 0); -webkit-background-clip: text; background-clip: text; color: transparent; font-size: 1.5rem; border: 1px solid var(--fw-line); background-color: #fff; }
      .logo--phonepe { background: #5f259f; font-size: 1.1rem; } .logo--paytm { background: #fff; color: #00baf2; font-size: 0.66rem; letter-spacing: -0.3px; } .logo--bhim { background: #fff; color: #f97316; font-size: 1.2rem; } .logo--upi { background: #1c6df0; }

      .mine .ph { margin-bottom: 4px; } .row { display: flex; gap: 10px; align-items: center; padding: 12px 0; border-top: 1px solid var(--fw-line); } .row:first-of-type { border-top: 0; }
      .row__t { display: grid; gap: 2px; flex: 1; min-width: 0; } .row__l { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; } .row__l b { font-size: 0.88rem; white-space: nowrap; } .row__t small { color: var(--fw-muted); font-size: 0.74rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .kebab { position: relative; } .kebab__b { background: none; border: 0; cursor: pointer; color: var(--fw-muted); display: grid; padding: 4px; border-radius: 6px; } .kebab__b:hover { background: var(--fw-blue-soft); }
      .kebab__m { position: absolute; right: 0; top: 100%; z-index: 20; background: #fff; border: 1px solid var(--fw-line); border-radius: 10px; box-shadow: 0 10px 28px rgba(16, 33, 58, 0.18); padding: 4px; min-width: 168px; } .kebab__m button { display: flex; gap: 8px; align-items: center; width: 100%; background: none; border: 0; padding: 9px 10px; border-radius: 8px; cursor: pointer; font: 500 0.82rem Poppins, sans-serif; color: #b91c1c; } .kebab__m button:hover { background: #fef2f2; }
      .empty { margin: 8px 0; }

      .promo { background: linear-gradient(135deg, #eaf2ff, #dbe8fb); display: flex; justify-content: space-between; gap: 10px; align-items: center; } .promo .script { font-family: Lora, serif; font-style: italic; font-size: 1.3rem; line-height: 1.2; color: var(--fw-navy-2); margin: 0 0 8px; }
      .promo ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; font-size: 0.8rem; } .promo li { display: flex; gap: 8px; align-items: center; } .promo li .material-icons { color: #16a34a; font-size: 17px; }
      .phone { position: relative; flex: none; } .phone > .material-icons { font-size: 84px; color: var(--fw-blue); } .phone__b { position: absolute; right: -4px; bottom: 8px; background: #fff; border-radius: 50%; display: grid; place-items: center; width: 30px; height: 30px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18); } .phone__b .material-icons { font-size: 20px; color: #16a34a; }
      .guide h3 { display: flex; gap: 6px; align-items: center; } .guide h3 .material-icons { color: #f59e0b; }

      .soon { text-align: center; display: grid; justify-items: center; gap: 8px; padding: 30px 20px; margin-bottom: 14px; } .soon > .material-icons { font-size: 44px; color: var(--fw-blue); } .soon h2 { margin: 0; } .soon .sub { max-width: 440px; margin: 0; }

      .sect { margin: 4px 0 10px; font-size: 1.05rem; color: var(--fw-navy); }
      .other { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(0, 1.3fr); gap: 14px; margin-bottom: 14px; align-items: stretch; }
      .oc { display: grid; gap: 6px; align-content: start; justify-items: start; text-align: left; background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; padding: 14px; cursor: pointer; font-family: inherit; position: relative; } .oc:hover { border-color: var(--fw-blue); }
      .oc__i { width: 44px; height: 44px; border-radius: 12px; background: var(--fw-blue-soft); display: grid; place-items: center; } .oc__i .material-icons { color: var(--fw-blue); font-size: 28px; } .oc b { font-size: 0.9rem; color: var(--fw-navy); } .oc small { color: var(--fw-muted); font-size: 0.74rem; line-height: 1.35; flex: 1; }
      .oc .fw-btn { width: 100%; justify-content: center; margin-top: 4px; } .oc em { position: absolute; top: 10px; right: 10px; font-style: normal; font-size: 0.64rem; color: #1d4ed8; background: #dbeafe; border-radius: 6px; padding: 2px 7px; }
      .secure2 { background: #eefaf2; border: 1px solid #c9ecd5; border-radius: 14px; padding: 14px; display: grid; gap: 10px; align-content: start; } .secure2__h { display: flex; gap: 10px; } .secure2__h > .material-icons { color: #16a34a; font-size: 38px; } .secure2__h div { display: grid; line-height: 1.35; } .secure2__h small { color: var(--fw-muted); font-size: 0.74rem; }
      .badges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center; } .badges span { display: grid; justify-items: center; gap: 2px; font-size: 0.66rem; font-weight: 600; color: var(--fw-navy); } .badges .material-icons { color: var(--fw-blue); font-size: 22px; }

      .help { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; padding: 12px 18px; } .help .ic { color: #fff; background: var(--fw-blue); border-radius: 12px; padding: 9px; }
      .help > div { display: grid; line-height: 1.3; margin-right: 6px; } .help small { color: var(--fw-muted); font-size: 0.76rem; } .help .hrs { margin-right: auto; }
      .call, .wa { display: inline-flex; gap: 6px; align-items: center; text-decoration: none; font-weight: 600; font-size: 0.84rem; color: var(--fw-ink); } .call .material-icons { color: var(--fw-blue); font-size: 18px; } .wa { color: #15803d; } .wa .material-icons { color: #22c55e; font-size: 20px; }

      @media (max-width: 1280px) { .cols { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .cols .stack { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; } .other { grid-template-columns: repeat(2, minmax(0, 1fr)); } .secure2 { grid-column: 1 / -1; } }
      @media (max-width: 800px) { .cols, .cols .stack { grid-template-columns: minmax(0, 1fr); } .other { grid-template-columns: minmax(0, 1fr); } .seg { grid-template-columns: repeat(2, 1fr); } .seg button { border-top: 1px solid var(--fw-line); } .help .hrs { margin-right: 0; } }
    `,
  ],
  styleUrls: ['../../website/website-ui.scss', './profile.scss'],
})
export class ProfilePaymentsComponent {
  private readonly svc = inject(CustomerProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly site = WEBSITE;
  protected readonly tabs: { key: Tab; label: string }[] = [
    { key: 'upi', label: 'UPI' }, { key: 'cards', label: 'Cards' }, { key: 'netbanking', label: 'Net Banking' }, { key: 'wallets', label: 'Wallets' }, { key: 'nach', label: 'Auto-Debit (NACH)' },
  ];
  protected readonly apps: { name: string; suffix: string; brand: Brand; mark: string }[] = [
    { name: 'Google Pay', suffix: '@okaxis', brand: 'gpay', mark: 'G' },
    { name: 'PhonePe', suffix: '@ybl', brand: 'phonepe', mark: '₹' },
    { name: 'Paytm', suffix: '@paytm', brand: 'paytm', mark: 'paytm' },
    { name: 'BHIM', suffix: '@upi', brand: 'bhim', mark: '▶' },
  ];
  protected readonly handles = ['@okaxis', '@okhdfcbank', '@okicici', '@oksbi', '@ybl', '@ibl', '@axl', '@paytm', '@upi'];
  private readonly soonText: Record<Exclude<Tab, 'upi'>, { label: string; icon: string; text: string }> = {
    cards: { label: 'Debit / Credit Cards', icon: 'credit_card', text: 'Saving cards for quick payments isn’t available yet. For now, pay your EMI through UPI or your bank.' },
    netbanking: { label: 'Net Banking', icon: 'account_balance', text: 'Net banking payments aren’t available yet. You can pay through UPI in the meantime.' },
    wallets: { label: 'Wallets', icon: 'account_balance_wallet', text: 'Linking wallets isn’t available yet.' },
    nach: { label: 'Auto-Debit (NACH)', icon: 'autorenew', text: 'Auto-debit mandates will be set up with your lender when your loan is disbursed.' },
  };

  protected readonly tab = signal<Tab>('upi');
  protected readonly ids = signal<UpiId[]>([]);
  protected readonly menu = signal<number | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group({ vpa: ['', [Validators.required, Validators.pattern(VPA)]] });

  constructor() {
    this.svc.upiIds().subscribe({ next: (u) => this.ids.set(u), error: (e: { message?: string }) => this.error.set(e?.message ?? 'We could not load your UPI IDs.') });
  }

  /** Closes the "more actions" menu when the user clicks anywhere else. */
  @HostListener('document:click')
  protected closeMenu(): void {
    if (this.menu() !== null) this.menu.set(null);
  }

  protected current(): { label: string; icon: string; text: string } {
    const t = this.tab();
    return t === 'upi' ? this.soonText.cards : this.soonText[t];
  }

  protected brand(u: UpiId): Brand {
    return ({ 'Google Pay': 'gpay', PhonePe: 'phonepe', Paytm: 'paytm', BHIM: 'bhim' } as Record<string, Brand>)[u.app] ?? 'upi';
  }

  protected mark(b: Brand): string {
    return this.apps.find((a) => a.brand === b)?.mark ?? 'UPI';
  }

  protected suffix(s: string): void {
    if (!s) return;
    const base = this.form.controls.vpa.value.split('@')[0];
    this.form.controls.vpa.setValue(base + s);
    this.form.controls.vpa.markAsDirty();
  }

  protected focusAdd(): void {
    this.tab.set('upi');
    setTimeout(() => this.host.nativeElement.querySelector<HTMLInputElement>('#u-vpa')?.focus());
  }

  protected toggleMenu(id: number, e: Event): void {
    e.stopPropagation();
    this.menu.set(this.menu() === id ? null : id);
  }

  protected add(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.msg.set(null);
    this.svc.addUpi(this.form.controls.vpa.value.trim()).subscribe({
      next: (rows) => { this.busy.set(false); this.ids.set(rows); this.form.reset({ vpa: '' }); this.msg.set('UPI ID saved.'); },
      error: (e: { message?: string; errors?: Record<string, string[]> }) => { this.busy.set(false); this.error.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'We could not save the UPI ID.'); },
    });
  }

  protected primary(u: UpiId): void {
    this.svc.primaryUpi(u.id).subscribe({ next: (rows) => { this.ids.set(rows); this.msg.set('Primary UPI ID updated.'); }, error: (e: { message?: string }) => this.error.set(e?.message ?? 'Could not update.') });
  }

  protected remove(u: UpiId): void {
    this.menu.set(null);
    if (!confirm(`Remove ${u.vpa}?`)) return;
    this.svc.deleteUpi(u.id).subscribe({ next: (rows) => { this.ids.set(rows); this.msg.set('UPI ID removed.'); }, error: (e: { message?: string }) => this.error.set(e?.message ?? 'Could not remove.') });
  }
}
