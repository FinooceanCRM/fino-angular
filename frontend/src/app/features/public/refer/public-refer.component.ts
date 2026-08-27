import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, AfterViewInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { PublicLeadService } from '@core/services/public-lead.service';
import { environment } from '@env/environment';

interface HcaptchaWidgetOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

interface HcaptchaApi {
  render(container: HTMLElement, options: HcaptchaWidgetOptions): string;
  reset(widgetId?: string): void;
}

declare global {
  interface Window {
    hcaptcha?: HcaptchaApi;
  }
}

const HCAPTCHA_SCRIPT_SRC = 'https://js.hcaptcha.com/1/api.js';

const LOAN_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'home', label: 'Home Loan' },
  { value: 'personal', label: 'Personal Loan' },
  { value: 'business', label: 'Business Loan' },
  { value: 'auto', label: 'Car Loan' },
  { value: 'education', label: 'Education Loan' },
  { value: 'loan_against_property', label: 'Mortgage Loan / LAP' },
  { value: 'instant_loan', label: 'Instant Loan' },
  { value: 'micro_loan', label: 'Micro Loan' },
  { value: 'gold_loan', label: 'Gold Loan' },
  { value: 'mudra_loan', label: 'Mudra Loan' },
  { value: 'overdraft', label: 'Overdraft (OD)' },
  { value: 'cash_credit', label: 'Cash Credit (CC)' },
  { value: 'dropline_od', label: 'Dropline OD' },
  { value: 'project_loan', label: 'Project Loan' },
  { value: 'commercial_property', label: 'Commercial Property' },
  { value: 'loan_bt', label: 'Loan Balance Transfer' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'loan_against_fd', label: 'Loan Against FD' },
  { value: 'loan_against_mutual_fund', label: 'Loan Against Mutual Fund' },
  { value: 'loan_against_pension', label: 'Loan Against Pension' },
];

/**
 * Public referral landing page (/refer/:code) — a marketing surface, not
 * part of the authenticated SPA. Deliberately outside the app shell (see
 * app.routes.ts) and Material-light to keep this route's bundle small.
 */
@Component({
  selector: 'app-public-refer',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './public-refer.component.html',
  styleUrl: './public-refer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicReferComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly leads = inject(PublicLeadService);

  @ViewChild('captchaContainer') private readonly captchaContainer?: ElementRef<HTMLDivElement>;

  protected readonly loanTypes = LOAN_TYPES;
  protected readonly referralCode = this.route.snapshot.paramMap.get('code') ?? '';

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly captchaToken = signal('');
  protected readonly captchaReady = signal(false);

  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    applicant_name: ['', [Validators.required, Validators.maxLength(191)]],
    applicant_email: ['', [Validators.email]],
    applicant_phone: ['', [Validators.required, Validators.maxLength(32)]],
    loan_type: ['', [Validators.required]],
    loan_amount: [null as number | null, [Validators.required, Validators.min(1)]],
    city: ['', [Validators.required, Validators.maxLength(128)]],
    // Honeypot: real visitors never see or fill this — see the CSS-hidden
    // markup in the template. Left blank by every genuine submission.
    website: [''],
  });

  private captchaWidgetId: string | null = null;
  private captchaScriptEl: HTMLScriptElement | null = null;

  ngAfterViewInit(): void {
    void this.loadCaptcha();
  }

  ngOnDestroy(): void {
    this.captchaScriptEl?.remove();
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.captchaToken()) {
      this.error.set('Please complete the verification challenge.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();

    this.leads
      .submit({
        applicant_name: raw.applicant_name,
        applicant_email: raw.applicant_email || undefined,
        applicant_phone: raw.applicant_phone,
        loan_type: raw.loan_type,
        loan_amount: Number(raw.loan_amount),
        city: raw.city,
        referral_code: this.referralCode || undefined,
        captcha_token: this.captchaToken(),
        website: raw.website,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: (err: { message?: string }) => {
          this.submitting.set(false);
          this.error.set(err?.message ?? 'Something went wrong. Please try again.');
          this.resetCaptcha();
        },
      });
  }

  private async loadCaptcha(): Promise<void> {
    try {
      await this.ensureScriptLoaded();
      this.renderWidget();
    } catch {
      this.error.set('Could not load the verification challenge. Please refresh the page.');
    }
  }

  private ensureScriptLoaded(): Promise<void> {
    if (window.hcaptcha) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = HCAPTCHA_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('hCaptcha script failed to load.'));
      document.head.appendChild(script);
      this.captchaScriptEl = script;
    });
  }

  private renderWidget(): void {
    const container = this.captchaContainer?.nativeElement;
    if (!container || !window.hcaptcha) {
      return;
    }

    this.captchaWidgetId = window.hcaptcha.render(container, {
      sitekey: environment.hcaptchaSiteKey,
      callback: (token) => this.captchaToken.set(token),
      'expired-callback': () => this.captchaToken.set(''),
      'error-callback': () => this.captchaToken.set(''),
    });
    this.captchaReady.set(true);
  }

  private resetCaptcha(): void {
    this.captchaToken.set('');
    if (window.hcaptcha && this.captchaWidgetId !== null) {
      window.hcaptcha.reset(this.captchaWidgetId);
    }
  }
}
