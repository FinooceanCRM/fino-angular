import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { PublicVendorRegistrationService } from '@core/services/public-vendor-registration.service';
import { environment } from '@env/environment';

type Step = 'form' | 'otp' | 'done';

/**
 * Public "Join as Vendor" landing page (`/join-vendor`) — self-service
 * signup for the standalone `vendor` role. Deliberately outside the app
 * shell (see app.routes.ts), and styled to mirror LoginComponent exactly:
 * the split navy→teal hero + the surface-container card with Angular
 * Material `appearance="outline"` fields, so a vendor feels they're on the
 * same Fino sign-in surface, not a different app.
 *
 * Registration creates a real account gated behind a phone OTP (see
 * VendorRegistrationService) — the same gate the connector signup uses.
 */
@Component({
  selector: 'app-public-join-vendor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './public-join-vendor.component.html',
  styleUrl: './public-join-vendor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicJoinVendorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly registration = inject(PublicVendorRegistrationService);

  protected readonly appName = environment.appName;

  protected readonly step = signal<Step>('form');
  protected readonly submitting = signal(false);
  protected readonly verifying = signal(false);
  protected readonly resending = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Only ever set when the backend is running in debug mode. */
  protected readonly devOtp = signal<string | null>(null);

  private registeredEmail = '';

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    business_name: ['', [Validators.required, Validators.maxLength(190)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
    city: [''],
    state: [''],
  });

  protected readonly otpForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  protected readonly showPassword = signal(false);

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    if (raw.password !== raw.password_confirmation) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.registration
      .register({
        name: raw.name,
        business_name: raw.business_name,
        email: raw.email,
        phone: raw.phone,
        password: raw.password,
        password_confirmation: raw.password_confirmation,
        city: raw.city || undefined,
        state: raw.state || undefined,
      })
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          this.registeredEmail = raw.email;

          if (!result.verificationRequired) {
            this.step.set('done');
            return;
          }

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
