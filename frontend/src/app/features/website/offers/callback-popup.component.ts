import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, effect, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { OfferService } from '@core/services/offer.service';

import { visitorId } from './offer-storage';
import { OfferPopupService } from './offer-popup.service';

const NAME_RE = /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ .'\-]*$/;

/**
 * The small "share your details" modal a guest sees the first time they open the website. It asks only for name, mobile and
 * city for the team to keep on file; they go straight to the telecaller Customer Inquiries queue.
 * (When it appears is decided by OfferPopupService.)
 */
@Component({
  selector: 'app-callback-popup',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (popup.callbackOpen()) {
      <div class="ov" (click)="popup.closeCallback()">
        <div class="card" role="dialog" aria-modal="true" aria-labelledby="cb-title" (click)="$event.stopPropagation()" #dialog>
          <button type="button" class="x" (click)="popup.closeCallback()" aria-label="Close"><span class="material-icons">close</span></button>

          @if (done()) {
            <div class="done" role="status">
              <span class="tick material-icons">check_circle</span>
              <h2 id="cb-title">Thank you!</h2>
              <p>We have your details. Our team will get in touch with you.</p>
              <button type="button" class="go" (click)="popup.closeCallback()">Continue browsing</button>
            </div>
          } @else {
            <div class="head">
              <span class="ico material-icons">phone_in_talk</span>
              <div><h2 id="cb-title">Share your details</h2><p>Leave your name, number and city so our team can get in touch with you.</p></div>
            </div>
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
              <div class="f"><label for="cb-name">Full name</label>
                <input id="cb-name" formControlName="name" autocomplete="name" maxlength="100" [class.bad]="bad('name')" />
                @if (bad('name')) { <small>{{ msg('name') || 'Enter your name (letters only).' }}</small> }</div>
              <div class="f"><label for="cb-phone">Mobile number</label>
                <input id="cb-phone" type="tel" inputmode="tel" formControlName="phone" autocomplete="tel" placeholder="10-digit mobile number" (blur)="tidyPhone()" [class.bad]="bad('phone')" />
                @if (bad('phone')) { <small>{{ msg('phone') || 'Enter a valid 10-digit mobile number.' }}</small> }</div>
              <div class="f"><label for="cb-city">City</label>
                <input id="cb-city" formControlName="city" autocomplete="address-level2" maxlength="100" [class.bad]="bad('city')" />
                @if (bad('city')) { <small>{{ msg('city') || 'Enter your city (letters only).' }}</small> }</div>
              <div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" tabindex="-1" autocomplete="off" formControlName="website" /></label></div>
              <label class="chk"><input type="checkbox" formControlName="privacy" />
                <span>I agree to FINOOCEAN keeping these details and contacting me on this number. See the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>
              @if (bad('privacy')) { <small class="pv">Please tick this so we can keep your details.</small> }
              <button type="submit" class="go" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Submit' }} <span class="material-icons">send</span></button>
              <button type="button" class="later" (click)="popup.closeCallback()">Not now</button>
            </form>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .ov { position: fixed; inset: 0; z-index: 91; display: grid; place-items: center; padding: 16px; background: rgba(6, 26, 61, 0.6); backdrop-filter: blur(3px); animation: fade 0.25s ease both; overflow-y: auto; }
      .card { position: relative; width: min(420px, 100%); background: #fff; border-radius: 20px; padding: 24px 22px 18px; box-shadow: 0 26px 70px rgba(0, 0, 0, 0.38); animation: pop 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.15) both; font-family: Poppins, system-ui, sans-serif; color: #10213a; }
      .x { position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%; border: 0; background: rgba(16, 33, 58, 0.08); color: #10213a; cursor: pointer; display: grid; place-items: center; } .x:hover { background: rgba(16, 33, 58, 0.16); }
      .head { display: flex; gap: 12px; align-items: center; padding-right: 30px; margin-bottom: 14px; } .ico { flex: 0 0 auto; width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; color: #fff; font-size: 26px; background: linear-gradient(135deg, #1c6df0, #0d3a75); }
      h2 { margin: 0; font-size: 1.15rem; line-height: 1.25; color: #0a2f66; } .head p { margin: 3px 0 0; font-size: 0.82rem; color: #4b5b73; line-height: 1.4; }
      form { display: grid; gap: 10px; } .f { display: grid; gap: 4px; } label { font-size: 0.8rem; font-weight: 500; }
      input:not([type=checkbox]) { border: 1px solid #b9c4d6; border-radius: 10px; padding: 10px 12px; font: 400 0.92rem Poppins, sans-serif; width: 100%; box-sizing: border-box; color: #10213a; background: #fff; } input:focus { outline: 2px solid rgba(28, 109, 240, 0.45); border-color: #1c6df0; } input.bad { border-color: #dc2626; }
      small { color: #b91c1c; font-size: 0.74rem; } .pv { margin-top: -4px; }
      .chk { display: flex; gap: 8px; align-items: flex-start; font-size: 0.76rem; font-weight: 400; color: #4b5b73; line-height: 1.4; } .chk input { margin-top: 2px; width: 16px; height: 16px; flex: 0 0 auto; } .chk a { color: #1c6df0; }
      .hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
      .err { background: #fde8e8; color: #991b1b; border-radius: 10px; padding: 8px 12px; font-size: 0.82rem; }
      .go { display: inline-flex; gap: 8px; align-items: center; justify-content: center; border: 0; border-radius: 12px; padding: 12px 18px; font: 600 0.95rem Poppins, sans-serif; color: #fff; cursor: pointer; background: linear-gradient(135deg, #1c6df0, #0d3a75); box-shadow: 0 8px 20px rgba(28, 109, 240, 0.38); } .go:disabled { opacity: 0.65; cursor: wait; } .go .material-icons { font-size: 19px; } .go:focus-visible, .later:focus-visible, .x:focus-visible { outline: 3px solid rgba(28, 109, 240, 0.55); outline-offset: 2px; }
      .later { background: none; border: 0; color: #5b6b82; font: 500 0.82rem Poppins, sans-serif; cursor: pointer; text-decoration: underline; padding: 2px; }
      .done { display: grid; gap: 8px; justify-items: center; text-align: center; padding: 14px 6px 4px; } .done p { margin: 0; color: #4b5b73; font-size: 0.9rem; } .tick { font-size: 56px; color: #16a34a; }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } } @keyframes pop { from { opacity: 0; transform: translateY(20px) scale(0.94); } to { opacity: 1; transform: none; } }
      @media (prefers-reduced-motion: reduce) { .ov, .card { animation: none !important; } }
    `,
  ],
})
export class CallbackPopupComponent implements OnDestroy {
  protected readonly popup = inject(OfferPopupService);
  private readonly offers = inject(OfferService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private lockedScroll = false;
  private openedAt = 0;

  protected readonly busy = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(NAME_RE)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(NAME_RE)]],
    website: [''],
    privacy: [false, Validators.requiredTrue],
  });

  constructor() {
    effect(() => {
      if (this.popup.callbackOpen()) {
        this.openedAt = Date.now();
        document.body.style.overflow = 'hidden';
        this.lockedScroll = true;
        setTimeout(() => this.dialog()?.nativeElement.querySelector<HTMLElement>('#cb-name')?.focus(), 60);
      } else if (this.lockedScroll) {
        document.body.style.overflow = '';
        this.lockedScroll = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.lockedScroll) document.body.style.overflow = '';
  }

  protected bad(name: 'name' | 'phone' | 'city' | 'privacy'): boolean {
    const c = this.form.controls[name];

    return (c.invalid && (c.touched || c.dirty)) || !!this.serverErrors()[name === 'privacy' ? 'privacy_consent' : name];
  }

  protected msg(name: string): string {
    return this.serverErrors()[name] ?? '';
  }

  /** Drops +91 / 0 / spaces so people can paste a number as they have it. */
  protected tidyPhone(): void {
    const c = this.form.controls.phone;
    const digits = c.value.replace(/[\s\-()]+/g, '').replace(/^(\+?91|0)(?=[6-9]\d{9}$)/, '');
    if (digits !== c.value) c.setValue(digits);
  }

  protected submit(): void {
    this.tidyPhone();
    this.form.markAllAsTouched();
    this.serverErrors.set({});
    if (this.busy()) return;
    if (this.form.invalid) {
      this.error.set('Please fix the highlighted fields.');
      return;
    }
    this.error.set(null);
    this.busy.set(true);
    const f = this.form.getRawValue();
    this.offers
      .callback({ name: f.name.trim(), phone: f.phone, city: f.city.trim(), privacy_consent: true, website: f.website, visitor_id: visitorId(), elapsed_ms: Date.now() - this.openedAt })
      .subscribe({
        next: () => { this.busy.set(false); this.done.set(true); },
        error: (e: { status?: number; message?: string; errors?: Record<string, string[]> }) => {
          this.busy.set(false);
          if (e?.status === 429) {
            this.error.set('Too many requests from this device. Please try again a little later.');
            return;
          }
          const map: Record<string, string> = {};
          for (const [k, v] of Object.entries(e?.errors ?? {})) map[k] = v[0];
          this.serverErrors.set(map);
          this.error.set(Object.keys(map).length ? 'Please fix the highlighted fields.' : e?.message ?? 'We could not send your request. Please try again.');
        },
      });
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(e: KeyboardEvent): void {
    if (!this.popup.callbackOpen()) return;
    if (e.key === 'Escape') {
      this.popup.closeCallback();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = Array.from(this.dialog()?.nativeElement.querySelectorAll<HTMLElement>('button, a[href], input:not([tabindex="-1"])') ?? []);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}
