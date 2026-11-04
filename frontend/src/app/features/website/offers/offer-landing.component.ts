import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PublicOffer } from '@core/models/offer.model';
import { AuthService } from '@core/services/auth.service';
import { OfferService } from '@core/services/offer.service';

import { PRODUCT_PAGES } from '../product-pages.data';
import { HScrollDirective } from '../shared/h-scroll.directive';
import { ELIG } from '../site-content.data';
import { WEBSITE } from '../website.config';
import { offerStore, visitorId } from './offer-storage';

const NAME = /^\p{L}[\p{L} .'\-]*$/u;
const PHONE = /^[6-9]\d{9}$/;

/** Turns what people type or paste (+91, spaces, dashes) into a plain 10-digit number. */
function cleanPhone(v: string): string {
  const d = (v ?? '').replace(/[\s\-()]+/g, '');

  return d.replace(/^(\+?91|0)(?=[6-9]\d{9}$)/, '');
}

/** The page a visitor lands on from the popup (or a shared link): the offer, why it is worth it, and the form. */
@Component({
  selector: 'app-offer-landing',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, HScrollDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state() === 'loading') {
      <section class="fw-container pad"><div class="fw-skeleton" style="height:260px;margin-bottom:16px"></div><div class="fw-skeleton" style="height:340px"></div></section>
    } @else if (state() === 'gone' || !offer()) {
      <section class="fw-container gone">
        <span class="material-icons">event_busy</span>
        <h1>This offer is no longer available</h1>
        <p>It may have ended or been replaced. You can still talk to us about your loan needs.</p>
        <div class="gone__btns"><a class="fw-btn fw-btn--primary" routerLink="/services">Explore Our Services</a><a class="fw-btn fw-btn--ghost" routerLink="/contact">Contact Us</a></div>
      </section>
    } @else {
      @if (offer(); as o) {
        <section class="hero">
          <div class="fw-container hero__in">
            <div class="hero__t">
              <nav class="crumbs" aria-label="Breadcrumb"><a routerLink="/">Home</a><span aria-hidden="true">›</span><span aria-current="page">Special Offer</span></nav>
              <span class="badge"><span class="material-icons">redeem</span>{{ o.badge_text || o.type_label }}</span>
              <h1>{{ o.headline }}</h1>
              <p class="lead">{{ o.description }}</p>
              @if (o.valid_until) { <p class="valid"><span class="material-icons">event</span>Offer valid until {{ o.valid_until | date: 'd MMM y' }}</p> }
              <a class="fw-btn fw-btn--primary hero__go" href="#claim" (click)="goToForm($event)">{{ o.cta_text }} <span class="material-icons">arrow_downward</span></a>
            </div>
            @if (image(); as src) { <img class="hero__img" [src]="src" alt="" /> } @else { <div class="hero__art" aria-hidden="true"><span class="material-icons">redeem</span></div> }
          </div>
        </section>

        <section class="fw-container main">
          <div class="info">
            @if (o.benefits.length) {
              <div class="panel">
                <h2>What you get</h2>
                <ul class="ben">@for (b of o.benefits; track b) { <li><span class="material-icons">check_circle</span>{{ b }}</li> }</ul>
              </div>
            }
            <div class="panel">
              <h2>Why people trust Finoocean</h2>
              <ul class="trust m-hscroll" appHScroll style="--m-bleed: 22px; --m-card-w: 72%">
                @for (t of trust; track t.label) { <li><span class="material-icons">{{ t.icon }}</span><span><b>{{ t.value }}</b><small>{{ t.label }}</small></span></li> }
                <li><span class="material-icons">lock</span><span><b>Your details are safe</b><small>Used only to contact you about this offer</small></span></li>
              </ul>
            </div>
          </div>

          <div class="formcard" id="claim">
            @if (done()) {
              <div class="done" role="status">
                <span class="tick material-icons">check_circle</span>
                <h2>Thank you, {{ firstName() }}!</h2>
                <p>Your request has been received. A member of our team will call you on <b>{{ masked() }}</b> shortly.</p>
                @if (reference()) { <p class="ref">Your reference: <b>{{ reference() }}</b></p> }
                <a class="fw-btn fw-btn--primary" routerLink="/services">Explore Our Services</a>
              </div>
            } @else {
              <h2>Claim your offer</h2>
              <p class="sub">Tell us how to reach you. It takes about a minute.</p>
              <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
                @if (error()) { <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div> }

                <div class="f"><label for="ol-name">Full Name <i>*</i></label>
                  <input id="ol-name" class="in" formControlName="name" autocomplete="name" maxlength="100" />
                  @if (bad('name')) { <small class="err">{{ server('name') || 'Please enter your name (letters only).' }}</small> }</div>

                <div class="f"><label for="ol-phone">Mobile Number <i>*</i></label>
                  <input id="ol-phone" class="in" type="tel" inputmode="tel" formControlName="phone" autocomplete="tel" placeholder="10-digit mobile number" (blur)="tidyPhone()" />
                  @if (bad('phone')) { <small class="err">{{ server('phone') || 'Enter a valid 10-digit mobile number.' }}</small> }</div>

                <div class="f"><label for="ol-email">Email Address <i>*</i></label>
                  <input id="ol-email" class="in" type="email" inputmode="email" formControlName="email" autocomplete="email" maxlength="191" />
                  @if (bad('email')) { <small class="err">{{ server('email') || 'Enter a valid email address.' }}</small> }</div>

                <div class="f"><label for="ol-city">City <i>*</i></label>
                  <input id="ol-city" class="in" formControlName="city" autocomplete="address-level2" maxlength="100" list="ol-cities" />
                  <datalist id="ol-cities">@for (c of cities; track c) { <option [value]="c"></option> }</datalist>
                  @if (bad('city')) { <small class="err">{{ server('city') || 'Please enter your city (letters only).' }}</small> }</div>

                <div class="f"><label for="ol-service">Interested Service <em>(optional)</em></label>
                  <select id="ol-service" class="in" formControlName="service"><option value="">Select a service</option>@for (p of products; track p.slug) { <option [value]="p.slug">{{ p.name }}</option> }</select></div>

                <div class="f"><label for="ol-msg">Additional Message <em>(optional)</em></label>
                  <textarea id="ol-msg" class="in" rows="3" formControlName="message" maxlength="500" placeholder="Anything you would like us to know?"></textarea>
                  <small class="count">{{ form.controls.message.value.length }}/500</small></div>

                <!-- Spam trap: invisible to people, tempting to bots. -->
                <div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" tabindex="-1" autocomplete="off" formControlName="website" /></label></div>

                <label class="chk"><input type="checkbox" formControlName="privacy" />
                  <span>I agree that Finoocean may contact me about this offer. I have read the <a routerLink="/privacy-policy" target="_blank" rel="noopener">Privacy Notice</a>. <i>*</i></span></label>
                @if (bad('privacy')) { <small class="err">{{ server('privacy_consent') || 'Please accept the privacy notice so we can contact you.' }}</small> }

                <label class="chk"><input type="checkbox" formControlName="marketing" />
                  <span>Also send me occasional updates and offers (optional — you can say no and still claim this offer).</span></label>

                <button type="submit" class="fw-btn fw-btn--primary fw-btn--block cta" [disabled]="busy()">{{ busy() ? 'Sending…' : o.cta_text }} <span class="material-icons">arrow_forward</span></button>
                <p class="note"><span class="material-icons">lock</span>We never sell your details. We use them only to get in touch about this offer.</p>
              </form>
            }
          </div>
        </section>
      }
    }
  `,
  styles: [
    `
      .pad { padding: 28px 20px; } .gone { text-align: center; display: grid; justify-items: center; gap: 10px; padding: 70px 20px; } .gone .material-icons { font-size: 60px; color: var(--fw-blue); } .gone h1 { margin: 0; font-size: 1.7rem; } .gone p { margin: 0; color: var(--fw-muted); max-width: 440px; } .gone__btns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
      .hero { background: linear-gradient(115deg, #061a3d 0%, #0a2f66 55%, #0d4a9a 100%); color: #fff; position: relative; overflow: hidden; } .hero::before { content: ''; position: absolute; width: 420px; height: 420px; right: -80px; top: -160px; border-radius: 50%; background: radial-gradient(circle, rgba(77, 196, 255, 0.3), transparent 70%); }
      .hero__in { position: relative; display: grid; grid-template-columns: 1.4fr 0.8fr; gap: 24px; align-items: center; padding-top: 28px; padding-bottom: 36px; }
      .crumbs { display: flex; gap: 8px; font-size: 0.78rem; color: #cfe0ff; margin-bottom: 14px; } .crumbs a { color: inherit; text-decoration: none; }
      .badge { display: inline-flex; gap: 6px; align-items: center; background: rgba(255, 193, 77, 0.18); color: #ffd166; border: 1px solid rgba(255, 209, 102, 0.5); padding: 5px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 12px; } .badge .material-icons { font-size: 18px; }
      h1 { margin: 0 0 10px; font-size: clamp(1.8rem, 4vw, 2.8rem); line-height: 1.12; } .lead { margin: 0 0 10px; font-size: 1rem; line-height: 1.65; color: #dbe8ff; max-width: 560px; } .valid { display: flex; gap: 6px; align-items: center; margin: 0; font-size: 0.86rem; color: #ffd166; } .valid .material-icons { font-size: 18px; }
      .hero__img { width: 100%; max-height: 260px; object-fit: cover; border-radius: 18px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35); } .hero__art { display: grid; place-items: center; height: 200px; border-radius: 18px; background: rgba(255, 255, 255, 0.08); } .hero__art .material-icons { font-size: 96px; color: #ffd166; }
      .main { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 24px; padding-top: 28px; padding-bottom: 40px; align-items: start; }
      .info { display: grid; gap: 18px; } .panel { background: #fff; border: 1px solid var(--fw-line); border-radius: 16px; padding: 22px; box-shadow: 0 2px 12px rgba(16, 33, 58, 0.05); } .panel h2, .formcard h2 { margin: 0 0 10px; font-size: 1.25rem; color: var(--fw-navy); }
      .ben, .trust { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; } .ben li { display: flex; gap: 10px; align-items: flex-start; font-size: 0.95rem; } .ben .material-icons { color: #16a34a; }
      .hero__go { display: none; margin-top: 16px; width: fit-content; }
      .trust { grid-template-columns: 1fr 1fr; } .trust li { display: flex; gap: 10px; align-items: center; background: var(--fw-blue-soft); border-radius: 12px; padding: 12px; } .trust .material-icons { color: var(--fw-blue); font-size: 28px; } .trust span:last-child { display: grid; line-height: 1.3; } .trust b { font-size: 0.9rem; } .trust small { color: var(--fw-muted); font-size: 0.74rem; }
      .formcard { background: #fff; border: 1px solid var(--fw-line); border-radius: 18px; padding: 24px; box-shadow: 0 14px 40px rgba(16, 33, 58, 0.12); position: sticky; top: 84px; } .sub { margin: 0 0 14px; color: var(--fw-muted); font-size: 0.88rem; }
      form { display: grid; gap: 12px; } .f { display: grid; gap: 4px; } .f label { font-size: 0.82rem; font-weight: 500; } .f label i { color: #dc2626; font-style: normal; } .f label em { color: var(--fw-muted); font-style: normal; font-weight: 400; font-size: 0.76rem; }
      .in { border: 1.5px solid var(--fw-line-strong); border-radius: 10px; padding: 0 12px; height: 44px; font: 400 0.92rem Poppins, sans-serif; background: #fff; color: var(--fw-ink); width: 100%; box-sizing: border-box; } textarea.in { height: auto; padding: 10px 12px; resize: vertical; } .in:focus { outline: 0; border-color: var(--fw-blue); box-shadow: 0 0 0 3px rgba(28, 109, 240, 0.15); }
      .err { color: #b91c1c; font-size: 0.76rem; } .count { text-align: right; color: var(--fw-muted); font-size: 0.72rem; }
      .hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
      .chk { display: flex; gap: 10px; align-items: flex-start; font-size: 0.8rem; line-height: 1.5; color: var(--fw-ink); cursor: pointer; } .chk input { margin-top: 3px; width: 17px; height: 17px; flex: none; } .chk i { color: #dc2626; font-style: normal; } .chk a { color: var(--fw-blue); }
      .cta { margin-top: 4px; } .note { display: flex; gap: 6px; align-items: center; margin: 0; font-size: 0.74rem; color: var(--fw-muted); } .note .material-icons { font-size: 16px; color: var(--fw-blue); }
      .done { text-align: center; display: grid; gap: 10px; justify-items: center; padding: 10px 0; } .tick { font-size: 72px; color: #16a34a; } .done h2 { margin: 0; } .done p { margin: 0; color: var(--fw-ink); line-height: 1.6; } .ref { color: var(--fw-muted) !important; font-size: 0.84rem; }
      @media (max-width: 900px) { .hero__in, .main { grid-template-columns: minmax(0, 1fr); } .formcard { position: static; } .hero__img, .hero__art { max-height: 180px; height: 160px; } .trust { grid-template-columns: none; } .hero__go { display: inline-flex; } }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class OfferLandingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly offers = inject(OfferService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly cities = ELIG.cities.filter((c) => c !== 'Other');
  protected readonly products = PRODUCT_PAGES;
  protected readonly trust = [
    { icon: 'groups', value: ELIG.strip[1].value, label: ELIG.strip[1].label },
    { icon: 'account_balance', value: ELIG.strip[2].value, label: ELIG.strip[2].label },
    { icon: 'public', value: ELIG.strip[4].value, label: ELIG.strip[4].label },
  ];

  protected readonly state = signal<'loading' | 'ready' | 'gone'>('loading');
  protected readonly offer = signal<PublicOffer | null>(null);
  protected readonly busy = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reference = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly image = computed(() => (this.offer() ? this.offers.imageUrl(this.offer() as PublicOffer) : null));

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(NAME)]],
    phone: ['', [Validators.required, (c: { value: string }) => (PHONE.test(cleanPhone(c.value)) ? null : { phone: true })]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(191)]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(NAME)]],
    service: [''],
    message: ['', Validators.maxLength(500)],
    website: [''],
    privacy: [false, Validators.requiredTrue],
    marketing: [false],
  });

  private entry: 'popup' | 'landing' = 'landing';
  private openedAt = Date.now();

  ngOnInit(): void {
    this.entry = this.route.snapshot.queryParamMap.get('src') === 'popup' ? 'popup' : 'landing';
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';

    // A signed-in customer gets their own details filled in.
    const u = this.auth.user();
    if (u && u.role === 'customer') {
      this.form.patchValue({ name: u.name ?? '', email: u.email ?? '', phone: u.phone ?? '' });
    }

    this.offers.offer(slug).subscribe({
      next: (o) => {
        this.offer.set(o);
        this.state.set('ready');
        this.openedAt = Date.now();
        this.offers.track('landing_visit', o.id, visitorId(), `/offers/${o.slug}`);
      },
      error: () => this.state.set('gone'),
    });
  }

  protected bad(name: 'name' | 'phone' | 'email' | 'city' | 'privacy'): boolean {
    const c = this.form.controls[name];

    return (c.invalid && (c.touched || c.dirty)) || !!this.serverErrors()[name === 'privacy' ? 'privacy_consent' : name];
  }

  protected server(name: string): string {
    return this.serverErrors()[name] ?? '';
  }

  /** On a phone the form is below the benefits, so the hero button takes the visitor straight to it. */
  protected goToForm(e: Event): void {
    e.preventDefault();
    const form = document.getElementById('claim');
    form?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('ol-name')?.focus({ preventScroll: true }), 450);
  }

  protected tidyPhone(): void {
    const c = this.form.controls.phone;
    c.setValue(cleanPhone(c.value));
  }

  protected firstName(): string {
    return this.form.controls.name.value.trim().split(/\s+/)[0] ?? '';
  }

  protected masked(): string {
    const d = cleanPhone(this.form.controls.phone.value);

    return d.length === 10 ? `+91 ${d.slice(0, 2)}XXX XX${d.slice(-3)}` : 'your number';
  }

  protected submit(): void {
    this.error.set(null);
    this.serverErrors.set({});
    this.tidyPhone();
    this.form.markAllAsTouched();
    const o = this.offer();
    if (!o || this.busy()) return;
    if (this.form.invalid) {
      this.error.set('Please fix the highlighted fields.');
      return;
    }

    const f = this.form.getRawValue();
    this.busy.set(true);
    this.offers
      .claim(o.slug, {
        name: f.name.trim(),
        phone: f.phone,
        email: f.email.trim(),
        city: f.city.trim(),
        interested_service: f.service || null,
        message: f.message.trim() || null,
        privacy_consent: f.privacy,
        marketing_consent: f.marketing,
        visitor_id: visitorId(),
        entry: this.entry,
        website: f.website,
        elapsed_ms: Date.now() - this.openedAt,
      })
      .subscribe({
        next: (r) => {
          this.busy.set(false);
          this.reference.set(r.reference);
          this.done.set(true);
          offerStore.markClaimed(); // the popup never comes back for this browser
          document.getElementById('claim')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        error: (e: { status?: number; message?: string; errors?: Record<string, string[]> }) => {
          this.busy.set(false);
          if (e?.status === 404) {
            this.state.set('gone');
            return;
          }
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
}
