import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { PublicBankerRegistrationService } from '@core/services/public-banker-registration.service';
import { environment } from '@env/environment';

type Step = 'form' | 'otp' | 'done';

/** Loan products a banker can handle — keys must match config/bankers.php. */
const PRODUCTS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'personal_loan', label: 'Personal Loan' },
  { key: 'business_loan', label: 'Business Loan' },
  { key: 'home_loan', label: 'Home Loan' },
  { key: 'car_loan', label: 'Car Loan' },
  { key: 'mortgage_loan', label: 'Mortgage Loan' },
];

/**
 * Public "Join as Banker" landing page (`/join-banker`) — self-service
 * signup for the `banker` role. Deliberately outside the app shell (see
 * app.routes.ts), styled to mirror LoginComponent exactly, same phone-OTP
 * gate as the connector/vendor signups.
 *
 * On success the banker verifies the OTP, then signs in and lands on the
 * existing Banker workspace — nothing about the banker module changes,
 * this only adds a second way to create the account (the Super Admin can
 * still create one directly).
 */
@Component({
  selector: 'app-public-join-banker',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './public-join-banker.component.html',
  styleUrl: './public-join-banker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicJoinBankerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly registration = inject(PublicBankerRegistrationService);

  protected readonly appName = environment.appName;
  protected readonly products = PRODUCTS;

  protected readonly step = signal<Step>('form');
  protected readonly submitting = signal(false);
  protected readonly verifying = signal(false);
  protected readonly resending = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Only ever set when the backend is running in debug mode. */
  protected readonly devOtp = signal<string | null>(null);

  private registeredEmail = '';

  protected readonly form = this.fb.nonNullable.group({
    // Personal
    first_name: ['', [Validators.required, Validators.maxLength(100)]],
    last_name: ['', [Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    state: ['', [Validators.required, Validators.maxLength(100)]],
    pincode: ['', [Validators.pattern(/^$|^[0-9]{4,10}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
    country: ['', [Validators.required, Validators.maxLength(100)]],
    pan_number: ['', [Validators.pattern(/^$|^[A-Za-z0-9]{10}$/)]],
    // Bank details
    bank_name: [''],
    branch_address: [''],
    branch_location: [''],
    bank_city: [''],
    bank_state: [''],
    // Manager details
    manager_name: [''],
    manager_email: ['', [Validators.email]],
    manager_phone: [''],
  });

  /** One boolean control per product — collected into a string[] on submit. */
  protected readonly productsForm = new FormGroup(
    Object.fromEntries(PRODUCTS.map((p) => [p.key, new FormControl(false, { nonNullable: true })])),
  );

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

    const selectedProducts = PRODUCTS.filter((p) => this.productsForm.controls[p.key].value).map(
      (p) => p.key,
    );

    this.submitting.set(true);
    this.error.set(null);

    this.registration
      .register({
        first_name: raw.first_name,
        last_name: raw.last_name || undefined,
        email: raw.email,
        phone: raw.phone,
        password: raw.password,
        password_confirmation: raw.password_confirmation,
        city: raw.city,
        state: raw.state,
        pincode: raw.pincode || undefined,
        country: raw.country,
        pan_number: raw.pan_number || undefined,
        bank_name: raw.bank_name || undefined,
        branch_address: raw.branch_address || undefined,
        branch_location: raw.branch_location || undefined,
        bank_city: raw.bank_city || undefined,
        bank_state: raw.bank_state || undefined,
        products: selectedProducts.length ? selectedProducts : undefined,
        manager_name: raw.manager_name || undefined,
        manager_email: raw.manager_email || undefined,
        manager_phone: raw.manager_phone || undefined,
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
