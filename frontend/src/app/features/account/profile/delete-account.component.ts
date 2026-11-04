import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CustomerProfileService } from '@core/services/customer-profile.service';

import { WEBSITE } from '../../website/website.config';
import { ProfileHeadComponent } from './profile-head.component';

const REASONS = ['I no longer need a loan', 'I found a better offer elsewhere', 'I am not happy with the service', 'Privacy concerns', 'I have duplicate accounts', 'Other'];

/** Delete Account & Data Request — layout follows images/12_Dashboard/05_Profile_Settings/09_Delete_Account.png. */
@Component({
  selector: 'app-profile-delete',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, ProfileHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-profile-head title="Delete Account & Data Request" subtitle="You can request to delete your account or download your personal data. We’re here to make the process simple and transparent."
      [crumbs]="[{ label: 'Profile', link: '/account/profile' }, { label: 'Delete Account & Data Request' }]"
      secureTitle="Your data, your control" secureText="We respect your privacy and give you full control over your personal information." />

    <nav class="tabs" aria-label="Sections">
      <button type="button" [class.on]="tab() === 'd'" (click)="go('d', 'sec-d')">Delete Account</button>
      <button type="button" [class.on]="tab() === 'r'" (click)="go('r', 'sec-r')">Data Request</button>
      <button type="button" [class.on]="tab() === 'w'" (click)="go('w', 'sec-w')">What Happens?</button>
      <button type="button" [class.on]="tab() === 'h'" (click)="go('h', 'sec-h')">Help &amp; Support</button>
    </nav>

    @if (requestedAt(); as when) {
      <section class="panel pending" role="status">
        <span class="material-icons">hourglass_top</span>
        <div><h2>Your deletion request has been received</h2><p class="sub">Requested on {{ when | date: 'd MMM y, h:mm a' }}. Our team will review it and contact you before anything is removed. You can still change your mind.</p></div>
        <button type="button" class="fw-btn fw-btn--ghost" [disabled]="busy()" (click)="cancel()">Cancel Request</button>
      </section>
    }

    <div class="cols">
      <section class="panel" id="sec-w">
        <h2>Before You Delete Your Account</h2><p class="sub">Please review the following important information:</p>
        <div class="item"><span class="ic"><span class="material-icons">description</span></span><div><b>Active Loans &amp; Applications</b><small>You cannot delete your account if you have an active loan or ongoing application. Please close all loans and complete pending applications first.</small></div></div>
        <div class="item"><span class="ic"><span class="material-icons">folder_delete</span></span><div><b>Your Data Will Be Permanently Deleted</b><small>All your personal information, documents and account data will be permanently removed from our systems.</small></div></div>
        <div class="item"><span class="ic ic--red"><span class="material-icons">block</span></span><div><b>This Action Cannot Be Undone</b><small>Once your account is deleted, it cannot be recovered. You will need to create a new account to use our services again.</small></div></div>
        <div class="item"><span class="ic"><span class="material-icons">notifications_off</span></span><div><b>Ongoing Services Will Be Stopped</b><small>All notifications, payment reminders and other services will be discontinued immediately.</small></div></div>
        <div class="item"><span class="ic"><span class="material-icons">download</span></span><div><b>You Can Download Your Data</b><small>Before deleting your account, you can request a copy of your personal data for your records.</small></div></div>
        <div class="warn"><span class="material-icons">priority_high</span><div><b>Are you sure you want to delete your account?</b><small>This action is permanent and cannot be undone.</small></div></div>
      </section>

      <section class="panel" id="sec-d">
        <h2>Request Account Deletion</h2><p class="sub">Please tell us the reason for deleting your account. This will help us improve our services.</p>
        @if (error()) { <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div> }
        @if (sent()) { <div class="fw-alert fw-alert--success" role="status">Your request has been received. We will contact you before anything is removed.</div> }
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="f"><label for="d-reason">Reason for Deletion *</label><select id="d-reason" class="in" formControlName="reason"><option value="">Select a reason</option>@for (r of reasons; track r) { <option [value]="r">{{ r }}</option> }</select>
            @if (bad('reason')) { <small class="err">Please choose a reason.</small> }</div>
          <div class="f"><label for="d-comm">Additional Comments (Optional)</label><textarea id="d-comm" class="in" formControlName="comments" maxlength="500" placeholder="Tell us more (optional)"></textarea><small class="count">{{ form.controls.comments.value.length }}/500</small></div>
          <div class="f"><label for="d-pw">Your password *</label><input id="d-pw" class="in" type="password" formControlName="password" autocomplete="current-password" placeholder="Confirm it’s you" />
            @if (bad('password')) { <small class="err">Enter your password to continue.</small> }</div>
          <div class="hint"><span class="material-icons">info</span>Our team may contact you to understand your feedback and assist you if needed.</div>
          <label class="agree"><input type="checkbox" formControlName="confirm" /> I understand that this action will permanently delete my account and all associated data. I confirm that I have no active loans or pending applications.</label>
          @if (bad('confirm')) { <small class="err">Please confirm to continue.</small> }
          <button type="submit" class="fw-btn fw-btn--danger fw-btn--block" [disabled]="busy() || !!requestedAt()">{{ busy() ? 'Sending…' : 'Delete My Account' }}</button>
        </form>
      </section>

      <section class="panel side" id="sec-h">
        <div class="bin"><span class="material-icons">delete_forever</span></div>
        <h3>Your Privacy Matters</h3><p class="sub">We are committed to protecting your data, even after you leave.</p>
        <div class="active"><b>Still have an active loan?</b><small>Talk to our support team for assistance.</small>
          <a class="fw-btn fw-btn--ghost fw-btn--sm fw-btn--block" routerLink="/account/help">Contact Support</a>
          <a class="ph2" [href]="site.phoneHref"><span class="material-icons">phone</span>{{ site.phone }}</a><small>{{ site.hours }}</small>
          <a class="ph2 wa" [href]="site.whatsappHref" target="_blank" rel="noopener"><span class="material-icons">chat</span>Chat on WhatsApp</a></div>
      </section>
    </div>

    <div class="foot" id="sec-r">
      <section class="panel"><span class="material-icons big">download</span><div><h3>Request a Copy of Your Data</h3><p class="sub">You can download a copy of your personal data before deleting your account.</p>
        @if (dataError()) { <small class="err">{{ dataError() }}</small> }
        <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" [disabled]="busyData()" (click)="download()">{{ busyData() ? 'Preparing…' : 'Request My Data' }}</button></div></section>
      <section class="panel"><span class="material-icons big">support_agent</span><div><h3>Need Help?</h3><p class="sub">Have questions? Our support team is here to help you.</p><a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/help">Contact Support</a></div></section>
      <section class="panel"><span class="material-icons big">verified_user</span><div><h3>Our Commitment</h3><p class="sub">We follow strict data protection policies and comply with applicable privacy laws.</p><a class="link" routerLink="/privacy-policy">Read Our Privacy Policy →</a></div></section>
    </div>
  `,
  styles: [
    `
      .pending { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; background: #fff8e6; border-color: #f6e0a3; margin-bottom: 16px; } .pending > .material-icons { font-size: 36px; color: #d97706; } .pending div { flex: 1; min-width: 240px; } .pending .sub { margin: 4px 0 0; }
      .cols { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1.1fr) minmax(0, 0.8fr); gap: 16px; margin-bottom: 16px; align-items: start; }
      .item { display: flex; gap: 12px; padding: 12px; border: 1px solid var(--fw-line); border-radius: 12px; margin-bottom: 10px; } .item div { display: grid; line-height: 1.35; } .item small { color: var(--fw-muted); font-size: 0.78rem; }
      .ic { width: 42px; height: 42px; border-radius: 10px; background: var(--fw-blue-soft); color: var(--fw-blue); display: grid; place-items: center; flex: none; } .ic--red { background: #fee2e2; color: #dc2626; }
      .warn { display: flex; gap: 12px; align-items: center; background: #fef2f2; border: 1px solid #fbcaca; border-radius: 12px; padding: 12px 14px; } .warn > .material-icons { background: #dc2626; color: #fff; border-radius: 50%; padding: 6px; } .warn div { display: grid; } .warn b { color: #b91c1c; } .warn small { color: var(--fw-muted); }
      form { display: grid; gap: 12px; } .count { text-align: right; color: var(--fw-muted); font-size: 0.72rem; } .hint { display: flex; gap: 8px; align-items: center; font-size: 0.78rem; color: var(--fw-muted); background: var(--fw-blue-soft); border-radius: 10px; padding: 10px 12px; } .hint .material-icons { color: var(--fw-blue); }
      .agree { display: flex; gap: 8px; align-items: flex-start; font-size: 0.8rem; line-height: 1.5; } .fw-btn--danger { background: #dc2626; color: #fff; border: 0; } .fw-btn--danger:hover:not(:disabled) { background: #b91c1c; } .fw-btn--danger:disabled { opacity: 0.55; cursor: not-allowed; }
      .side { text-align: center; } .bin { display: grid; place-items: center; margin-bottom: 6px; } .bin .material-icons { font-size: 72px; color: var(--fw-blue); } .active { text-align: left; background: #fef2f2; border: 1px solid #fbcaca; border-radius: 12px; padding: 12px; display: grid; gap: 6px; margin-top: 10px; } .active small { color: var(--fw-muted); }
      .ph2 { display: flex; gap: 8px; align-items: center; text-decoration: none; color: var(--fw-ink); font-weight: 600; font-size: 0.86rem; } .ph2 .material-icons { color: var(--fw-blue); font-size: 20px; } .wa { color: #15803d; } .wa .material-icons { color: #22c55e; }
      .foot { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; } .foot .panel { display: flex; gap: 14px; align-items: flex-start; } .big { font-size: 40px; color: var(--fw-blue); } .foot div { display: grid; gap: 6px; justify-items: start; }
      @media (max-width: 1280px) { .cols { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .cols .side { grid-column: 1 / -1; } .foot { grid-template-columns: minmax(0, 1fr); } }
      @media (max-width: 800px) { .cols { grid-template-columns: minmax(0, 1fr); } }
    `,
  ],
  styleUrls: ['../../website/website-ui.scss', './profile.scss'],
})
export class ProfileDeleteComponent {
  private readonly svc = inject(CustomerProfileService);
  private readonly fb = inject(FormBuilder);

  protected readonly site = WEBSITE;
  protected readonly reasons = REASONS;
  protected readonly tab = signal<'d' | 'r' | 'w' | 'h'>('d');
  protected readonly requestedAt = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly busyData = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dataError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    reason: ['', Validators.required],
    comments: ['', Validators.maxLength(500)],
    password: ['', Validators.required],
    confirm: [false, Validators.requiredTrue],
  });

  constructor() {
    this.svc.profile().subscribe({ next: (p) => this.requestedAt.set(p.deletion_requested_at), error: () => undefined });
  }

  protected bad(name: 'reason' | 'password' | 'confirm'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected go(t: 'd' | 'r' | 'w' | 'h', id: string): void {
    this.tab.set(t);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected submit(): void {
    this.error.set(null);
    this.sent.set(false);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    const f = this.form.getRawValue();
    this.busy.set(true);
    this.svc.requestDeletion({ password: f.password, reason: f.reason, comments: f.comments.trim(), confirm: true }).subscribe({
      next: () => {
        this.busy.set(false);
        this.sent.set(true);
        this.form.reset({ reason: '', comments: '', password: '', confirm: false });
        this.svc.profile().subscribe((p) => this.requestedAt.set(p.deletion_requested_at));
      },
      error: (e: { message?: string; errors?: Record<string, string[]> }) => {
        this.busy.set(false);
        this.error.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'We could not send your request.');
        this.form.controls.password.reset('');
      },
    });
  }

  protected cancel(): void {
    this.busy.set(true);
    this.svc.cancelDeletion().subscribe({
      next: () => { this.busy.set(false); this.requestedAt.set(null); this.sent.set(false); },
      error: (e: { message?: string }) => { this.busy.set(false); this.error.set(e?.message ?? 'Could not cancel the request.'); },
    });
  }

  protected download(): void {
    this.busyData.set(true);
    this.dataError.set(null);
    this.svc.downloadMyData().then(() => this.busyData.set(false)).catch(() => { this.busyData.set(false); this.dataError.set('We could not prepare your data. Please try again.'); });
  }
}
