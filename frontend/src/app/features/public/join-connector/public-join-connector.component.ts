import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { PublicConnectorRegistrationService } from '@core/services/public-connector-registration.service';

type Step = 'form' | 'otp' | 'done';

/**
 * Public connector invite/signup landing page (/join-connector or
 * /join-connector/:code) — recruiting-only, distinct from the customer
 * lead-capture referral page. Deliberately outside the app shell (see
 * app.routes.ts) and Material-light, mirroring public-refer.component.ts's
 * shape. Registration here creates a real account gated behind a phone OTP
 * (see ConnectorRegistrationService) instead of an email link — the actual
 * anti-abuse gate for this form — unlike the anonymous public lead form, it
 * does not also need a honeypot/CAPTCHA. Applies the same way whichever
 * path brought someone here: standalone signup or an inviter's link.
 */
@Component({
  selector: 'app-public-join-connector',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './public-join-connector.component.html',
  styleUrl: './public-join-connector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicJoinConnectorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly registration = inject(PublicConnectorRegistrationService);
  private readonly fb = inject(FormBuilder);

  protected readonly inviteCode = this.route.snapshot.paramMap.get('code') ?? '';

  protected readonly step = signal<Step>('form');
  protected readonly submitting = signal(false);
  protected readonly verifying = signal(false);
  protected readonly resending = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Only ever set when the backend is running in debug mode — see PublicConnectorOtpResult. */
  protected readonly devOtp = signal<string | null>(null);

  private registeredEmail = '';

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
    company_name: [''],
    contact_person: [''],
    alternate_phone: [''],
    address_line1: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.pattern(/^$|^[0-9]{4,10}$/)]],
    pan_number: ['', [Validators.pattern(/^$|^[A-Za-z0-9]{10}$/)]],
    gst_number: [''],
  });

  protected readonly otpForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.controls.password.value !== this.form.controls.password_confirmation.value) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();

    this.registration
      .register({
        name: raw.name,
        email: raw.email,
        password: raw.password,
        password_confirmation: raw.password_confirmation,
        phone: raw.phone,
        company_name: raw.company_name || undefined,
        contact_person: raw.contact_person || undefined,
        alternate_phone: raw.alternate_phone || undefined,
        address_line1: raw.address_line1 || undefined,
        city: raw.city || undefined,
        state: raw.state || undefined,
        pincode: raw.pincode || undefined,
        pan_number: raw.pan_number || undefined,
        gst_number: raw.gst_number || undefined,
        invite_code: this.inviteCode || undefined,
      })
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          this.registeredEmail = raw.email;
          this.devOtp.set(result.devOtp);
          this.otpForm.reset({ otp: result.devOtp ?? '' });
          this.step.set('otp');
        },
        error: (err: { message?: string }) => {
          this.submitting.set(false);
          this.error.set(err?.message ?? 'Something went wrong. Please try again.');
        },
      });
  }

  protected verifyOtp(): void {
    if (this.otpForm.invalid || this.verifying()) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.verifying.set(true);
    this.error.set(null);

    this.registration.verifyOtp(this.registeredEmail, this.otpForm.controls.otp.value).subscribe({
      next: () => {
        this.verifying.set(false);
        this.step.set('done');
      },
      error: (err: { message?: string }) => {
        this.verifying.set(false);
        this.error.set(err?.message ?? 'That code did not work. Please try again.');
      },
    });
  }

  protected resendOtp(): void {
    if (this.resending()) {
      return;
    }

    this.resending.set(true);
    this.error.set(null);

    this.registration.resendOtp(this.registeredEmail).subscribe({
      next: (result) => {
        this.resending.set(false);
        this.devOtp.set(result.devOtp);
        this.otpForm.reset({ otp: result.devOtp ?? '' });
      },
      error: (err: { message?: string }) => {
        this.resending.set(false);
        this.error.set(err?.message ?? 'Could not resend the code. Please try again.');
      },
    });
  }
}
