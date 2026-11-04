import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

const PHONE = /^[0-9+\-\s()]{10,16}$/;

/** Customer login / registration (one component, two routes: /login and /register). */
@Component({
  selector: 'app-customer-auth',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap">
      <div class="fw-container grid">
        <div class="pitch">
          <span class="fw-eyebrow">Login / Register</span>
          <h1 class="fw-h1">Welcome to <span class="hl">Finoocean</span></h1>
          <div class="partners">
            <h3 class="partners__h">Want to work with us?</h3>
            <div class="partners__grid">
              <a class="pcard" routerLink="/join-connector">
                <span class="pcard__ic"><span class="material-icons">handshake</span></span>
                <span class="pcard__t"><b>Become a connector</b><small>Refer customers and earn commissions</small></span>
                <span class="material-icons pcard__go" aria-hidden="true">arrow_forward</span>
              </a>
              <a class="pcard" routerLink="/join-vendor">
                <span class="pcard__ic"><span class="material-icons">storefront</span></span>
                <span class="pcard__t"><b>Join as a vendor</b><small>Get your business certified and request a loan</small></span>
                <span class="material-icons pcard__go" aria-hidden="true">arrow_forward</span>
              </a>
              <a class="pcard" routerLink="/join-banker">
                <span class="pcard__ic"><span class="material-icons">account_balance</span></span>
                <span class="pcard__t"><b>Join as a banker</b><small>Receive leads matched to your criteria</small></span>
                <span class="material-icons pcard__go" aria-hidden="true">arrow_forward</span>
              </a>
            </div>
            <p class="fw-small fw-muted partners__note">Already a partner? Log in with your work account on the right.</p>
          </div>
        </div>

        <div class="fw-card box" [class.box--wide]="mode() === 'register'">
          <div class="tabs" role="tablist">
            <a role="tab" routerLink="/login" [class.on]="mode() === 'login'" [queryParamsHandling]="'preserve'">Login</a>
            <a role="tab" routerLink="/register" [class.on]="mode() === 'register'" [queryParamsHandling]="'preserve'">Register</a>
          </div>

          @if (mode() === 'login') {
            <h2 class="fw-h2 ttl">Login to Your Account</h2>
            <p class="fw-muted fw-small">Access your dashboard and continue your financial journey.</p>
            <form [formGroup]="loginForm" (ngSubmit)="login()" novalidate>
              <div class="fw-field">
                <label for="l-email">Email</label>
                <input id="l-email" class="fw-input" type="email" autocomplete="username" formControlName="email" />
                @if (bad(loginForm, 'email')) { <span class="fw-error">Enter a valid email.</span> }
              </div>
              <div class="fw-field">
                <label for="l-pass">Password</label>
                <input id="l-pass" class="fw-input" type="password" autocomplete="current-password" formControlName="password" />
                @if (bad(loginForm, 'password')) { <span class="fw-error">Enter your password.</span> }
              </div>
              @if (error()) { <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div> }
              <button class="fw-btn fw-btn--primary fw-btn--block" type="submit" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Login' }}</button>
              <p class="fw-small fw-muted switch">New here? <a routerLink="/register">Create an account</a></p>
            </form>
          } @else {
            <h2 class="fw-h2 ttl">Create Your Account</h2>
            <p class="fw-muted fw-small">It’s quick, easy and free. Get started in just a few steps.</p>
            <form class="rgrid" [formGroup]="registerForm" (ngSubmit)="register()" novalidate>
              <div class="fw-field">
                <label for="r-name">Full name</label>
                <input id="r-name" class="fw-input" autocomplete="name" formControlName="name" />
                @if (bad(registerForm, 'name')) { <span class="fw-error">Enter your full name.</span> }
              </div>
              <div class="fw-field">
                <label for="r-email">Email</label>
                <input id="r-email" class="fw-input" type="email" autocomplete="email" formControlName="email" />
                @if (bad(registerForm, 'email')) { <span class="fw-error">Enter a valid email.</span> }
              </div>
              <div class="fw-field">
                <label for="r-phone">Mobile number</label>
                <input id="r-phone" class="fw-input" type="tel" autocomplete="tel" formControlName="phone" />
                @if (bad(registerForm, 'phone')) { <span class="fw-error">Enter a valid mobile number.</span> }
              </div>
              <div class="fw-field">
                <label for="r-pass">Password</label>
                <input id="r-pass" class="fw-input" type="password" autocomplete="new-password" formControlName="password" />
                <span class="fw-hint">At least 8 characters.</span>
                @if (bad(registerForm, 'password')) { <span class="fw-error">Password does not meet the requirements.</span> }
              </div>
              <div class="fw-field">
                <label for="r-pass2">Confirm password</label>
                <input id="r-pass2" class="fw-input" type="password" autocomplete="new-password" formControlName="password_confirmation" />
                @if (registerForm.hasError('mismatch') && registerForm.controls.password_confirmation.touched) { <span class="fw-error">Passwords do not match.</span> }
              </div>
              <label class="fw-check rfull">
                <input type="checkbox" formControlName="terms" />
                <span>I agree to the <a routerLink="/terms" target="_blank">Terms</a> and <a routerLink="/privacy-policy" target="_blank">Privacy Policy</a>.</span>
              </label>
              @if (bad(registerForm, 'terms')) { <span class="fw-error rfull">Please accept to continue.</span> }
              @if (error()) { <div class="fw-alert fw-alert--error rfull" role="alert">{{ error() }}</div> }
              @for (m of fieldErrors(); track m) { <div class="fw-error rfull">{{ m }}</div> }
              <button class="fw-btn fw-btn--primary fw-btn--block rfull" type="submit" [disabled]="busy()">{{ busy() ? 'Creating account…' : 'Create account' }}</button>
              <p class="fw-small fw-muted switch rfull">Already registered? <a routerLink="/login">Login</a></p>
            </form>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .wrap { padding: 48px 0; background: linear-gradient(180deg, var(--fw-blue-soft), #fff); }
      .grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 40px; align-items: center; }
      .pitch ul { list-style: none; padding: 0; margin: 0 0 18px; display: grid; gap: 12px; }
      .pitch li { display: flex; gap: 10px; align-items: center; color: var(--fw-ink); }
      .pitch .material-icons { color: #22c55e; }
      .ttl { margin: 0 0 2px; } .hl { color: var(--fw-blue); } .lead { color: var(--fw-muted); line-height: 1.6; max-width: 460px; }
      .box { max-width: 460px; width: 100%; justify-self: end; }
      .box--wide { max-width: 580px; }
      .rgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; align-items: start; }
      .rgrid .rfull { grid-column: 1 / -1; }
      .rgrid .fw-field { margin-bottom: 10px; min-width: 0; }
      .rgrid .switch { margin-top: 8px; }
      /* Desktop: the sign-in pages fill exactly the space under the header (see website-layout "fit"). */
      @media (min-width: 901px) {
        :host { display: flex !important; flex: 1; min-height: 0; }
        .wrap { flex: 1; display: flex; align-items: center; padding: 12px 0; min-height: 0; overflow: hidden; }
        .wrap .grid { width: 100%; }
      }
      .tabs { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 18px; border-bottom: 2px solid var(--fw-line); }
      .tabs a { text-align: center; padding: 10px; text-decoration: none; color: var(--fw-muted); font-weight: 600; border-bottom: 3px solid transparent; margin-bottom: -2px; }
      .tabs a.on { color: var(--fw-blue); border-bottom-color: var(--fw-blue); }
      .switch { text-align: center; margin: 12px 0 0; }
      .partners { margin-top: 22px; max-width: 520px; }
      .partners__h { margin: 0 0 10px; font-size: 1rem; color: var(--fw-navy); }
      .partners__grid { display: grid; gap: 10px; }
      .pcard { display: flex; align-items: center; gap: 14px; padding: 12px 14px; background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; text-decoration: none; color: var(--fw-ink); transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
      .pcard:hover { border-color: var(--fw-blue); box-shadow: 0 6px 18px rgba(28, 109, 240, 0.12); transform: translateY(-1px); }
      .pcard__ic { display: grid; place-items: center; flex: none; width: 44px; height: 44px; border-radius: 12px; background: var(--fw-blue-soft); color: var(--fw-blue); }
      .pcard__t { display: grid; flex: 1; min-width: 0; line-height: 1.3; } .pcard__t b { font-size: 0.92rem; color: var(--fw-navy); } .pcard__t small { color: var(--fw-muted); font-size: 0.78rem; }
      .pcard__go { color: var(--fw-blue); font-size: 20px; transition: transform 0.15s; } .pcard:hover .pcard__go { transform: translateX(3px); }
      .partners__note { margin: 10px 0 0; }
      a { color: var(--fw-blue); }
      @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } .box { justify-self: stretch; max-width: none; } }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class CustomerAuthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly mode = input<'login' | 'register'>('login');

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string[]>>({});
  protected readonly fieldErrors = computed(() => Object.values(this.serverErrors()).flat());

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly registerForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(191)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(PHONE)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
    },
    {
      validators: (g) =>
        g.get('password')?.value === g.get('password_confirmation')?.value ? null : { mismatch: true },
    },
  );

  protected bad(form: { get(name: string): { invalid: boolean; touched: boolean } | null }, name: string): boolean {
    const c = form.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected login(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid || this.busy()) return;

    this.busy.set(true);
    this.error.set(null);
    this.auth.login({ ...this.loginForm.getRawValue(), device_name: 'web' }).subscribe({
      next: () => this.done(),
      error: (e: { message?: string }) => this.fail(e),
    });
  }

  protected register(): void {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid || this.busy()) return;

    this.busy.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    this.auth.registerCustomer(this.registerForm.getRawValue()).subscribe({
      next: () => this.done(),
      error: (e: { message?: string; errors?: Record<string, string[]> }) => {
        this.serverErrors.set(e?.errors ?? {});
        this.fail(e);
      },
    });
  }

  private done(): void {
    this.busy.set(false);
    const target = this.route.snapshot.queryParamMap.get('redirectTo');
    const safe = target && target.startsWith('/') && !target.startsWith('//') ? target : null;

    if (this.auth.role() === 'customer') {
      // Never bounce a customer into the CRM: only follow /account paths.
      void this.router.navigateByUrl(safe?.startsWith('/account') ? safe : '/account');
      return;
    }

    // Staff land in their workspace (the dashboard forwards to the role's home),
    // or wherever they were headed before being asked to sign in.
    void this.router.navigateByUrl(safe && !safe.startsWith('/account') ? safe : '/dashboard');
  }

  private fail(e: { message?: string }): void {
    this.busy.set(false);
    this.error.set(e?.message ?? 'Something went wrong. Please try again.');
  }
}
