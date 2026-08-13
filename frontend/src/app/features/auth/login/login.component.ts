import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Sign in" subtitle="FINOOCEAN loan management" />

    <mat-card class="login-card">
      @if (auth.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input
            matInput
            type="email"
            formControlName="email"
            autocomplete="username"
          />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <mat-error>Enter a valid email address.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input
            matInput
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            autocomplete="current-password"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="showPassword.set(!showPassword())"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
          >
            <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <mat-error>Password must be at least 8 characters.</mat-error>
          }
        </mat-form-field>

        <button
          mat-flat-button
          type="submit"
          [disabled]="form.invalid || auth.loading()"
        >
          Sign in
        </button>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </form>
    </mat-card>
  `,
  styles: [
    `
      .login-card {
        max-width: 420px;
        padding: 1rem;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .error {
        margin: 0.75rem 0 0;
        color: var(--mat-sys-error, #b3261e);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly auth = inject(AuthService);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.auth.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);

    this.auth
      .login({ ...this.form.getRawValue(), device_name: 'web' })
      .subscribe({
        next: () => {
          const redirectTo =
            this.route.snapshot.queryParamMap.get('redirectTo') ?? '/dashboard';
          void this.router.navigateByUrl(redirectTo);
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err?.error?.message ?? 'Unable to sign in. Please try again.',
          );
        },
      });
  }
}
