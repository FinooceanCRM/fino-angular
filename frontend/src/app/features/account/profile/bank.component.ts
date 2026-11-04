import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BankAccount, UpiId } from '@core/models/customer-profile.model';
import { AuthService } from '@core/services/auth.service';
import { CustomerProfileService } from '@core/services/customer-profile.service';

import { WEBSITE } from '../../website/website.config';
import { ProfileHeadComponent } from './profile-head.component';

const BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Bank of Baroda', 'Punjab National Bank', 'Union Bank of India', 'Canara Bank', 'IndusInd Bank', 'Yes Bank', 'IDFC FIRST Bank', 'Bank of India', 'Indian Bank'];
type Tab = 'details' | 'upi' | 'verification' | 'history' | 'manage';

function sameAs(other: string) {
  return (c: AbstractControl): ValidationErrors | null => (c.parent && c.value !== c.parent.get(other)?.value ? { mismatch: true } : null);
}

/** Bank Details & Payment Account — layout follows images/12_Dashboard/05_Profile_Settings/04_Bank_Details.png. */
@Component({
  selector: 'app-profile-bank',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgTemplateOutlet, ProfileHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-profile-head title="Bank Details & Payment Account" subtitle="Add or update your bank account details to receive loan disbursal and other payments securely."
      [crumbs]="[{ label: 'Profile', link: '/account/profile' }, { label: 'Bank Details' }]"
      secureTitle="Your bank details are secure" secureText="We use bank-grade encryption to protect your information. Full account numbers are never shown again." />

    <div class="sum">
      <section class="panel acct">
        <h2>Linked Bank Account</h2>
        @if (primary(); as p) {
          <div class="acct__main">
            <span class="bk material-icons">account_balance</span>
            <div class="acct__n"><b>{{ p.bank_name }}</b><small>{{ cap(p.account_type) }} Account</small></div>
            <span [class]="'pill pill--' + (p.status === 'verified' ? 'ok' : 'pending')">{{ p.status === 'verified' ? 'Verified' : 'Pending verification' }}</span>
          </div>
          <span class="pill pill--info tagp">Primary Account</span>
        } @else { <p class="muted">No bank account linked yet. Add one below.</p> }
      </section>
      <section class="panel acct2">
        @if (primary(); as p) {
          <dl><dt>Account Number</dt><dd>{{ p.account_masked }}</dd><dt>IFSC Code</dt><dd>{{ p.ifsc }}</dd><dt>Account Holder Name</dt><dd>{{ p.holder_name }}</dd></dl>
        } @else { <p class="muted">Your account details will appear here once saved.</p> }
      </section>
      <section class="panel safe"><div><p class="script" aria-hidden="true">Safe Payments.<br />Secure Future.</p>
        <ul><li><span class="material-icons">check_circle</span>Secure bank verification</li><li><span class="material-icons">check_circle</span>Fast loan disbursal</li><li><span class="material-icons">check_circle</span>Your money, your control</li></ul></div></section>
    </div>

    <nav class="tabs" aria-label="Bank sections">
      @for (t of tabs; track t.key) { <button type="button" [class.on]="tab() === t.key" (click)="tab.set(t.key)">{{ t.label }}</button> }
    </nav>

    @if (error()) { <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div> }
    @if (msg(); as m) { <div class="fw-alert fw-alert--success" role="status">{{ m }}</div> }

    @switch (tab()) {
      @case ('details') {
        <div class="cols">
          <section class="panel">
            <h2>Add / Update Bank Details</h2>
            <form [formGroup]="form" (ngSubmit)="save()" novalidate>
              <div class="f"><label for="b-name">Account Holder Name *</label><input id="b-name" class="in" formControlName="holder_name" autocomplete="name" />
                @if (bad('holder_name')) { <small class="err">Enter the name on the account.</small> }</div>
              <div class="f"><label for="b-bank">Bank Name *</label>
                <select id="b-bank" class="in" formControlName="bank_select"><option value="">Select bank</option>@for (b of banks; track b) { <option [value]="b">{{ b }}</option> }<option value="__other">Other…</option></select>
                @if (form.controls.bank_select.value === '__other') { <input class="in" formControlName="bank_other" placeholder="Bank name" aria-label="Bank name" /> }
                @if (bad('bank_select') || bad('bank_other')) { <small class="err">Choose or enter your bank.</small> }</div>
              <div class="grid2">
                <div class="f"><label for="b-acc">Account Number *</label><input id="b-acc" class="in" inputmode="numeric" formControlName="account_number" maxlength="18" autocomplete="off" />
                  @if (bad('account_number')) { <small class="err">Account numbers have 9 to 18 digits.</small> }</div>
                <div class="f"><label for="b-acc2">Confirm Account Number *</label><input id="b-acc2" class="in" inputmode="numeric" formControlName="account_number_confirmation" maxlength="18" autocomplete="off" />
                  @if (bad('account_number_confirmation')) { <small class="err">The two numbers don’t match.</small> }</div>
                <div class="f"><label for="b-ifsc">IFSC Code *</label><input id="b-ifsc" class="in" formControlName="ifsc" maxlength="11" autocapitalize="characters" placeholder="HDFC0001234" (input)="upper($event)" />
                  @if (bad('ifsc')) { <small class="err">IFSC looks like HDFC0001234.</small> }</div>
                <div class="f"><label for="b-type">Account Type *</label><select id="b-type" class="in" formControlName="account_type"><option value="savings">Savings Account</option><option value="current">Current Account</option></select></div>
              </div>
              <div class="f"><label for="b-branch">Branch Name</label><input id="b-branch" class="in" formControlName="branch" maxlength="150" /></div>
              <label class="agree"><input type="checkbox" formControlName="confirm" /> I confirm that the above bank details are correct and belong to me.</label>
              @if (bad('confirm')) { <small class="err">Please confirm to continue.</small> }
              <div class="btns"><button type="submit" class="fw-btn fw-btn--primary" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save Bank Details' }}</button><button type="button" class="fw-btn fw-btn--ghost" (click)="clear()">Clear</button></div>
            </form>
          </section>

          <div class="stack">
            <ng-container *ngTemplateOutlet="verif" />
            <section class="panel need"><span class="material-icons">edit_note</span><div><h3>Need to Update?</h3><p class="sub">You can add another account or switch your primary account anytime. New accounts are verified by our team before disbursal.</p>
              <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="tab.set('manage')">Manage Accounts</button></div></section>
          </div>

          <section class="panel info"><h3><span class="material-icons">info</span> Important Information</h3>
            <ul><li>Ensure the bank account is in your own name.</li><li>Our team verifies your account before loan disbursal.</li><li>Incorrect bank details may cause delays in loan disbursal.</li><li>You can add up to 5 bank accounts, but only one can be primary.</li><li>Keep your account active to receive payments without any issues.</li></ul></section>
        </div>
      }

      @case ('upi') {
        <section class="panel"><div class="ph"><div><h2>UPI Details</h2><p class="sub">UPI IDs you have saved for payments.</p></div><a class="fw-btn fw-btn--primary fw-btn--sm" routerLink="/account/profile/payments">Manage UPI IDs</a></div>
          @for (u of upi(); track u.id) { <div class="row"><span class="material-icons ic">qr_code_2</span><div><b>{{ u.vpa }}</b><small>{{ u.app }}</small></div>@if (u.is_primary) { <span class="pill pill--info">Primary</span> }<span [class]="'pill pill--' + u.status">{{ u.status === 'verified' ? 'Verified' : 'Not verified' }}</span></div> }
          @empty { <p class="muted">No UPI IDs saved yet.</p> }
        </section>
      }

      @case ('verification') { <ng-container *ngTemplateOutlet="verif" /> }

      @case ('history') {
        <section class="panel empty"><span class="material-icons">receipt_long</span><h2>No payments yet</h2><p class="sub">Your EMI and loan payments will appear here once your loan is disbursed.</p></section>
      }

      @case ('manage') {
        <section class="panel">
          <div class="ph"><div><h2>Manage Accounts</h2><p class="sub">You can save up to 5 bank accounts. The primary account is used for disbursal.</p></div><button type="button" class="fw-btn fw-btn--primary fw-btn--sm" (click)="tab.set('details')">Add Account</button></div>
          @for (b of banks$(); track b.id) {
            <div class="row"><span class="material-icons ic">account_balance</span>
              <div><b>{{ b.bank_name }} · {{ b.account_masked }}</b><small>{{ b.holder_name }} · {{ b.ifsc }} · {{ cap(b.account_type) }}</small></div>
              @if (b.is_primary) { <span class="pill pill--info">Primary</span> }
              <span [class]="'pill pill--' + (b.status === 'verified' ? 'ok' : 'pending')">{{ b.status === 'verified' ? 'Verified' : 'Pending' }}</span>
              @if (!b.is_primary) { <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="makePrimary(b)">Set as Primary</button> }
              <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm danger" (click)="remove(b)">Remove</button>
            </div>
          } @empty { <p class="muted">No bank accounts saved yet.</p> }
        </section>
      }
    }

    <ng-template #verif>
      <section class="panel verify">
        @if (primary(); as p) {
          <div class="vb" [class.vb--ok]="p.status === 'verified'"><span class="material-icons">{{ p.status === 'verified' ? 'check_circle' : 'hourglass_top' }}</span><div><b>{{ p.status === 'verified' ? 'Bank Account Verified' : 'Verification pending' }}</b><small>{{ p.status === 'verified' ? 'Your bank account has been verified and is ready for loan disbursal and other payments.' : 'We have saved your account. Our team verifies it before disbursal — nothing more is needed from you.' }}</small></div></div>
          <h3>Account Verification</h3>
          <ul class="vl">
            <li><span class="material-icons ok">check_circle</span>Account details saved<em class="pill pill--ok">Completed</em></li>
            <li><span class="material-icons" [class.ok]="nameMatch()">{{ nameMatch() ? 'check_circle' : 'error_outline' }}</span>Account holder name matches<em [class]="'pill pill--' + (nameMatch() ? 'ok' : 'pending')">{{ nameMatch() ? 'Completed' : 'Check name' }}</em></li>
            <li><span class="material-icons ok">check_circle</span>IFSC code format valid<em class="pill pill--ok">Completed</em></li>
            <li><span class="material-icons" [class.ok]="p.status === 'verified'">{{ p.status === 'verified' ? 'check_circle' : 'schedule' }}</span>Bank account active<em [class]="'pill pill--' + (p.status === 'verified' ? 'ok' : 'pending')">{{ p.status === 'verified' ? 'Completed' : 'Pending' }}</em></li>
            <li><span class="material-icons" [class.ok]="p.status === 'verified'">{{ p.status === 'verified' ? 'check_circle' : 'schedule' }}</span>Verified by our team<em [class]="'pill pill--' + (p.status === 'verified' ? 'ok' : 'pending')">{{ p.status === 'verified' ? 'Completed' : 'Pending' }}</em></li>
          </ul>
        } @else { <p class="muted">Save a bank account to see its verification status.</p> }
      </section>
    </ng-template>

    <section class="trust">
      <div><span class="material-icons">lock</span><span><b>100% Secure &amp; Encrypted</b><small>Your bank details are protected with bank-grade encryption and are never shared with third parties.</small></span></div>
      <div><span class="material-icons">visibility_off</span><span><b>Masked everywhere</b><small>Only the last four digits are ever shown.</small></span></div>
      <div><span class="material-icons">verified_user</span><span><b>Verified before use</b><small>Accounts are checked before any disbursal.</small></span></div>
      <div><span class="material-icons">support_agent</span><span><b>Need help?</b><small>{{ site.phone }}</small></span></div>
    </section>
  `,
  styles: [
    `
      .sum { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr); gap: 16px; margin-bottom: 16px; }
      .acct__main { display: flex; gap: 12px; align-items: center; margin: 10px 0 8px; } .bk { font-size: 38px; color: var(--fw-blue); background: var(--fw-blue-soft); border-radius: 12px; padding: 10px; } .acct__n { display: grid; flex: 1; line-height: 1.3; } .acct__n small { color: var(--fw-muted); } .tagp { margin-top: 4px; }
      .acct2 dl { display: grid; gap: 2px; margin: 0; } .acct2 dt { color: var(--fw-muted); font-size: 0.74rem; margin-top: 8px; } .acct2 dd { margin: 0; font-weight: 600; }
      .safe { background: linear-gradient(135deg, #eaf2ff, #dbe8fb); } .safe .script { font-family: Lora, serif; font-style: italic; font-size: 1.2rem; line-height: 1.25; color: var(--fw-navy-2); margin: 0 0 8px; } .safe ul, .info ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 0.84rem; } .safe li { display: flex; gap: 8px; align-items: center; } .safe .material-icons { color: #16a34a; font-size: 18px; }
      .cols { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 0.8fr); gap: 16px; align-items: start; } .stack { display: grid; gap: 16px; }
      form { display: grid; gap: 12px; } .btns { display: flex; gap: 10px; flex-wrap: wrap; } .agree { display: flex; gap: 8px; align-items: flex-start; font-size: 0.82rem; }
      .vb { display: flex; gap: 12px; align-items: center; background: #fff8e6; border: 1px solid #f6e0a3; border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; } .vb--ok { background: #eefaf2; border-color: #c9ecd5; } .vb > .material-icons { font-size: 34px; color: #d97706; } .vb--ok > .material-icons { color: #16a34a; } .vb div { display: grid; line-height: 1.35; } .vb small { color: var(--fw-muted); font-size: 0.76rem; }
      .vl { list-style: none; margin: 8px 0; padding: 0; display: grid; gap: 8px; } .vl li { display: flex; gap: 8px; align-items: center; font-size: 0.84rem; } .vl .material-icons { color: #d97706; font-size: 20px; } .vl .material-icons.ok { color: #16a34a; } .vl em { margin-left: auto; font-style: normal; }
      .need { display: flex; gap: 12px; } .need > .material-icons { font-size: 34px; color: var(--fw-blue); }
      .info h3 { display: flex; gap: 6px; align-items: center; } .info h3 .material-icons { color: var(--fw-blue); } .info li { list-style: disc; margin-left: 18px; }
      .row { display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid var(--fw-line); flex-wrap: wrap; } .row:first-of-type { border-top: 0; } .row div { display: grid; flex: 1; min-width: 180px; line-height: 1.35; } .row small { color: var(--fw-muted); font-size: 0.76rem; } .ic { color: var(--fw-blue); background: var(--fw-blue-soft); border-radius: 10px; padding: 8px; }
      .danger { color: #b91c1c; border-color: #f5b9b9; }
      .empty { text-align: center; display: grid; justify-items: center; gap: 6px; padding: 34px 20px; } .empty .material-icons { font-size: 46px; color: var(--fw-blue); } .empty h2 { margin: 0; }
      @media (max-width: 1280px) { .sum { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .sum .safe { grid-column: 1 / -1; } .cols { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .cols .info { grid-column: 1 / -1; } }
      @media (max-width: 800px) { .sum, .cols { grid-template-columns: minmax(0, 1fr); } }
    `,
  ],
  styleUrls: ['../../website/website-ui.scss', './profile.scss'],
})
export class ProfileBankComponent {
  private readonly svc = inject(CustomerProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly site = WEBSITE;
  protected readonly banks = BANKS;
  protected readonly tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Bank Account Details' },
    { key: 'upi', label: 'UPI Details' },
    { key: 'verification', label: 'Account Verification' },
    { key: 'history', label: 'Payment History' },
    { key: 'manage', label: 'Manage Accounts' },
  ];
  protected readonly tab = signal<Tab>('details');
  protected readonly banks$ = signal<BankAccount[]>([]);
  protected readonly upi = signal<UpiId[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly primary = computed(() => this.banks$().find((b) => b.is_primary) ?? this.banks$()[0] ?? null);
  protected readonly nameMatch = computed(() => {
    const p = this.primary();
    const n = (this.auth.user()?.name ?? '').trim().toLowerCase();
    return !!p && !!n && p.holder_name.trim().toLowerCase() === n;
  });

  protected readonly form = this.fb.nonNullable.group({
    holder_name: [this.auth.user()?.name ?? '', [Validators.required, Validators.minLength(2)]],
    bank_select: ['', Validators.required],
    bank_other: [''],
    account_number: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
    account_number_confirmation: ['', [Validators.required, sameAs('account_number')]],
    ifsc: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/)]],
    account_type: ['savings', Validators.required],
    branch: [''],
    confirm: [false, Validators.requiredTrue],
  });

  constructor() {
    this.reload();
    this.svc.upiIds().subscribe({ next: (u) => this.upi.set(u), error: () => undefined });
    this.form.controls.account_number.valueChanges.subscribe(() => this.form.controls.account_number_confirmation.updateValueAndValidity());
  }

  private reload(): void {
    this.svc.banks().subscribe({ next: (b) => this.banks$.set(b), error: (e: { message?: string }) => this.error.set(e?.message ?? 'We could not load your bank accounts.') });
  }

  protected bad(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected upper(e: Event): void {
    const el = e.target as HTMLInputElement;
    el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.form.controls.ifsc.setValue(el.value);
  }

  protected cap(v: string): string {
    return v ? v[0].toUpperCase() + v.slice(1) : '';
  }

  protected clear(): void {
    this.form.reset({ holder_name: this.auth.user()?.name ?? '', bank_select: '', bank_other: '', account_number: '', account_number_confirmation: '', ifsc: '', account_type: 'savings', branch: '', confirm: false });
    this.error.set(null);
  }

  protected save(): void {
    const f = this.form.getRawValue();
    const bank = f.bank_select === '__other' ? f.bank_other.trim() : f.bank_select;
    if (f.bank_select === '__other' && !bank) this.form.controls.bank_other.setErrors({ required: true });
    this.form.markAllAsTouched();
    if (this.form.invalid || !bank || this.busy()) return;

    this.busy.set(true);
    this.error.set(null);
    this.msg.set(null);
    this.svc.addBank({ holder_name: f.holder_name.trim(), bank_name: bank, account_number: f.account_number, account_number_confirmation: f.account_number_confirmation, ifsc: f.ifsc, account_type: f.account_type, branch: f.branch.trim(), confirm: true }).subscribe({
      next: (rows) => { this.busy.set(false); this.banks$.set(rows); this.msg.set('Bank account saved. Our team will verify it before disbursal.'); this.clear(); },
      error: (e: { message?: string; errors?: Record<string, string[]> }) => { this.busy.set(false); this.error.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'We could not save the bank account.'); },
    });
  }

  protected makePrimary(b: BankAccount): void {
    this.svc.primaryBank(b.id).subscribe({ next: (rows) => { this.banks$.set(rows); this.msg.set('Primary account updated.'); }, error: (e: { message?: string }) => this.error.set(e?.message ?? 'Could not update.') });
  }

  protected remove(b: BankAccount): void {
    if (!confirm(`Remove ${b.bank_name} ${b.account_masked}?`)) return;
    this.svc.deleteBank(b.id).subscribe({ next: (rows) => { this.banks$.set(rows); this.msg.set('Bank account removed.'); }, error: (e: { message?: string }) => this.error.set(e?.message ?? 'Could not remove.') });
  }
}
