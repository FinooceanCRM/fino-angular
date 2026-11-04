import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CustomerDashboard } from '@core/models/customer-portal.model';
import { AuthService } from '@core/services/auth.service';
import { CustomerPortalService } from '@core/services/customer-portal.service';
import { BreadcrumbComponent } from '@shared/components/breadcrumb.component';

const PREFS_KEY = 'fino.account.prefs';

interface Prefs {
  appUpdates: boolean; docUpdates: boolean; offers: boolean; alerts: boolean; system: boolean;
  language: string; theme: string; currency: string; mode: string;
}

const DEFAULTS: Prefs = { appUpdates: true, docUpdates: true, offers: true, alerts: true, system: false, language: 'English', theme: 'Light Mode', currency: 'INR (₹)', mode: 'Email & SMS' };

function loadPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>) };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Account Settings — layout follows images/12_Dashboard/05_Profile_Settings/08_Account_Settings.png. */
@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb variant="portal" [withBack]="true" />
    <header class="head">
      <div><h1>Account Settings</h1><p>Manage your profile, security, preferences and account information.</p></div>
      <p class="script" aria-hidden="true">Your Account<br />Your Control</p>
      <div class="secure"><span class="material-icons">verified_user</span><div><b>Your Data is Secure</b><small>We use advanced encryption to keep your information safe.</small></div></div>
    </header>

    <div class="tabs">
      <a href="#profile" class="on"><span class="material-icons">person</span>Profile</a>
      <a href="#bank"><span class="material-icons">account_balance</span>Bank Details</a>
      <a href="#address"><span class="material-icons">place</span>Address</a>
      <a href="#security"><span class="material-icons">lock</span>Security</a>
      <a href="#notifications"><span class="material-icons">notifications</span>Notifications</a>
      <a href="#preferences"><span class="material-icons">tune</span>Preferences</a>
      <a href="#delete"><span class="material-icons">delete_outline</span>Delete Account</a>
    </div>

    <div class="grid2">
      <section class="panel" id="profile">
        <div class="ph"><div><h2>Profile Information</h2><small>Update your personal details</small></div><a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/profile">Edit Profile</a></div>
        <dl>
          <dt>Full Name</dt><dd>{{ auth.user()?.name }}</dd>
          <dt>Email Address</dt><dd>{{ auth.user()?.email }}</dd>
          <dt>Mobile Number</dt><dd>{{ auth.user()?.phone ? '+91 ' + auth.user()?.phone : 'Not added' }} @if (auth.user()?.phone) { <em class="ok">Verified</em> }</dd>
        </dl>
      </section>

      <section class="panel">
        <div class="ph"><div><h2>KYC Status</h2><small>Complete your KYC for faster loan approvals</small></div><a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/documents">View Details</a></div>
        <div class="kyc">
          <div class="ring" [style.--p]="percent()"><b>{{ percent() }}%</b></div>
          <div class="steps">
            @for (s of steps(); track s.key) {
              <div><span class="material-icons" [class.done]="s.done">{{ s.done ? 'check_circle' : 'pending' }}</span>{{ s.label }}<em [class.ok]="s.done">{{ s.done ? 'Completed' : 'Pending' }}</em></div>
            }
          </div>
        </div>
      </section>

      <section class="panel" id="bank">
        <div class="ph"><div><h2>Bank Details</h2><small>Manage your bank account details for loan disbursal</small></div></div>
        <div class="empty"><span class="material-icons">account_balance</span><p>No bank account added yet.</p><small>You’ll be asked for bank details when you submit a loan application.</small></div>
      </section>

      <section class="panel" id="address">
        <div class="ph"><div><h2>Address Details</h2><small>Manage your communication address</small></div></div>
        <div class="empty"><span class="material-icons">place</span><p>No address added yet.</p><small>Your city is saved with each loan application.</small></div>
      </section>
    </div>

    <div class="grid3">
      <section class="panel" id="security">
        <div class="ph"><div><h2>Security Settings</h2><small>Keep your account secure</small></div><a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/profile">Change Password</a></div>
        <div class="row"><span class="material-icons ico">lock</span><div><b>Password</b><small>Use a password only you know</small></div></div>
        <div class="row"><span class="material-icons ico">verified_user</span><div><b>Two-Factor Authentication</b><small>Add an extra layer of security</small></div><span class="soon">Coming soon</span></div>
        <div class="row"><span class="material-icons ico">devices</span><div><b>Active Sessions</b><small>Sign out to end your session on this device</small></div></div>
      </section>

      <section class="panel" id="notifications">
        <div class="ph"><div><h2>Notification Preferences</h2><small>Choose what notifications you want to receive</small></div></div>
        @for (n of notifs; track n.key) {
          <div class="row"><span class="material-icons ico">{{ n.icon }}</span><div><b>{{ n.label }}</b></div>
            <button type="button" role="switch" class="sw" [class.on]="prefs()[n.key]" [attr.aria-checked]="prefs()[n.key]" [attr.aria-label]="n.label" (click)="toggle(n.key)"><i></i></button></div>
        }
      </section>

      <section class="panel" id="preferences">
        <div class="ph"><div><h2>Account Preferences</h2><small>Customize your experience</small></div></div>
        @for (s of selects; track s.key) {
          <label class="row"><span class="material-icons ico">{{ s.icon }}</span><div><b>{{ s.label }}</b></div>
            <select [value]="prefs()[s.key]" (change)="setSelect(s.key, $any($event.target).value)">@for (o of s.options; track o) { <option [selected]="prefs()[s.key] === o">{{ o }}</option> }</select></label>
        }
        <small class="hint">Preferences are saved on this device.</small>
      </section>
    </div>

    <section class="panel danger" id="delete">
      <div><h2>Delete Account</h2><small>To close your account and request deletion of your data, contact our support team. Accounts with an application in progress can’t be closed until it is complete.</small></div>
      <a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/help">Contact Support</a>
    </section>
  `,
  styles: [
    `
      .fw-btn { white-space: nowrap; }
      .crumbs { display: flex; gap: 8px; font-size: 0.82rem; color: var(--fw-muted); margin-bottom: 8px; } .crumbs a { color: inherit; text-decoration: none; }
      .head { display: grid; grid-template-columns: 1fr auto auto; gap: 22px; align-items: center; margin-bottom: 16px; }
      h1 { margin: 0 0 4px; font-size: clamp(1.7rem, 3vw, 2.2rem); color: var(--fw-navy); } .head p { margin: 0; color: var(--fw-muted); font-size: 0.92rem; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.2rem; line-height: 1.2; color: var(--fw-navy-2); text-align: right; }
      .secure { display: flex; gap: 12px; align-items: center; background: var(--fw-blue-soft); border: 1px solid #dbe8fb; border-radius: 12px; padding: 12px 16px; max-width: 330px; }
      .secure .material-icons { font-size: 34px; color: var(--fw-blue); } .secure div { display: grid; } .secure small { color: var(--fw-muted); font-size: 0.74rem; }
      .tabs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
      .tabs a { display: inline-flex; gap: 8px; align-items: center; border: 1px solid var(--fw-line); background: #fff; border-radius: 10px; padding: 10px 16px; font: 500 0.84rem Poppins, sans-serif; color: var(--fw-ink); text-decoration: none; }
      .tabs a.on { background: var(--fw-blue); color: #fff; border-color: var(--fw-blue); } .tabs .material-icons { font-size: 18px; }
      .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; } .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
      .panel { background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; padding: 18px; scroll-margin-top: 80px; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.04); }
      .ph { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; } .ph h2 { margin: 0; font-size: 1.05rem; } .ph small, .danger small { color: var(--fw-muted); font-size: 0.78rem; }
      dl { display: grid; grid-template-columns: 130px 1fr; gap: 10px 12px; margin: 0; font-size: 0.88rem; } dt { color: var(--fw-muted); } dd { margin: 0; font-weight: 500; overflow-wrap: anywhere; }
      em { font-style: normal; font-size: 0.72rem; color: #d97706; background: #fff7e6; border-radius: 6px; padding: 2px 8px; margin-left: 8px; } em.ok { color: #15803d; background: #dcfce7; }
      .kyc { display: flex; gap: 18px; align-items: center; }
      .ring { --p: 0; width: 110px; height: 110px; border-radius: 50%; flex: none; display: grid; place-items: center; background: conic-gradient(#16a34a calc(var(--p) * 1%), #e6ecf6 0); position: relative; } .ring::before { content: ''; position: absolute; inset: 11px; background: #fff; border-radius: 50%; } .ring b { position: relative; font-size: 1.4rem; }
      .steps { display: grid; gap: 8px; flex: 1; font-size: 0.86rem; } .steps div { display: flex; align-items: center; gap: 8px; } .steps em { margin-left: auto; } .steps .material-icons { color: #d97706; font-size: 20px; } .steps .done { color: #16a34a; }
      .empty { display: grid; justify-items: center; text-align: center; gap: 4px; padding: 14px; color: var(--fw-muted); } .empty .material-icons { font-size: 36px; color: var(--fw-blue); } .empty p { margin: 4px 0 0; color: var(--fw-ink); font-weight: 500; }
      .row { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid var(--fw-line); font-size: 0.86rem; } .row:first-of-type { border-top: 0; }
      .row > div { display: grid; flex: 1; line-height: 1.3; } .row small { color: var(--fw-muted); font-size: 0.74rem; } .ico { color: var(--fw-blue); font-size: 24px; width: 28px; }
      .soon { font-size: 0.7rem; color: var(--fw-muted); background: #eef2f8; border-radius: 6px; padding: 3px 8px; }
      .sw { width: 42px; height: 24px; border-radius: 99px; border: 0; background: #cdd6e4; position: relative; cursor: pointer; padding: 0; transition: background 0.2s; } .sw i { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.2s; } .sw.on { background: var(--fw-blue); } .sw.on i { transform: translateX(18px); }
      select { border: 1px solid var(--fw-line-strong); border-radius: 8px; padding: 6px 8px; font: 400 0.82rem Poppins, sans-serif; background: #fff; min-width: 112px; }
      .hint { display: block; color: var(--fw-muted); font-size: 0.72rem; margin-top: 8px; }
      .danger { display: flex; justify-content: space-between; align-items: center; gap: 16px; border-color: #f6d6de; } .danger h2 { margin: 0 0 4px; font-size: 1.05rem; color: #be123c; }
      @media (max-width: 1100px) { .grid3 { grid-template-columns: 1fr 1fr; } .head { grid-template-columns: 1fr; } .script, .secure { display: none; } }
      @media (max-width: 800px) { .grid2, .grid3 { grid-template-columns: 1fr; } .kyc { flex-direction: column; align-items: flex-start; } .danger { flex-direction: column; align-items: flex-start; } }
    `,
  ],
  styleUrl: '../../website/website-ui.scss',
})
export class AccountSettingsComponent {
  protected readonly auth = inject(AuthService);
  private readonly portal = inject(CustomerPortalService);

  protected readonly prefs = signal<Prefs>(loadPrefs());
  protected readonly data = signal<CustomerDashboard | null>(null);

  protected readonly notifs: { key: 'appUpdates' | 'docUpdates' | 'offers' | 'alerts' | 'system'; label: string; icon: string }[] = [
    { key: 'appUpdates', label: 'Application Updates', icon: 'mail' },
    { key: 'docUpdates', label: 'Document Updates', icon: 'description' },
    { key: 'offers', label: 'Offers & Promotions', icon: 'redeem' },
    { key: 'alerts', label: 'Account Alerts', icon: 'notifications_active' },
    { key: 'system', label: 'System Updates', icon: 'settings' },
  ];

  protected readonly selects: { key: 'language' | 'theme' | 'currency' | 'mode'; label: string; icon: string; options: string[] }[] = [
    { key: 'language', label: 'Language', icon: 'language', options: ['English', 'हिन्दी', 'मराठी'] },
    { key: 'theme', label: 'Theme', icon: 'dark_mode', options: ['Light Mode'] },
    { key: 'currency', label: 'Currency', icon: 'currency_rupee', options: ['INR (₹)'] },
    { key: 'mode', label: 'Communication Mode', icon: 'notifications', options: ['Email & SMS', 'Email only', 'SMS only'] },
  ];

  constructor() {
    this.portal.dashboard().subscribe({ next: (d) => this.data.set(d), error: () => undefined });
  }

  protected percent(): number {
    return this.data()?.profile_completion.percent ?? 0;
  }

  protected steps(): { key: string; label: string; done: boolean }[] {
    return this.data()?.profile_completion.steps ?? [];
  }

  protected toggle(key: 'appUpdates' | 'docUpdates' | 'offers' | 'alerts' | 'system'): void {
    this.save({ ...this.prefs(), [key]: !this.prefs()[key] });
  }

  protected setSelect(key: 'language' | 'theme' | 'currency' | 'mode', value: string): void {
    this.save({ ...this.prefs(), [key]: value });
  }

  private save(p: Prefs): void {
    this.prefs.set(p);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch {
      /* storage unavailable — keep in memory */
    }
  }
}
