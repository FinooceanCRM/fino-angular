import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { KycType, ProfileView } from '@core/models/customer-profile.model';
import { AuthService } from '@core/services/auth.service';
import { CustomerProfileService } from '@core/services/customer-profile.service';

import { WEBSITE } from '../../website/website.config';
import { ProfileHeadComponent } from './profile-head.component';

const ROWS: { type: string; label: string }[] = [
  { type: 'pan', label: 'PAN Card' }, { type: 'aadhaar', label: 'Aadhaar Card' }, { type: 'address_proof', label: 'Address Proof' },
  { type: 'selfie', label: 'Photo' }, { type: 'income_proof', label: 'Income Proof' },
];

/** KYC & Profile overview — layout follows images/12_Dashboard/05_Profile_Settings/02_KYC_Overview.png. */
@Component({
  selector: 'app-profile-kyc-overview',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, DatePipe, ProfileHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-profile-head title="KYC & Profile" subtitle="Complete your KYC, manage your profile and keep your information up to date." script="Secure Today Brighter Tomorrow"
      [crumbs]="[{ label: 'KYC & Profile' }]" icon="verified_user" tone="blue" secureTitle="Your Data is Safe with Us" secureText="We use bank-level security and encryption to protect your information." />

    <nav class="tabs" aria-label="Sections">
      <a routerLink="/account/profile/overview" routerLinkActive="on">Profile Overview</a>
      <a routerLink="/account/profile/kyc">KYC Details</a>
      <a routerLink="/account/profile/bank">Bank Details</a>
      <a routerLink="/account/profile">Address Details</a>
      <a routerLink="/account/profile/security">Change Password</a>
    </nav>

    @if (error()) {
      <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div>
    } @else if (!v()) {
      <div class="fw-skeleton" style="height:280px"></div>
    } @else {
      @if (v(); as p) {
        <div class="top">
          <section class="panel">
            <div class="ph"><h2>Profile Information</h2><a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/profile"><span class="material-icons">edit</span>Edit</a></div>
            <div class="who">
              @if (photo(); as src) { <img class="avatar" [src]="src" alt="Your profile photo" /> } @else { <span class="avatar avatar--init">{{ initials() }}</span> }
              <b>{{ p.name }}</b>
            </div>
            <dl><dt>Customer ID</dt><dd>{{ p.customer_id }}</dd><dt>Email</dt><dd>{{ p.email }}</dd><dt>Mobile</dt><dd>{{ p.phone ? '+91 ' + p.phone : '—' }}</dd><dt>Date of Birth</dt><dd>{{ p.dob ? (p.dob | date: 'dd MMM y') : '—' }}</dd><dt>Gender</dt><dd>{{ cap(p.gender) || '—' }}</dd><dt>Occupation</dt><dd>{{ p.occupation || '—' }}</dd></dl>
          </section>

          <section class="panel">
            <div class="ph"><h2>KYC Verification Status</h2><b>{{ p.kyc.percent }}% Completed</b></div>
            <div class="bar" role="progressbar" [attr.aria-valuenow]="p.kyc.percent" aria-valuemin="0" aria-valuemax="100"><i [style.width.%]="p.kyc.percent"></i></div>
            @for (r of rows(); track r.type) {
              <div class="kr"><span class="material-icons" [class.ok]="r.status === 'verified'">{{ r.status === 'verified' ? 'check_circle' : 'radio_button_unchecked' }}</span>{{ r.label }}
                <span [class]="'pill pill--' + r.status">{{ stateLabel(r) }}</span>
                @if (r.document) { <button type="button" class="link" (click)="view(r.document.id)">View</button> } @else { <a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/profile/kyc">Upload</a> }
              </div>
            }
            <a class="fw-btn fw-btn--primary fw-btn--block" routerLink="/account/profile/kyc">{{ p.kyc.complete ? 'Manage KYC Documents' : 'Complete KYC' }} <span class="material-icons">arrow_forward</span></a>
          </section>

          <div class="stack">
            <section class="panel" [class.ok]="p.kyc.complete">
              <h3><span class="material-icons">{{ p.kyc.complete ? 'check_circle' : 'pending' }}</span> {{ p.kyc.complete ? 'KYC Verified' : p.kyc.stage === 'in_review' ? 'KYC under review' : 'KYC incomplete' }}</h3>
              <p class="sub">{{ p.kyc.complete ? 'Your KYC is completed. You can apply for loans and unlock better offers.' : p.kyc.stage === 'in_review' ? 'We are verifying your documents.' : 'Upload the required documents to get verified.' }}</p></section>
            <section class="panel"><h3><span class="material-icons">support_agent</span> Need Assistance?</h3><p class="sub">Our experts are here to help you with KYC verification.</p><a class="fw-btn fw-btn--ghost fw-btn--block" routerLink="/account/help">Talk to an Expert <span class="material-icons">arrow_forward</span></a></section>
          </div>
        </div>

        <div class="docs">
          @for (r of docCards(); track r.type) {
            <section class="panel dc">
              <div class="ph"><h3>{{ r.label }}</h3><span [class]="'pill pill--' + r.status">{{ stateLabel(r) }}</span></div>
              @if (r.document; as d) {
                <dl><dt>{{ r.type === 'pan' ? 'PAN Number' : r.type === 'aadhaar' ? 'Aadhaar Number' : 'File' }}</dt><dd>{{ d.reference ?? d.file_name }}</dd><dt>Uploaded On</dt><dd>{{ d.uploaded_at | date: 'd MMM y' }}</dd></dl>
                <div class="two"><button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="view(d.id)">View</button><a class="fw-btn fw-btn--ghost fw-btn--sm" routerLink="/account/profile/kyc">{{ r.status === 'verified' ? 'Details' : 'Replace' }}</a></div>
              } @else {
                <div class="none"><span class="material-icons">cloud_upload</span><small>Upload {{ r.label }}</small></div>
                <a class="fw-btn fw-btn--primary fw-btn--sm fw-btn--block" routerLink="/account/profile/kyc">Upload Document</a>
              }
            </section>
          }
        </div>

        <section class="trust">
          <div><span class="material-icons">lock</span><span><b>100% Secure</b><small>Your data is encrypted and confidential</small></span></div>
          <div><span class="material-icons">bolt</span><span><b>Faster Approvals</b><small>Complete KYC for quicker loan processing</small></span></div>
          <div><span class="material-icons">local_offer</span><span><b>Better Loan Offers</b><small>Get personalized offers based on your profile</small></span></div>
          <div><span class="material-icons">edit_note</span><span><b>Easy Updates</b><small>Update your information anytime, anywhere</small></span></div>
        </section>
      }
    }
  `,
  styles: [
    `
      .top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 0.9fr); gap: 16px; margin-bottom: 16px; align-items: start; } .stack { display: grid; gap: 16px; }
      .who { display: grid; justify-items: center; gap: 8px; margin: 4px 0 12px; } .avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 3px solid var(--fw-blue-soft); } .avatar--init { display: grid; place-items: center; background: linear-gradient(135deg, var(--fw-blue), var(--fw-navy-2)); color: #fff; font-size: 1.8rem; font-weight: 600; }
      dl { display: grid; grid-template-columns: 110px 1fr; gap: 8px 10px; margin: 0; font-size: 0.84rem; } dt { color: var(--fw-muted); } dd { margin: 0; font-weight: 500; overflow-wrap: anywhere; }
      .bar { height: 8px; background: #e6ecf6; border-radius: 99px; overflow: hidden; margin-bottom: 12px; } .bar i { display: block; height: 100%; background: #16a34a; transition: width 0.4s; }
      .kr { display: flex; gap: 10px; align-items: center; padding: 9px 0; border-top: 1px solid var(--fw-line); font-size: 0.86rem; } .kr .pill { margin-left: auto; } .kr > .material-icons { color: #b3bfd1; } .kr > .material-icons.ok { color: #16a34a; } .panel .fw-btn--block { margin-top: 12px; }
      .panel.ok { background: #eefaf2; border-color: #c9ecd5; } .stack h3 { display: flex; gap: 6px; align-items: center; } .panel.ok h3 .material-icons { color: #16a34a; } .stack h3 .material-icons { color: var(--fw-blue); }
      .docs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
      .dc dl { margin-bottom: 10px; } .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } .none { display: grid; justify-items: center; gap: 4px; border: 1px dashed var(--fw-line-strong); border-radius: 10px; padding: 18px 10px; margin-bottom: 10px; color: var(--fw-muted); } .none .material-icons { font-size: 34px; color: var(--fw-blue); }
      @media (max-width: 1280px) { .top { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .top .stack { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; } .docs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 800px) { .top, .top .stack, .docs { grid-template-columns: minmax(0, 1fr); } }
    `,
  ],
  styleUrls: ['../../website/website-ui.scss', './profile.scss'],
})
export class ProfileKycOverviewComponent {
  private readonly svc = inject(CustomerProfileService);
  protected readonly auth = inject(AuthService);

  protected readonly site = WEBSITE;
  protected readonly photo = this.svc.photoUrl;
  protected readonly v = signal<ProfileView | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly rows = computed(() => ROWS.map((r) => this.v()?.kyc.types.find((t) => t.type === r.type)).filter((t): t is KycType => !!t).map((t) => (t.type === 'selfie' ? { ...t, label: 'Photo' } : t)));
  protected readonly docCards = computed(() => this.rows().filter((r) => ['pan', 'aadhaar', 'address_proof', 'income_proof'].includes(r.type)));
  protected readonly initials = computed(() => (this.auth.user()?.name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join(''));

  constructor() {
    this.svc.profile().subscribe({ next: (p) => this.v.set(p), error: (e: { message?: string }) => this.error.set(e?.message ?? 'We could not load your profile.') });
  }

  protected cap(s: string | null): string {
    return s ? s[0].toUpperCase() + s.slice(1) : '';
  }

  protected stateLabel(t: KycType): string {
    return ({ verified: 'Verified', pending: 'Under review', rejected: 'Rejected', not_uploaded: t.required ? 'Pending' : 'Optional' } as Record<string, string>)[t.status];
  }

  protected view(id: number): void {
    this.svc.viewKyc(id);
  }
}
