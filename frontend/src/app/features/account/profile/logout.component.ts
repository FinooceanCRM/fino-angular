import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { CustomerProfileService } from '@core/services/customer-profile.service';

import { WEBSITE } from '../../website/website.config';
import { ProfileHeadComponent } from './profile-head.component';

/** Logout — layout follows images/12_Dashboard/05_Profile_Settings/10_Logout.png. */
@Component({
  selector: 'app-profile-logout',
  standalone: true,
  imports: [RouterLink, ProfileHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-profile-head title="Logout" subtitle="You’re almost signed out. Please confirm to continue." script="Thank You For Being a Part of Finoocean"
      [crumbs]="[{ label: 'Logout' }]" icon="verified_user" tone="blue" secureTitle="Your Security Matters" secureText="We keep your account safe, always." />

    <div class="cols">
      <section class="panel c">
        <span class="big"><span class="material-icons">logout</span></span>
        <h2>Confirm Logout</h2>
        <h3>Are you sure you want to logout?</h3>
        <p class="sub">You will be signed out of your account on this device. You can log in again anytime.</p>
        <button type="button" class="fw-btn fw-btn--primary fw-btn--block" [disabled]="busy()" (click)="logout()">{{ busy() ? 'Signing out…' : 'Yes, Logout' }}</button>
        <a class="fw-btn fw-btn--ghost fw-btn--block" routerLink="/account">Cancel</a>
      </section>

      <section class="panel c">
        <span class="big big--red"><span class="material-icons">person_off</span></span>
        <h2 class="red">Deactivate Account</h2>
        <h3>Thinking of leaving us?</h3>
        <p class="sub">You can deactivate your account anytime. Your data will be kept safe for a limited period as per our policy.</p>
        <div class="note2"><b>Before you deactivate, please note:</b>
          <ul><li>You will not be able to access your applications, documents and account details.</li><li>Ongoing loan applications may be affected.</li><li>You can reactivate your account by contacting our support team.</li><li>Your data will be retained as per our data protection policy.</li></ul></div>
        @if (!confirming()) {
          <button type="button" class="fw-btn fw-btn--outline-danger fw-btn--block" (click)="confirming.set(true)">Deactivate My Account</button>
        } @else {
          <div class="confirm">
            <label for="dp">Enter your password to deactivate</label>
            <input id="dp" class="in" type="password" [value]="password()" (input)="password.set($any($event.target).value)" autocomplete="current-password" />
            @if (error()) { <small class="err">{{ error() }}</small> }
            <div class="two"><button type="button" class="fw-btn fw-btn--ghost" (click)="confirming.set(false); error.set(null)">Keep my account</button>
              <button type="button" class="fw-btn fw-btn--danger" [disabled]="busy() || !password()" (click)="deactivate()">{{ busy() ? 'Working…' : 'Deactivate' }}</button></div>
          </div>
        }
      </section>
    </div>

    <section class="panel help">
      <div class="ph"><div><h2>Need Help? We’re Here for You.</h2><p class="sub">If you’re facing any issues, our support team is ready to assist you.</p></div><a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/help">Go to Support Center</a></div>
      <div class="ways">
        <a [href]="site.phoneHref"><span class="material-icons">phone</span><div><b>Call Us</b><span>{{ site.phone }}</span><small>{{ site.hours }}</small></div></a>
        <a [href]="site.whatsappHref" target="_blank" rel="noopener"><span class="material-icons wa">chat</span><div><b>Chat on WhatsApp</b><span>{{ site.phone }}</span><small>Get quick support on WhatsApp</small></div></a>
        <a [href]="'mailto:' + site.email"><span class="material-icons">mail_outline</span><div><b>Email Us</b><span>{{ site.email }}</span><small>We typically respond within 24 hours</small></div></a>
      </div>
    </section>

    <section class="see"><span class="material-icons">verified_user</span><div><b>Your trust means everything to us.</b><small>Whether you’re taking a break or leaving, we’re grateful to have been part of your financial journey.</small></div><p class="script" aria-hidden="true">See You Soon!</p></section>
  `,
  styles: [
    `
      .cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; align-items: start; }
      .c { text-align: center; display: grid; gap: 8px; justify-items: center; padding: 26px 22px; } .c .fw-btn--block { width: 100%; justify-content: center; }
      .big { width: 92px; height: 92px; border-radius: 50%; background: #dbeafe; display: grid; place-items: center; } .big .material-icons { font-size: 46px; color: var(--fw-blue); } .big--red { background: #fee2e2; } .big--red .material-icons { color: #dc2626; }
      .c h2 { margin: 6px 0 0; font-size: 1.5rem; } .c h3 { margin: 0; font-size: 1.05rem; } .red { color: #dc2626 !important; } .c .sub { max-width: 440px; margin: 0 0 6px; }
      .note2 { text-align: left; background: #fef2f2; border: 1px solid #fbcaca; border-radius: 12px; padding: 12px 14px; font-size: 0.82rem; width: 100%; box-sizing: border-box; } .note2 ul { margin: 8px 0 0; padding-left: 18px; display: grid; gap: 5px; color: var(--fw-ink); }
      .fw-btn--danger { background: #dc2626; color: #fff; border: 0; } .fw-btn--danger:disabled { opacity: 0.55; cursor: not-allowed; } .fw-btn--outline-danger { background: #fff; color: #dc2626; border: 1.5px solid #dc2626; } .fw-btn--outline-danger:hover { background: #fef2f2; }
      .confirm { width: 100%; display: grid; gap: 8px; text-align: left; } .confirm label { font-size: 0.82rem; font-weight: 500; } .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .help { margin-bottom: 16px; } .ways { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; } .ways a { display: flex; gap: 12px; align-items: center; padding: 14px; border: 1px solid var(--fw-line); border-radius: 12px; text-decoration: none; color: var(--fw-ink); } .ways a:hover { border-color: var(--fw-blue); } .ways .material-icons { font-size: 30px; color: var(--fw-blue); } .ways .wa { color: #22c55e; } .ways div { display: grid; line-height: 1.35; min-width: 0; overflow-wrap: anywhere; } .ways span:not(.material-icons) { font-size: 0.86rem; } .ways small { color: var(--fw-muted); font-size: 0.74rem; }
      .see { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; background: var(--fw-blue-soft); border: 1px solid #dbe8fb; border-radius: 14px; padding: 16px 20px; } .see > .material-icons { font-size: 34px; color: var(--fw-blue); } .see div { display: grid; flex: 1; min-width: 220px; } .see small { color: var(--fw-muted); } .see .script { font-family: Lora, serif; font-style: italic; font-size: 1.6rem; color: var(--fw-navy-2); margin: 0; }
      @media (max-width: 900px) { .cols, .ways { grid-template-columns: minmax(0, 1fr); } }
    `,
  ],
  styleUrls: ['../../website/website-ui.scss', './profile.scss'],
})
export class ProfileLogoutComponent {
  private readonly auth = inject(AuthService);
  private readonly svc = inject(CustomerProfileService);
  private readonly router = inject(Router);

  protected readonly site = WEBSITE;
  protected readonly busy = signal(false);
  protected readonly confirming = signal(false);
  protected readonly password = signal('');
  protected readonly error = signal<string | null>(null);

  protected logout(): void {
    this.busy.set(true);
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/'));
  }

  protected deactivate(): void {
    this.busy.set(true);
    this.error.set(null);
    this.svc.deactivate(this.password()).subscribe({
      next: () => this.auth.logout().subscribe(() => void this.router.navigateByUrl('/')),
      error: (e: { message?: string; errors?: Record<string, string[]> }) => {
        this.busy.set(false);
        this.password.set('');
        this.error.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'We could not deactivate your account.');
      },
    });
  }
}
