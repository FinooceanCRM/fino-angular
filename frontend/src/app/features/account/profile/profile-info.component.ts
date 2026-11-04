import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Address, ProfileView } from '@core/models/customer-profile.model';
import { AuthService } from '@core/services/auth.service';
import { CustomerProfileService } from '@core/services/customer-profile.service';

import { WEBSITE } from '../../website/website.config';
import { ProfileHeadComponent } from './profile-head.component';

const PHONE = /^[0-9+\-\s()]{10,16}$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR = /^\d{4} ?\d{4} ?\d{4}$/;

function adult(c: AbstractControl): ValidationErrors | null {
  const v = c.value as string;
  if (!v) return null;
  const born = new Date(v);
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return Number.isNaN(born.getTime()) || born.getFullYear() < 1900 ? { dob: true } : born > limit ? { underage: true } : null;
}

export const PROFILE_TABS = [
  { label: 'Personal Information', link: '/account/profile', icon: 'badge', exact: true },
  { label: 'KYC Documents', link: '/account/profile/kyc', icon: 'groups' },
  { label: 'Bank Details', link: '/account/profile/bank', icon: 'account_balance' },
  { label: 'Communication Preferences', link: '/account/profile/communication', icon: 'mail' },
  { label: 'Change Password', link: '/account/profile/security', icon: 'lock' },
  { label: 'Delete Account', link: '/account/profile/delete', icon: 'delete_outline' },
];

