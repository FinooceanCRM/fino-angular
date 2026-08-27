import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly auth = inject(AuthService);
  protected readonly appName = environment.appName;
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
        error: (err: { message?: string; error?: { message?: string } }) => {
          this.error.set(
            err?.message ??
              err?.error?.message ??
              'Unable to sign in. Please try again.',
          );
        },
      });
  }
}
