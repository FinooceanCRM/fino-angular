import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SessionRow } from '@core/models/customer-profile.model';
import { CustomerProfileService } from '@core/services/customer-profile.service';

import { WEBSITE } from '../../website/website.config';
import { ProfileHeadComponent } from './profile-head.component';

function matches(c: AbstractControl): ValidationErrors | null {
  const g = c.parent;
  return g && c.value !== g.get('password')?.value ? { mismatch: true } : null;
}

/** Change Password & Security — layout follows images/12_Dashboard/05_Profile_Settings/07_Password_Security.png. */
@Component({
  selector: 'app-profile-security',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, ProfileHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-profile-head title="Change Password & Security" subtitle="Keep your account secure by using a strong password and managing your security settings."
      [crumbs]="[{ label: 'Profile', link: '/account/profile' }, { label: 'Change Password & Security' }]"
      secureTitle="Your account is secure" secureText="You are following our recommended security practices." />

    <nav class="tabs" aria-label="Security sections">
      <button type="button" [class.on]="tab() === 'p'" (click)="go('p', 'sec-p')"><span class="material-icons">lock</span>Change Password</button>
      <button type="button" [class.on]="tab() === 't'" (click)="go('t', 'sec-t')"><span class="material-icons">verified_user</span>Two-Factor Authentication</button>
      <button type="button" [class.on]="tab() === 'a'" (click)="go('a', 'sec-a')"><span class="material-icons">history</span>Login Activity</button>
      <button type="button" [class.on]="tab() === 's'" (click)="go('s', 'sec-s')"><span class="material-icons">settings</span>Security Settings</button>
    </nav>

    <div class="grid">
      <section class="panel" id="sec-p">
        <h2>Change Your Password</h2><p class="sub">Use a strong and unique password to keep your account safe.</p>
        @if (done()) { <div class="fw-alert fw-alert--success" role="status">Your password has been updated.</div> }
        @if (error()) { <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div> }
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="f"><label for="s-cur">Current Password *</label>
            <div class="pw"><input id="s-cur" class="in" [type]="show().cur ? 'text' : 'password'" formControlName="current" autocomplete="current-password" placeholder="Enter current password" />
              <button type="button" (click)="toggle('cur')" [attr.aria-label]="show().cur ? 'Hide password' : 'Show password'"><span class="material-icons">{{ show().cur ? 'visibility' : 'visibility_off' }}</span></button></div>
            @if (bad('current')) { <small class="err">Enter your current password.</small> }</div>
          <div class="f"><label for="s-new">New Password *</label>
            <div class="pw"><input id="s-new" class="in" [type]="show().next ? 'text' : 'password'" formControlName="password" autocomplete="new-password" placeholder="Enter new password" />
              <button type="button" (click)="toggle('next')" [attr.aria-label]="show().next ? 'Hide password' : 'Show password'"><span class="material-icons">{{ show().next ? 'visibility' : 'visibility_off' }}</span></button></div></div>
          <div class="f"><label for="s-conf">Confirm New Password *</label>
            <div class="pw"><input id="s-conf" class="in" [type]="show().conf ? 'text' : 'password'" formControlName="confirm" autocomplete="new-password" placeholder="Confirm new password" />
              <button type="button" (click)="toggle('conf')" [attr.aria-label]="show().conf ? 'Hide password' : 'Show password'"><span class="material-icons">{{ show().conf ? 'visibility' : 'visibility_off' }}</span></button></div>
            @if (bad('confirm')) { <small class="err">The two passwords don’t match.</small> }</div>
          <div class="req"><b>Password Requirements:</b>
            <ul><li [class.ok]="long()"><span class="material-icons">{{ long() ? 'check_circle' : 'radio_button_unchecked' }}</span>At least 8 characters long</li>
              <li [class.ok]="match()"><span class="material-icons">{{ match() ? 'check_circle' : 'radio_button_unchecked' }}</span>Both passwords match</li>
              <li class="free"><span class="material-icons">info</span>Any other characters are fine — it’s your password.</li></ul></div>
          <button type="submit" class="fw-btn fw-btn--primary fw-btn--block" [disabled]="busy()">{{ busy() ? 'Updating…' : 'Update Password' }}</button>
        </form>
      </section>

      <section class="panel" id="sec-t">
        <h2>Two-Factor Authentication (2FA)</h2><p class="sub">Add an extra layer of security to protect your account.</p>
        <div class="tfa"><span class="material-icons">phonelink_lock</span>
          <div><span class="pill pill--info">Coming soon</span><p>Two-factor authentication isn’t available yet. Until it is, a strong, unique password and signing out of devices you don’t use are the best protection.</p></div></div>
        <button type="button" class="fw-btn fw-btn--ghost fw-btn--block" disabled>Manage 2FA Settings</button>

        <div class="ph act" id="sec-a"><div><h2>Recent Login Activity</h2><p class="sub">Devices currently signed in to your account.</p></div></div>
        @if (sessions().length) {
          @for (s of sessions(); track s.id) {
            <div class="ses"><span class="material-icons">{{ s.current ? 'computer' : 'devices' }}</span>
              <div><b>{{ s.signed_in_at | date: 'EEE, d MMM y, h:mm a' }}</b><small>Last active {{ s.last_used_at ? (s.last_used_at | date: 'd MMM, h:mm a') : 'just now' }}</small></div>
              @if (s.current) { <span class="pill pill--ok">Current Session</span> }</div>
          }
          @if (sessions().length > 1) { <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" [disabled]="busy()" (click)="signOutOthers()">Sign out of other devices</button> }
        } @else { <p class="muted">No sessions to show.</p> }
      </section>

      <div class="stack">
        <section class="panel shield"><p class="script" aria-hidden="true">A Safer<br />Tomorrow<br />Starts Today!</p>
          <ul><li><span class="material-icons">check_circle</span>Stronger Security</li><li><span class="material-icons">check_circle</span>Protects Your Data</li><li><span class="material-icons">check_circle</span>Prevents Unauthorized Access</li><li><span class="material-icons">check_circle</span>Keeps Your Financial Information Safe</li></ul></section>
        <section class="panel" id="sec-s">
          <h2>Security Settings</h2><p class="sub">Manage additional security options.</p>
          <a class="srow" routerLink="/account/profile/communication"><span class="material-icons">notifications_active</span><div><b>Login Alerts</b><small>Choose how you are told about important account activity.</small></div><span class="material-icons">chevron_right</span></a>
          <a class="srow" routerLink="/account/profile/payments"><span class="material-icons">qr_code_2</span><div><b>Payment Methods</b><small>Manage your saved UPI IDs.</small></div><span class="material-icons">chevron_right</span></a>
          <div class="srow"><span class="material-icons">timer</span><div><b>Session Timeout</b><small>Not configurable yet.</small></div><span class="pill">Soon</span></div>
        </section>
      </div>
    </div>

    <div class="foot">
      <section class="panel"><h3><span class="material-icons">lightbulb</span> Security Tips</h3><ul class="tips"><li>Use a strong and unique password</li><li>Do not share your login credentials</li><li>Log out from shared or public devices</li><li>Keep your contact information updated</li></ul></section>
      <section class="panel"><h3><span class="material-icons">support_agent</span> Need Help?</h3><p class="sub">If you notice any suspicious activity or need assistance, contact our support team.</p>
        <div class="btns"><a class="fw-btn fw-btn--ghost fw-btn--sm" [href]="site.phoneHref">Call Now</a><a class="fw-btn fw-btn--ghost fw-btn--sm" [href]="site.whatsappHref" target="_blank" rel="noopener">Chat on WhatsApp</a></div></section>
      <section class="panel"><h3><span class="material-icons">shield</span> Your Privacy Matters</h3><p class="sub">Your data is encrypted and protected with bank-grade security. We never share your information with third parties without your consent.</p><a class="link" routerLink="/privacy-policy">Learn More →</a></section>
    </div>
  `,
  styles: [
    `
      .grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 0.9fr); gap: 16px; margin-bottom: 16px; align-items: start; } .stack { display: grid; gap: 16px; }
      form { display: grid; gap: 12px; } .pw { position: relative; } .pw .in { padding-right: 44px; } .pw button { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: none; border: 0; cursor: pointer; color: var(--fw-muted); display: grid; padding: 6px; }
      .req { background: var(--fw-blue-soft); border-radius: 12px; padding: 12px 14px; font-size: 0.82rem; } .req ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 6px; } .req li { display: flex; gap: 8px; align-items: center; color: var(--fw-muted); } .req li.ok { color: var(--fw-ink); } .req li .material-icons { font-size: 18px; color: #b3bfd1; } .req li.ok .material-icons { color: #16a34a; } .req .free .material-icons { color: var(--fw-blue); }
      .tfa { display: flex; gap: 14px; align-items: center; margin: 4px 0 12px; } .tfa > .material-icons { font-size: 54px; color: var(--fw-blue); } .tfa p { margin: 6px 0 0; font-size: 0.82rem; color: var(--fw-muted); line-height: 1.5; }
      .act { margin-top: 18px; } .ses { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid var(--fw-line); } .ses > .material-icons { color: var(--fw-blue); } .ses div { display: grid; flex: 1; line-height: 1.35; } .ses small { color: var(--fw-muted); font-size: 0.74rem; }
      .shield { background: linear-gradient(160deg, #eaf2ff, #dbe8fb); } .shield .script { font-family: Lora, serif; font-style: italic; font-size: 1.3rem; line-height: 1.25; color: var(--fw-navy-2); margin: 0 0 10px; } .shield ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 0.84rem; } .shield li { display: flex; gap: 8px; align-items: center; } .shield .material-icons { color: #16a34a; font-size: 18px; }
      .srow { display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid var(--fw-line); text-decoration: none; color: var(--fw-ink); } .srow:first-of-type { border-top: 0; } .srow > .material-icons:first-child { color: var(--fw-blue); } .srow div { display: grid; flex: 1; line-height: 1.3; } .srow small { color: var(--fw-muted); font-size: 0.74rem; }
      .foot { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; } .foot h3 { display: flex; gap: 6px; align-items: center; } .foot h3 .material-icons { color: var(--fw-blue); } .tips { margin: 0; padding-left: 18px; display: grid; gap: 6px; font-size: 0.82rem; } .btns { display: flex; gap: 8px; flex-wrap: wrap; }
      @media (max-width: 1280px) { .grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .grid .stack { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; } .foot { grid-template-columns: minmax(0, 1fr); } }
      @media (max-width: 800px) { .grid, .grid .stack { grid-template-columns: minmax(0, 1fr); } }
    `,
  ],
  styleUrls: ['../../website/website-ui.scss', './profile.scss'],
})
export class ProfileSecurityComponent {
  private readonly svc = inject(CustomerProfileService);
  private readonly fb = inject(FormBuilder);

  protected readonly site = WEBSITE;
  protected readonly tab = signal<'p' | 't' | 'a' | 's'>('p');
  protected readonly sessions = signal<SessionRow[]>([]);
  protected readonly show = signal({ cur: false, next: false, conf: false });
  protected readonly busy = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    current: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required, matches]],
  });

  constructor() {
    this.loadSessions();
    this.form.controls.password.valueChanges.subscribe(() => this.form.controls.confirm.updateValueAndValidity());
  }

  protected long(): boolean {
    return this.form.controls.password.value.length >= 8;
  }

  protected match(): boolean {
    const f = this.form.getRawValue();
    return f.password.length > 0 && f.password === f.confirm;
  }

  protected bad(name: 'current' | 'confirm'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected toggle(k: 'cur' | 'next' | 'conf'): void {
    this.show.update((s) => ({ ...s, [k]: !s[k] }));
  }

  protected go(t: 'p' | 't' | 'a' | 's', id: string): void {
    this.tab.set(t);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private loadSessions(): void {
    this.svc.sessions().subscribe({ next: (s) => this.sessions.set(s), error: () => undefined });
  }

  protected submit(): void {
    this.done.set(false);
    this.error.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      if (this.form.controls.password.invalid) this.error.set('Your new password must be at least 8 characters.');
      return;
    }
    const f = this.form.getRawValue();
    this.busy.set(true);
    this.svc.changePassword(f.current, f.password, f.confirm).subscribe({
      next: () => { this.busy.set(false); this.done.set(true); this.form.reset(); },
      error: (e: { message?: string; errors?: Record<string, string[]> }) => { this.busy.set(false); this.error.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'We could not update your password.'); },
    });
  }

  protected signOutOthers(): void {
    this.busy.set(true);
    this.svc.signOutOthers().subscribe({ next: () => { this.busy.set(false); this.loadSessions(); }, error: () => this.busy.set(false) });
  }
}
