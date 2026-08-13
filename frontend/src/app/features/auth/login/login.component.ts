import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { PageHeaderComponent } from '@shared/components/page-header.component';

/**
 * Reactive-forms login placeholder. Submitting does not call the API yet;
 * authentication is implemented in Phase 3.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Sign in"
      subtitle="Authentication is wired up in a later phase."
    />

    <mat-card class="login-card">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="username" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input
            matInput
            type="password"
            formControlName="password"
            autocomplete="current-password"
          />
        </mat-form-field>

        <button mat-flat-button type="submit" [disabled]="form.invalid">
          Sign in
        </button>

        @if (notice()) {
          <p class="notice">{{ notice() }}</p>
        }
      </form>
    </mat-card>
  `,
  styles: [
    `
      .login-card {
        max-width: 420px;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .notice {
        margin: 0.75rem 0 0;
        opacity: 0.7;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly notice = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.notice.set('Placeholder only — no request is sent in Phase 1.');
  }
}
