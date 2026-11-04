import { ChangeDetectionStrategy, Component, DestroyRef, ViewChild, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { CustomerPortalService } from '@core/services/customer-portal.service';
import { AuthService } from '@core/services/auth.service';
import { WebsiteService } from '@core/services/website.service';
import { EMPLOYMENT_TYPES, EligibilityResult, LoanProduct } from '@core/models/website.model';
import { formatInr } from '@core/utils/emi';

import { HcaptchaComponent } from './hcaptcha.component';

const PHONE = /^[0-9+\-\s()]{10,16}$/;

/**
 * Loan inquiry / application form, shared by the public Apply page and the
 * customer portal. Posts to /public/inquiries (anonymous) or
 * /customer/applications (signed-in customer) — never to an internal lead API.
 */
@Component({
  selector: 'app-inquiry-form',
  standalone: true,
  imports: [ReactiveFormsModule, HcaptchaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loadError()) {
      <div class="fw-alert fw-alert--error">{{ loadError() }}</div>
    } @else {
      <ol class="steps" aria-label="Progress">
        @for (s of stepLabels; track s; let i = $index) {
          <li [class.on]="step() >= i" [class.now]="step() === i"><span>{{ i + 1 }}</span>{{ s }}</li>
        }
      </ol>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <!-- Step 1: loan -->
        <section [hidden]="step() !== 0">
          <div class="fw-field">
            <label for="f-product">Loan type</label>
            <select id="f-product" class="fw-select" formControlName="product">
              <option value="">Select a loan type</option>
              @for (p of products(); track p.slug) { <option [value]="p.slug">{{ p.name }}</option> }
            </select>
            @if (show('product')) { <span class="fw-error">Choose a loan type.</span> }
          </div>
          <div class="row">
            <div class="fw-field">
              <label for="f-amount">Loan amount (₹)</label>
              <input id="f-amount" class="fw-input" type="number" inputmode="numeric" formControlName="loan_amount" />
              @if (show('loan_amount')) { <span class="fw-error">Enter an amount of at least ₹1,000.</span> }
            </div>
            <div class="fw-field">
              <label for="f-years">Tenure (years)</label>
              <input id="f-years" class="fw-input" type="number" inputmode="numeric" formControlName="years" />
              @if (show('years')) { <span class="fw-error">Enter 1 to 30 years.</span> }
            </div>
          </div>
          <div class="row">
            <div class="fw-field">
              <label for="f-emp">Employment type</label>
              <select id="f-emp" class="fw-select" formControlName="employment_type">
                <option value="">Select</option>
                @for (e of employmentTypes; track e.value) { <option [value]="e.value">{{ e.label }}</option> }
              </select>
            </div>
            <div class="fw-field">
              <label for="f-income">Monthly income (₹)</label>
              <input id="f-income" class="fw-input" type="number" inputmode="numeric" formControlName="monthly_income" />
            </div>
          </div>
          <div class="fw-field">
            <label for="f-emi">Existing monthly EMIs (₹)</label>
            <input id="f-emi" class="fw-input" type="number" inputmode="numeric" formControlName="existing_emi" />
            <span class="fw-hint">Total of loan EMIs you currently pay each month. Enter 0 if none.</span>
          </div>

          <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="checkEligibility()" [disabled]="checking()">
            {{ checking() ? 'Checking…' : 'See indicative eligibility' }}
          </button>
          @if (eligibility(); as e) {
            <div class="elig" [class]="'elig elig--' + e.band" role="status">
              <strong>{{ e.headline }}</strong>
              <span>Estimated EMI {{ fmt(e.estimated_emi) }} · indicative amount up to {{ fmt(e.indicative_max_amount) }}</span>
              @for (r of e.reasons; track r) { <em>{{ r }}</em> }
              <small>{{ e.disclaimer }}</small>
            </div>
          }
        </section>

        <!-- Step 2: you -->
        <section [hidden]="step() !== 1">
          @if (mode() === 'public') {
            <div class="fw-field">
              <label for="f-name">Full name</label>
              <input id="f-name" class="fw-input" autocomplete="name" formControlName="applicant_name" />
              @if (show('applicant_name')) { <span class="fw-error">Enter your full name.</span> }
            </div>
          }
          <div class="row">
            <div class="fw-field">
              <label for="f-phone">Mobile number</label>
              <input id="f-phone" class="fw-input" type="tel" autocomplete="tel" formControlName="applicant_phone" />
              @if (show('applicant_phone')) { <span class="fw-error">Enter a valid mobile number.</span> }
            </div>
            @if (mode() === 'public') {
              <div class="fw-field">
                <label for="f-email">Email (optional)</label>
                <input id="f-email" class="fw-input" type="email" autocomplete="email" formControlName="applicant_email" />
                @if (show('applicant_email')) { <span class="fw-error">Enter a valid email.</span> }
              </div>
            }
          </div>
          <div class="fw-field">
            <label for="f-city">City</label>
            <input id="f-city" class="fw-input" autocomplete="address-level2" formControlName="city" />
            @if (show('city')) { <span class="fw-error">Enter your city.</span> }
          </div>
        </section>

        <!-- Step 3: review -->
        <section [hidden]="step() !== 2">
          <dl class="review">
            <dt>Loan</dt><dd>{{ productName() }} · {{ fmt(form.value.loan_amount ?? 0) }} · {{ form.value.years }} yr</dd>
            <dt>Mobile</dt><dd>{{ form.value.applicant_phone }}</dd>
            <dt>City</dt><dd>{{ form.value.city }}</dd>
          </dl>
          <label class="fw-check">
            <input type="checkbox" formControlName="consent" />
            <span>I agree to be contacted by FINOOCEAN about this request and have read the Privacy Policy. I understand this is an inquiry, not a loan approval.</span>
          </label>
          @if (show('consent')) { <span class="fw-error">Consent is required to submit.</span> }

          <!-- Honeypot: invisible to people, bots fill it. -->
          <div class="hp" aria-hidden="true"><label>Website <input tabindex="-1" autocomplete="off" formControlName="website" /></label></div>

          @if (mode() === 'public') {
            <div class="captcha"><app-hcaptcha (token)="captcha.set($event)" (failed)="error.set('Could not load the verification challenge. Please refresh the page.')" /></div>
          }
        </section>

        @if (error()) { <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div> }

        <div class="actions">
          @if (step() > 0) { <button type="button" class="fw-btn fw-btn--ghost" (click)="back()">Back</button> }
          @if (step() < 2) {
            <button type="button" class="fw-btn fw-btn--primary" (click)="next()">Continue</button>
          } @else {
            <button type="submit" class="fw-btn fw-btn--primary" [disabled]="submitting()">{{ submitting() ? 'Submitting…' : 'Submit request' }}</button>
          }
        </div>
      </form>
    }
  `,
  styles: [
    `
      .steps { display: flex; gap: 8px; list-style: none; padding: 0; margin: 0 0 20px; flex-wrap: wrap; }
      .steps li { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--fw-muted); }
      .steps li span { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: #e6ecf6; font-weight: 600; }
      .steps li.on span { background: var(--fw-blue); color: #fff; }
      .steps li.now { color: var(--fw-ink); font-weight: 600; }
      .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      @media (max-width: 560px) { .row { grid-template-columns: 1fr; } }
      .actions { display: flex; gap: 12px; margin-top: 18px; justify-content: flex-end; }
      .elig { margin-top: 14px; padding: 14px; border-radius: 10px; display: grid; gap: 4px; font-size: 0.88rem; background: var(--fw-blue-soft); }
      .elig--likely { background: #e8f7ee; }
      .elig--needs_review { background: #fff6e0; }
      .elig em { font-style: normal; color: #7a4b00; }
      .elig small { color: var(--fw-muted); }
      .review { display: grid; grid-template-columns: 90px 1fr; gap: 6px 12px; margin: 0 0 16px; font-size: 0.9rem; }
      .review dt { color: var(--fw-muted); } .review dd { margin: 0; font-weight: 500; }
      .hp { position: absolute; left: -9999px; height: 0; overflow: hidden; }
      .captcha { margin-top: 14px; }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class InquiryFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly web = inject(WebsiteService);
  private readonly portal = inject(CustomerPortalService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = input<'public' | 'portal'>('public');
  readonly submitted = output<{ reference: string | null }>();

  @ViewChild(HcaptchaComponent) private readonly captchaCmp?: HcaptchaComponent;

  protected readonly employmentTypes = EMPLOYMENT_TYPES;
  protected readonly stepLabels = ['Loan details', 'Your details', 'Review'];
  protected readonly step = signal(0);
  protected readonly products = signal<LoanProduct[]>([]);
  protected readonly loadError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly checking = signal(false);
  protected readonly eligibility = signal<EligibilityResult | null>(null);
  protected readonly captcha = signal('');
  private readonly attempted = signal(false);

  // One key per form instance: a double click or a retry after a slow
  // network can never create two inquiries.
  private idempotencyKey = newKey();

  protected readonly form = this.fb.nonNullable.group({
    product: ['', Validators.required],
    loan_amount: [null as number | null, [Validators.required, Validators.min(1000), Validators.max(1000000000)]],
    years: [5, [Validators.required, Validators.min(1), Validators.max(30)]],
    employment_type: [''],
    monthly_income: [null as number | null, [Validators.min(0)]],
    existing_emi: [0 as number | null, [Validators.min(0)]],
    applicant_name: [''],
    applicant_phone: ['', [Validators.required, Validators.pattern(PHONE)]],
    applicant_email: ['', [Validators.email]],
    city: ['', [Validators.required, Validators.maxLength(128)]],
    consent: [false, Validators.requiredTrue],
    website: [''],
  });

  protected readonly productName = computed(() => {
    const slug = this.form.controls.product.value;
    return this.products().find((p) => p.slug === slug)?.name ?? '';
  });

  constructor() {
    this.web
      .products()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.products.set(list);
          this.prefillFromQuery();
        },
        error: () => this.loadError.set('We could not load loan products. Please refresh the page.'),
      });

    // The name field only exists in public mode (a signed-in customer's name
    // comes from their account), so its validators depend on the input.
    effect(() => {
      const name = this.form.controls.applicant_name;
      if (this.mode() === 'public') {
        name.setValidators([Validators.required, Validators.minLength(2)]);
      } else {
        name.clearValidators();
      }
      name.updateValueAndValidity();
    });

    const user = this.auth.user();
    if (user?.role === 'customer' && user.phone) {
      this.form.patchValue({ applicant_phone: user.phone });
    }
  }

  protected show(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.attempted());
  }

  protected fmt(v: number): string {
    return formatInr(v);
  }

  private prefillFromQuery(): void {
    const q = this.route.snapshot.queryParamMap;
    const product = q.get('product');
    const amount = Number(q.get('amount'));
    const years = Number(q.get('years'));
    this.form.patchValue({
      ...(product && this.products().some((p) => p.slug === product) ? { product } : {}),
      ...(amount > 0 ? { loan_amount: amount } : {}),
      ...(years >= 1 && years <= 30 ? { years } : {}),
    });
  }

  protected next(): void {
    const fields: Record<number, string[]> = {
      0: ['product', 'loan_amount', 'years', 'monthly_income', 'existing_emi'],
      1: ['applicant_name', 'applicant_phone', 'applicant_email', 'city'],
    };
    const current = fields[this.step()] ?? [];
    current.forEach((f) => this.form.get(f)?.markAsTouched());
    if (current.some((f) => this.form.get(f)?.invalid)) return;
    this.error.set(null);
    this.step.update((s) => s + 1);
  }

  protected back(): void {
    this.step.update((s) => Math.max(0, s - 1));
  }

  protected checkEligibility(): void {
    const v = this.form.getRawValue();
    ['product', 'loan_amount', 'years'].forEach((f) => this.form.get(f)?.markAsTouched());
    if (this.form.controls.product.invalid || this.form.controls.loan_amount.invalid || this.form.controls.years.invalid) return;

    this.checking.set(true);
    this.web
      .checkEligibility({
        product: v.product,
        loan_amount: Number(v.loan_amount),
        tenure_months: Math.round(v.years) * 12,
        monthly_income: v.monthly_income,
        existing_emi: v.existing_emi,
        employment_type: (v.employment_type || null) as never,
      })
      .subscribe({
        next: (r) => { this.eligibility.set(r); this.checking.set(false); },
        error: (e: { message?: string }) => { this.error.set(e?.message ?? 'Could not check eligibility.'); this.checking.set(false); },
      });
  }

  protected submit(): void {
    this.attempted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const isPublic = this.mode() === 'public';
    if (isPublic && !this.captcha()) {
      this.error.set('Please complete the verification challenge.');
      return;
    }

    const v = this.form.getRawValue();
    const common = {
      product: v.product,
      loan_amount: Number(v.loan_amount),
      tenure_months: Math.round(v.years) * 12,
      monthly_income: v.monthly_income,
      existing_emi: v.existing_emi,
      employment_type: (v.employment_type || null) as never,
      city: v.city,
      consent: v.consent,
      idempotency_key: this.idempotencyKey,
    };

    this.submitting.set(true);
    this.error.set(null);

    const request = isPublic
      ? this.web.submitInquiry({
          ...common,
          applicant_name: v.applicant_name,
          applicant_phone: v.applicant_phone,
          applicant_email: v.applicant_email || null,
          captcha_token: this.captcha() || undefined,
          website: v.website,
        })
      : this.portal.apply({ ...common, applicant_phone: v.applicant_phone });

    request.subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.submitted.emit({ reference: (res as { reference?: string | null }).reference ?? null });
      },
      error: (e: { message?: string }) => {
        this.submitting.set(false);
        this.error.set(e?.message ?? 'Something went wrong. Please try again.');
        this.captchaCmp?.reset();
      },
    });
  }
}

/** crypto.randomUUID needs a secure context; fall back for plain-http hosts. */
function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