/** My Profile — layout follows images/12_Dashboard/05_Profile_Settings/01_My_Profile.png. */
@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive, ProfileHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-profile-head title="My Profile" subtitle="Manage your personal information, documents, security settings and preferences."
      [crumbs]="[{ label: 'Profile', link: '/account/profile' }, { label: 'Personal Information' }]" />

    <nav class="tabs" aria-label="Profile sections">
      @for (t of tabs; track t.link) { <a [routerLink]="t.link" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: !!t.exact }"><span class="material-icons">{{ t.icon }}</span>{{ t.label }}</a> }
    </nav>

    @if (error()) {
      <div class="fw-alert fw-alert--error" role="alert">{{ error() }} <button class="link" type="button" (click)="load()">Retry</button></div>
    } @else if (!view()) {
      <div class="fw-skeleton" style="height:240px;margin-bottom:14px"></div>
    } @else {
      @if (view(); as v) {
        <div class="top">
          <section class="panel">
            <div class="ph"><h2>Personal Information</h2>
              @if (!editing()) { <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="startEdit()"><span class="material-icons">edit</span>Edit</button> }
              @else { <span class="muted">Editing</span> }</div>
            <form [formGroup]="form" class="grid2" (ngSubmit)="save()" novalidate>
              <div class="f"><label for="pi-name">Full Name *</label><input id="pi-name" class="in" formControlName="name" autocomplete="name" />
                @if (bad('name')) { <small class="err">Enter your full name.</small> }</div>
              <div class="f"><label for="pi-dob">Date of Birth *</label><input id="pi-dob" class="in" type="date" formControlName="dob" [max]="maxDob" />
                @if (bad('dob')) { <small class="err">{{ form.controls.dob.hasError('underage') ? 'You must be at least 18 years old.' : 'Enter a valid date of birth.' }}</small> }</div>
              <div class="f"><label for="pi-gender">Gender *</label><select id="pi-gender" class="in" formControlName="gender"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div class="f"><label for="pi-marital">Marital Status *</label><select id="pi-marital" class="in" formControlName="marital"><option value="">Select</option><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option></select></div>
              <div class="f"><label for="pi-phone">Mobile Number *</label><input id="pi-phone" class="in" type="tel" formControlName="phone" autocomplete="tel" />
                @if (bad('phone')) { <small class="err">Enter a valid mobile number.</small> }</div>
              <div class="f"><label for="pi-email">Email Address</label><input id="pi-email" class="in" [value]="v.email" readonly /><small class="muted">To change your email, contact support.</small></div>
              <div class="f"><label for="pi-occ">Occupation</label><input id="pi-occ" class="in" formControlName="occupation" maxlength="100" /></div>
              <div class="f"><label for="pi-id">Customer ID</label><input id="pi-id" class="in" [value]="v.customer_id ?? '—'" readonly /></div>
            </form>
          </section>

          <section class="panel photo">
            <h2>Profile Photo</h2>
            <div class="photo__row">
              @if (photo(); as src) { <img class="avatar" [src]="src" alt="Your profile photo" /> } @else { <span class="avatar avatar--init">{{ initials() }}</span> }
              <div class="photo__act">
                <label class="fw-btn fw-btn--ghost fw-btn--sm up">Change Photo<input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" (change)="pickPhoto($event)" aria-label="Choose a profile photo" /></label>
                @if (v.has_photo) { <button type="button" class="link" (click)="removePhoto()">Remove photo</button> }
                <small class="muted">JPG, PNG up to 2 MB</small>
              </div>
            </div>
            <div class="tip"><span class="material-icons">lightbulb</span>A clear photo helps with faster verification and builds trust.</div>
          </section>

          <section class="panel promo">
            <p class="script" aria-hidden="true">A complete profile<br />gets you faster<br />loan approvals!</p>
            <ul><li><span class="material-icons">check_circle</span>Verify your details</li><li><span class="material-icons">check_circle</span>Keep documents updated</li><li><span class="material-icons">check_circle</span>Get better offers</li></ul>
          </section>
        </div>

        <section class="panel loanf">
          <div class="ph"><h2>Loan Application Details <span class="opt">Optional</span></h2>
            @if (!editing()) { <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="startEdit()"><span class="material-icons">edit</span>Edit</button> }
            @else { <span class="muted">Editing</span> }</div>
          <p class="muted loanf__tip"><span class="material-icons">auto_fix_high</span>Nothing here is required. Save it once and we fill it in automatically whenever you apply for a loan; you can still change it on the form.</p>
          <form [formGroup]="form" class="grid2" (ngSubmit)="save()" novalidate>
            <div class="f"><label for="pi-pan">PAN Number</label><input id="pi-pan" class="in" formControlName="pan" maxlength="10" autocapitalize="characters" placeholder="ABCDE1234F" (input)="upperPan($event)" />
              @if (bad('pan')) { <small class="err">PAN looks like ABCDE1234F.</small> }</div>
            <div class="f"><label for="pi-aadhaar">Aadhaar Number</label><input id="pi-aadhaar" class="in" formControlName="aadhaar" inputmode="numeric" maxlength="14" autocomplete="off" [placeholder]="v.aadhaar_masked ?? '1234 5678 9012'" (input)="groupAadhaar($event)" />
              @if (bad('aadhaar')) { <small class="err">Aadhaar has 12 digits.</small> }
              @else if (v.aadhaar_masked) { <small class="muted">Saved as {{ v.aadhaar_masked }}. Leave blank to keep it, or type a new number to replace it.</small> }
              @else { <small class="muted">Stored encrypted and shown only to you.</small> }</div>
            <div class="f f--w"><fieldset class="radios"><legend>Employment Type</legend>
              @for (t of employmentTypes; track t.value) { <label class="radio"><input type="radio" formControlName="employmentType" [value]="t.value" />{{ t.label }}</label> }
            </fieldset></div>
            <div class="f"><label for="pi-company">Company / Business Name</label><input id="pi-company" class="in" formControlName="company" maxlength="150" /></div>
            <div class="f"><label for="pi-desig">Designation</label><input id="pi-desig" class="in" formControlName="designation" maxlength="100" /></div>
            <div class="f"><label for="pi-exp">Work Experience (years)</label><input id="pi-exp" class="in" type="number" inputmode="decimal" min="0" max="60" formControlName="experience" />
              @if (bad('experience')) { <small class="err">Enter 0 to 60 years.</small> }</div>
            <div class="f"><label for="pi-income">Monthly Income (₹)</label><input id="pi-income" class="in" type="number" inputmode="numeric" min="0" formControlName="income" />
              @if (bad('income')) { <small class="err">Enter a valid amount.</small> }</div>
            <div class="f"><label for="pi-wcity">Work City</label><input id="pi-wcity" class="in" formControlName="workCity" maxlength="100" /></div>
            <div class="f"><label for="pi-office">Office Address</label><input id="pi-office" class="in" formControlName="officeAddress" maxlength="255" /></div>
          </form>
        </section>

        <div class="mid">
          <section class="panel">
            <div class="ph"><h2>Current Address</h2>
              @if (!editAddr()) { <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="editAddr.set(true)"><span class="material-icons">edit</span>Edit</button> }</div>
            @if (!editAddr()) {
              <p class="addr">{{ addressText(v.current_address) }}</p>
            } @else {
              <form [formGroup]="current" class="grid2">
                <div class="f f--w"><label for="ca1">Address line 1 *</label><input id="ca1" class="in" formControlName="line1" /></div>
                <div class="f f--w"><label for="ca2">Address line 2</label><input id="ca2" class="in" formControlName="line2" /></div>
                <div class="f"><label for="cc">City *</label><input id="cc" class="in" formControlName="city" /></div>
                <div class="f"><label for="cs">State *</label><input id="cs" class="in" formControlName="state" /></div>
                <div class="f"><label for="cp">Pincode *</label><input id="cp" class="in" inputmode="numeric" maxlength="6" formControlName="pincode" />
                  @if (current.controls.pincode.invalid && current.controls.pincode.touched) { <small class="err">Pincode has 6 digits.</small> }</div>
              </form>
            }

            <div class="ph perm"><h2>Permanent Address</h2>
              @if (!editAddr()) { <span class="pill pill--info">{{ v.permanent_same_as_current ? 'Same as Current' : 'Saved' }}</span> }
              @else { <label class="same"><input type="checkbox" [checked]="same()" (change)="same.set($any($event.target).checked)" /> Same as current address</label> }</div>
            @if (!editAddr()) {
              <p class="addr">{{ addressText(v.permanent_address) }}</p>
            } @else if (!same()) {
              <form [formGroup]="permanent" class="grid2">
                <div class="f f--w"><label for="pa1">Address line 1 *</label><input id="pa1" class="in" formControlName="line1" /></div>
                <div class="f f--w"><label for="pa2">Address line 2</label><input id="pa2" class="in" formControlName="line2" /></div>
                <div class="f"><label for="pc">City *</label><input id="pc" class="in" formControlName="city" /></div>
                <div class="f"><label for="ps">State *</label><input id="ps" class="in" formControlName="state" /></div>
                <div class="f"><label for="pp">Pincode *</label><input id="pp" class="in" inputmode="numeric" maxlength="6" formControlName="pincode" /></div>
              </form>
            }
          </section>

          <div class="stack">
            <section class="panel">
              <h2>Quick Actions</h2>
              <div class="qa">
                <a routerLink="/account/profile/kyc"><span class="material-icons">assignment_ind</span><b>Update KYC</b><small>Keep your documents up to date</small></a>
                <a routerLink="/account/profile/bank"><span class="material-icons">account_balance</span><b>Manage Bank Details</b><small>Add or update your bank account</small></a>
                <a routerLink="/account/profile/security"><span class="material-icons">lock</span><b>Change Password</b><small>Keep your account secure</small></a>
                <a routerLink="/account/profile/communication"><span class="material-icons">notifications</span><b>Communication Preferences</b><small>Manage SMS, email and WhatsApp alerts</small></a>
              </div>
            </section>
            <section class="panel status">
              <h2>Account Status</h2>
              <div class="st"><span class="material-icons" [class.ok]="v.kyc.complete">{{ v.kyc.complete ? 'check_circle' : 'pending' }}</span><div><b>{{ v.kyc.complete ? 'Verified Customer' : 'KYC ' + v.kyc.percent + '% complete' }}</b>
                <small>{{ v.kyc.complete ? 'Your account is active and verified. You can apply for loans and make payments.' : 'Complete your KYC to unlock faster approvals.' }}</small></div></div>
              <a class="link" routerLink="/account/profile/overview">View KYC &amp; profile overview →</a>
              <div class="help"><b>Need Help?</b><small>Talk to our support team</small>
                <a [href]="site.phoneHref"><span class="material-icons">phone</span>{{ site.phone }}</a>
                <small>{{ site.hours }}</small>
                <a [href]="site.whatsappHref" target="_blank" rel="noopener" class="wa"><span class="material-icons">chat</span>Chat on WhatsApp</a></div>
            </section>
          </div>
        </div>

        <section class="keep">
          <span class="material-icons">info</span>
          <div><b>Keep Your Profile Updated</b><small>Updated information helps us serve you better and ensures faster loan approvals. Please review your details regularly.</small></div>
          <button type="button" class="fw-btn fw-btn--primary" [disabled]="busy() || !(editing() || editAddr())" (click)="saveAll()">{{ busy() ? 'Saving…' : 'Save Changes' }}</button>
        </section>
      }
    }

    @if (toast(); as t) { <div class="toast" [class.toast--err]="t.err" role="status">{{ t.text }}</div> }
  `,
  styles: [
    `
      .loanf { margin-bottom: 16px; } .opt { font: 500 0.7rem Poppins, sans-serif; color: var(--fw-muted); background: var(--fw-blue-soft); border-radius: 99px; padding: 2px 9px; margin-left: 8px; vertical-align: middle; }
      .loanf__tip { display: flex; gap: 8px; align-items: center; margin: 0 0 12px; font-size: 0.82rem; } .loanf__tip .material-icons { color: var(--fw-blue); font-size: 20px; }
      .loanf .radios { display: flex; gap: 8px 18px; flex-wrap: wrap; border: 0; padding: 0; margin: 0; } .loanf .radios legend { font-size: 0.84rem; font-weight: 500; margin-bottom: 6px; padding: 0; } .loanf .radio { display: flex; gap: 6px; align-items: center; font-size: 0.86rem; }
      .top { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr); gap: 16px; margin-bottom: 16px; align-items: stretch; }
      .mid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.2fr); gap: 16px; margin-bottom: 16px; align-items: start; }
      .stack { display: grid; gap: 16px; } .f--w { grid-column: 1 / -1; }
      .photo__row { display: flex; gap: 16px; align-items: center; margin: 8px 0 12px; } .avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 3px solid var(--fw-blue-soft); flex: none; } .avatar--init { display: grid; place-items: center; background: linear-gradient(135deg, var(--fw-blue), var(--fw-navy-2)); color: #fff; font-size: 1.8rem; font-weight: 600; }
      .photo__act { display: grid; gap: 6px; justify-items: start; } .up { position: relative; overflow: hidden; } .up input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
      .tip { display: flex; gap: 10px; align-items: center; background: var(--fw-blue-soft); border-radius: 10px; padding: 10px 12px; font-size: 0.8rem; color: var(--fw-ink); } .tip .material-icons { color: var(--fw-blue); }
      .promo { background: linear-gradient(160deg, #eaf2ff, #dbe8fb); display: grid; align-content: center; gap: 12px; } .promo .script { font-family: Lora, serif; font-style: italic; font-size: 1.2rem; line-height: 1.3; color: var(--fw-navy-2); margin: 0; }
      .promo ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 0.88rem; } .promo li { display: flex; gap: 8px; align-items: center; } .promo .material-icons { color: #16a34a; }
      .addr { margin: 0 0 14px; font-size: 0.88rem; line-height: 1.6; color: var(--fw-ink); white-space: pre-line; } .perm { margin-top: 8px; } .same { display: flex; gap: 8px; align-items: center; font-size: 0.82rem; }
      .qa { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; } .qa a { display: grid; gap: 2px; padding: 12px; border: 1px solid var(--fw-line); border-radius: 12px; text-decoration: none; color: var(--fw-ink); } .qa a:hover { border-color: var(--fw-blue); } .qa .material-icons { color: var(--fw-blue); font-size: 28px; } .qa small { color: var(--fw-muted); font-size: 0.72rem; line-height: 1.3; }
      .st { display: flex; gap: 10px; margin: 8px 0; } .st > .material-icons { font-size: 28px; color: #d97706; } .st > .material-icons.ok { color: #16a34a; } .st div { display: grid; line-height: 1.35; } .st small { color: var(--fw-muted); font-size: 0.76rem; }
      .help { display: grid; gap: 4px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--fw-line); } .help a { display: flex; gap: 8px; align-items: center; text-decoration: none; color: var(--fw-ink); font-weight: 600; font-size: 0.88rem; } .help .material-icons { color: var(--fw-blue); font-size: 20px; } .help .wa { color: #15803d; } .help .wa .material-icons { color: #22c55e; } .help small { color: var(--fw-muted); font-size: 0.74rem; }
      .keep { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; background: var(--fw-blue-soft); border: 1px solid #dbe8fb; border-radius: 14px; padding: 16px 20px; } .keep > .material-icons { color: #fff; background: var(--fw-blue); border-radius: 50%; padding: 8px; } .keep div { display: grid; flex: 1; min-width: 220px; } .keep small { color: var(--fw-muted); font-size: 0.8rem; }
      @media (max-width: 1280px) { .top { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .top > :first-child { grid-column: 1 / -1; } .mid { grid-template-columns: minmax(0, 1fr); } }
      @media (max-width: 700px) { .top { grid-template-columns: minmax(0, 1fr); } .qa { grid-template-columns: 1fr; } }
    `,
  ],
  styleUrls: ['../../website/website-ui.scss', './profile.scss'],
})
export class ProfileInfoComponent {
  private readonly svc = inject(CustomerProfileService);
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);

  protected readonly site = WEBSITE;
  protected readonly tabs = PROFILE_TABS;
  protected readonly photo = this.svc.photoUrl;
  protected readonly maxDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10); })();

  protected readonly view = signal<ProfileView | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly editing = signal(false);
  protected readonly editAddr = signal(false);
  protected readonly same = signal(false);
  protected readonly busy = signal(false);
  protected readonly toast = signal<{ text: string; err: boolean } | null>(null);
  protected readonly initials = computed(() => (this.auth.user()?.name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join(''));

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    dob: ['', adult],
    gender: [''],
    marital: [''],
    phone: ['', [Validators.required, Validators.pattern(PHONE)]],
    occupation: [''],
    // optional loan-application details
    pan: ['', Validators.pattern(PAN)],
    aadhaar: ['', Validators.pattern(AADHAAR)],
    employmentType: [''],
    company: [''],
    designation: [''],
    experience: [null as number | null, [Validators.min(0), Validators.max(60)]],
    income: [null as number | null, Validators.min(0)],
    workCity: [''],
    officeAddress: [''],
  });
  private readonly addressGroup = () => this.fb.nonNullable.group({
    line1: ['', Validators.required], line2: [''], city: ['', Validators.required], state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  protected readonly current = this.addressGroup();
  protected readonly permanent = this.addressGroup();

  constructor() {
    this.load();
    this.form.disable();
  }

  protected load(): void {
    this.error.set(null);
    this.svc.profile().subscribe({
      next: (v) => { this.view.set(v); this.fill(v); },
      error: (e: { message?: string }) => this.error.set(e?.message ?? 'We could not load your profile.'),
    });
  }

  private fill(v: ProfileView): void {
    this.form.reset({ name: v.name, dob: v.dob ?? '', gender: v.gender ?? '', marital: v.marital_status ?? '', phone: v.phone ?? '', occupation: v.occupation ?? '',
      pan: v.pan ?? '', aadhaar: '', employmentType: v.employment_type ?? '', company: v.company ?? '', designation: v.designation ?? '',
      experience: v.experience_years, income: v.monthly_income, workCity: v.work_city ?? '', officeAddress: v.office_address ?? '' });
    this.current.reset({ line1: v.current_address?.line1 ?? '', line2: v.current_address?.line2 ?? '', city: v.current_address?.city ?? '', state: v.current_address?.state ?? '', pincode: v.current_address?.pincode ?? '' });
    this.permanent.reset({ line1: v.permanent_address?.line1 ?? '', line2: v.permanent_address?.line2 ?? '', city: v.permanent_address?.city ?? '', state: v.permanent_address?.state ?? '', pincode: v.permanent_address?.pincode ?? '' });
    this.same.set(v.permanent_same_as_current);
    this.form.disable();
    this.editing.set(false);
    this.editAddr.set(false);
  }

  protected startEdit(): void {
    this.form.enable();
    this.editing.set(true);
  }

  protected readonly employmentTypes = [
    { value: 'salaried', label: 'Salaried' }, { value: 'self_employed', label: 'Self Employed' },
    { value: 'business', label: 'Business Owner' }, { value: 'professional', label: 'Professional' },
  ];

  protected upperPan(e: Event): void {
    const el = e.target as HTMLInputElement;
    el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.form.controls.pan.setValue(el.value);
  }

  protected groupAadhaar(e: Event): void {
    const el = e.target as HTMLInputElement;
    el.value = el.value.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ');
    this.form.controls.aadhaar.setValue(el.value);
  }

  protected bad(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected addressText(a: Address | null): string {
    if (!a) return 'Not added yet.';
    return [a.line1, a.line2, `${a.city}, ${a.state} - ${a.pincode}`].filter(Boolean).join('\n');
  }

  protected save(): void {
    this.saveAll();
  }

  protected saveAll(): void {
    if (this.busy()) return;
    const jobs: Promise<unknown>[] = [];

    if (this.editing()) {
      this.form.markAllAsTouched();
      if (this.form.invalid) return this.flash('Please fix the highlighted fields.', true);
      const f = this.form.getRawValue();
      jobs.push(
        new Promise((res, rej) => this.svc.saveContact({ name: f.name.trim(), phone: f.phone.trim() }).subscribe({ next: res, error: rej })),
        new Promise((res, rej) => this.svc.saveDetails({ dob: f.dob || null, gender: f.gender || null, marital_status: f.marital || null, occupation: f.occupation.trim() || null,
          pan: f.pan || null, employment_type: f.employmentType || null, company: f.company.trim() || null, designation: f.designation.trim() || null,
          experience_years: f.experience, monthly_income: f.income, office_address: f.officeAddress.trim() || null, work_city: f.workCity.trim() || null,
          // a blank box keeps the saved number; only a typed one replaces it
          ...(f.aadhaar.replace(/\D/g, '').length === 12 ? { aadhaar: f.aadhaar.replace(/\D/g, '') } : {}),
        }).subscribe({ next: res, error: rej })),
      );
    }
    if (this.editAddr()) {
      this.current.markAllAsTouched();
      if (this.current.invalid || (!this.same() && this.permanent.invalid)) return this.flash('Please complete the address fields (pincode has 6 digits).', true);
      const body: { current_address: Address; permanent_same_as_current: boolean; permanent_address?: Address } = { current_address: this.current.getRawValue(), permanent_same_as_current: this.same() };
      if (!this.same()) body.permanent_address = this.permanent.getRawValue();
      jobs.push(new Promise((res, rej) => this.svc.saveAddresses(body).subscribe({ next: res, error: rej })));
    }
    if (!jobs.length) return;

    this.busy.set(true);
    Promise.all(jobs)
      .then(() => {
        this.busy.set(false);
        this.flash('Your profile has been saved.');
        void this.auth.loadCurrentUser().subscribe();
        this.load();
      })
      .catch((e: { message?: string; errors?: Record<string, string[]> }) => {
        this.busy.set(false);
        this.flash(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'We could not save your profile.', true);
      });
  }

  protected pickPhoto(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) return this.flash('Please choose a JPG or PNG photo.', true);
    if (file.size > 2 * 1024 * 1024) return this.flash('That photo is larger than 2 MB.', true);
    this.svc.uploadPhoto(file).subscribe({
      next: () => { this.flash('Photo updated.'); this.load(); },
      error: (err: { message?: string; errors?: Record<string, string[]> }) => this.flash(Object.values(err?.errors ?? {}).flat()[0] ?? err?.message ?? 'The photo could not be uploaded.', true),
    });
  }

  protected removePhoto(): void {
    this.svc.removePhoto().subscribe({ next: () => { this.flash('Photo removed.'); this.load(); }, error: () => this.flash('Could not remove the photo.', true) });
  }

  private flash(text: string, err = false): void {
    this.toast.set({ text, err });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
