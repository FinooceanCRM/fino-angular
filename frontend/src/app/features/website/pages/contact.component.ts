import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { WebsiteService } from '@core/services/website.service';

import { CONTACT } from '../site-content.data';
import { WEBSITE } from '../website.config';
import { PageHeroComponent } from '../shared/page-hero.component';

/** Contact Us — layout and wording follow images/11_Contact.png. "Send Message" is stored server-side and alerts staff. */
@Component({
  selector: 'app-website-contact',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeroComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero [crumbs]="[{ label: 'Contact Us' }]" [title]="c.title" [text]="c.text" [script]="c.script">
      <ul class="feats">@for (f of c.feats; track f.title) { <li><span class="material-icons">{{ f.icon }}</span><span><b>{{ f.title }}</b><small>{{ f.text }}</small></span></li> }</ul>
    </app-page-hero>

    <div class="fw-container">
      <div class="cols">
        <!-- Message form -->
        <section class="fw-card">
          <h2 class="fw-h2">{{ c.formTitle }}</h2>
          <p class="fw-muted fw-small">{{ c.formSub }}</p>
          @if (sent()) {
            <div class="fw-alert fw-alert--ok" role="status">Thank you. Your message has been received and our team will get back to you shortly.</div>
            <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="sent.set(false)">Send another message</button>
          } @else {
            <form [formGroup]="form" (ngSubmit)="send()" novalidate>
              <div class="fw-field"><input class="fw-input" formControlName="name" placeholder="Full Name *" aria-label="Full Name" autocomplete="name" />
                @if (bad('name')) { <span class="fw-error">Enter your full name.</span> }</div>
              <div class="fw-field"><input class="fw-input" type="email" formControlName="email" placeholder="Email Address *" aria-label="Email Address" autocomplete="email" />
                @if (bad('email')) { <span class="fw-error">Enter a valid email.</span> }</div>
              <div class="fw-field"><input class="fw-input" type="tel" formControlName="phone" placeholder="Mobile Number *" aria-label="Mobile Number" autocomplete="tel" />
                @if (bad('phone')) { <span class="fw-error">Enter a valid mobile number.</span> }</div>
              <div class="fw-field"><select class="fw-select" formControlName="inquiry_type" aria-label="Inquiry Type"><option value="">Select Inquiry Type *</option>@for (t of c.types; track t) { <option [value]="t">{{ t }}</option> }</select>
                @if (bad('inquiry_type')) { <span class="fw-error">Choose an inquiry type.</span> }</div>
              <div class="fw-field"><textarea class="fw-textarea" formControlName="message" placeholder="Your Message *" aria-label="Your Message" rows="4"></textarea>
                @if (bad('message')) { <span class="fw-error">Please write a short message.</span> }</div>
              <div class="hp" aria-hidden="true"><input tabindex="-1" autocomplete="off" formControlName="website" /></div>
              <label class="fw-check"><input type="checkbox" formControlName="consent" /><span>I agree to the <a routerLink="/terms">Terms &amp; Conditions</a> and <a routerLink="/privacy-policy">Privacy Policy</a>.</span></label>
              @if (bad('consent')) { <span class="fw-error">Please accept to continue.</span> }
              @if (error()) { <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div> }
              <button type="submit" class="fw-btn fw-btn--primary fw-btn--block" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Send Message' }} <span class="material-icons">arrow_forward</span></button>
            </form>
          }
        </section>

        <!-- Office details -->
        <section class="fw-card">
          <h2 class="fw-h2">{{ c.officeTitle }}</h2>
          <p class="fw-muted fw-small">{{ c.officeSub }}</p>
          <ul class="info">
            <li><span class="material-icons">place</span><span><b>Head Office</b>{{ c.headOffice }}</span></li>
            <li><span class="material-icons">phone</span><span><b>Call Us</b><a [href]="site.phoneHref">{{ site.phone }}</a><small>Mon - Sat: 10:00 AM - 6:00 PM</small></span></li>
            <li><span class="material-icons">mail</span><span><b>Email Us</b><a [href]="'mailto:' + site.email">{{ site.email }}</a></span></li>
            <li><span class="material-icons">schedule</span><span><b>Business Hours</b>Monday - Saturday<br />10:00 AM - 6:00 PM</span></li>
            <li><span class="material-icons">directions</span><span><b>Get Directions</b><a [href]="c.mapsUrl" target="_blank" rel="noopener">Find us on Google Maps</a></span></li>
          </ul>
        </section>

        <!-- Location -->
        <section class="fw-card">
          <h2 class="fw-h2">Our Location</h2>
          <p class="fw-muted fw-small">Find us easily on the map.</p>
          <div class="map"><span class="material-icons">place</span><b>Finoocean</b><small>Nagpur, Maharashtra</small></div>
          <a class="fw-btn fw-btn--ghost fw-btn--block" [href]="c.mapsUrl" target="_blank" rel="noopener"><span class="material-icons">place</span> Open in Google Maps <span class="material-icons">arrow_forward</span></a>
        </section>
      </div>

      <div class="strip">@for (s of c.strip; track s.title) { <div><span class="ic material-icons">{{ s.icon }}</span><span><b>{{ s.title }}</b><small>{{ s.text }}</small></span></div> }</div>

      <div class="faqs">
        <div>
          <div class="fh"><div><h2 class="fw-h2">{{ c.faqTitle }}</h2><p class="fw-muted fw-small">{{ c.faqSub }}</p></div><a routerLink="/faq" class="more">View All FAQs →</a></div>
          <div class="faq-grid">@for (f of c.faqs; track f.q) { <details><summary>{{ f.q }}</summary><p>{{ f.a }}</p></details> }</div>
        </div>
        <div class="assist">
          <h3>{{ c.assist.title }}</h3><p>{{ c.assist.text }}</p>
          <a class="fw-btn fw-btn--primary fw-btn--block" [href]="site.phoneHref"><span class="material-icons">phone</span> Call Now: {{ site.phone }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      a { color: var(--fw-blue); } .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; } .fw-btn--ghost { color: var(--fw-blue); } .material-icons { font-size: 20px; }
      .feats { display: flex; gap: 14px 26px; list-style: none; padding: 0; margin: 4px 0 0; flex-wrap: wrap; } .feats li { display: flex; gap: 8px; align-items: center; } .feats .material-icons { color: #4dc4ff; font-size: 30px; } .feats span:last-child { display: grid; line-height: 1.25; } .feats small { color: #cfe0ff; font-size: 0.72rem; }
      .cols { display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 16px; margin: -16px 0 18px; position: relative; z-index: 2; align-items: start; } .cols h2 { margin: 0 0 4px; }
      .hp { position: absolute; left: -9999px; }
      .info { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 16px; } .info li { display: flex; gap: 12px; } .info .material-icons { color: var(--fw-blue); font-size: 26px; flex: none; } .info span:last-child { display: grid; font-size: 0.85rem; line-height: 1.5; color: var(--fw-muted); } .info b { color: var(--fw-ink); } .info small { color: var(--fw-muted); }
      .map { background: linear-gradient(135deg, #e9eef5, #dfe8f3); border-radius: 10px; height: 230px; display: grid; place-content: center; text-align: center; margin: 12px 0; } .map .material-icons { color: #e11d48; font-size: 40px; } .map small { color: var(--fw-muted); }
      .strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: var(--fw-blue-soft); border-radius: 12px; padding: 14px; margin-bottom: 22px; } .strip > div { display: flex; gap: 12px; align-items: center; } .strip span:last-child { display: grid; line-height: 1.3; } .strip small { color: var(--fw-muted); font-size: 0.74rem; } .ic { color: var(--fw-blue); font-size: 32px; }
      .faqs { display: grid; grid-template-columns: 1.7fr 1fr; gap: 20px; margin-bottom: 28px; align-items: start; }
      .fh { display: flex; justify-content: space-between; gap: 12px; align-items: flex-end; margin-bottom: 10px; } .fh h2, .fh p { margin: 0; } .more { text-decoration: none; font-size: 0.82rem; font-weight: 600; white-space: nowrap; }
      .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; } details { border: 1px solid var(--fw-line); border-radius: 8px; background: #fff; padding: 10px 14px; } summary { cursor: pointer; font-size: 0.85rem; font-weight: 500; color: var(--fw-ink); } details p { margin: 8px 0 0; font-size: 0.8rem; color: var(--fw-muted); line-height: 1.55; }
      .assist { background: var(--fw-blue-soft); border-radius: 12px; padding: 18px; display: grid; gap: 8px; } .assist h3 { margin: 0; color: var(--fw-navy); } .assist p { margin: 0; font-size: 0.85rem; color: var(--fw-muted); }
      @media (max-width: 1000px) { .cols { grid-template-columns: 1fr; margin-top: 16px; } .faqs { grid-template-columns: 1fr; } }
      @media (max-width: 640px) { .strip { grid-template-columns: 1fr 1fr; } .faq-grid { grid-template-columns: 1fr; } }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteContactComponent {
  private readonly fb = inject(FormBuilder);
  private readonly web = inject(WebsiteService);
  private readonly route = inject(ActivatedRoute);

  protected readonly c = CONTACT;
  protected readonly site = WEBSITE;
  protected readonly busy = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly tried = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(191)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{10,16}$/)]],
    inquiry_type: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(3000)]],
    consent: [false, Validators.requiredTrue],
    website: [''],
  });

  constructor() {
    // e.g. /contact?type=Home Loan from a product page.
    const type = this.route.snapshot.queryParamMap.get('type');
    if (type && CONTACT.types.includes(type)) this.form.patchValue({ inquiry_type: type });
  }

  protected bad(name: string): boolean {
    const ctl = this.form.get(name);
    return !!ctl && ctl.invalid && (ctl.touched || this.tried());
  }

  protected send(): void {
    this.tried.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;

    this.busy.set(true);
    this.error.set(null);
    this.web.sendContact(this.form.getRawValue()).subscribe({
      next: () => { this.busy.set(false); this.sent.set(true); this.form.reset(); this.tried.set(false); },
      error: (e: { message?: string; errors?: Record<string, string[]> }) => {
        this.busy.set(false);
        this.error.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'We could not send your message. Please try again.');
      },
    });
  }
}
