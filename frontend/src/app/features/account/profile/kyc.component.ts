import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { KycSummary, KycType } from '@core/models/customer-profile.model';
import { CustomerProfileService } from '@core/services/customer-profile.service';

import { WEBSITE } from '../../website/website.config';
import { ProfileHeadComponent } from './profile-head.component';
import { acceptFor, typeError } from '../document-rules';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

const HINTS: Record<string, string> = {
  pan: 'Upload a clear copy of your PAN Card',
  aadhaar: 'Upload a clear copy of your Aadhaar Card',
  address_proof: 'Utility bill, passport, voter ID or rent agreement',
  bank_proof: 'Upload a clear copy for bank verification · PDF only',
  selfie: 'Upload a selfie holding your PAN or Aadhaar',
  income_proof: 'Salary slip, ITR or Form 16 · PDF only (optional, for better offers)',
  additional: 'Upload any other relevant document',
};

/** KYC Verification — layout follows images/12_Dashboard/05_Profile_Settings/03_KYC_Verification.png. */
@Component({
  selector: 'app-profile-kyc',
  standalone: true,
  imports: [RouterLink, DatePipe, ProfileHeadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-profile-head title="KYC Verification" subtitle="Complete your KYC to unlock faster loan approvals and a better financial experience."
      [crumbs]="[{ label: 'Profile', link: '/account/profile' }, { label: 'KYC Verification' }]"
      [secureTitle]="k()?.complete ? 'Your KYC is Verified' : (k()?.stage === 'in_review' ? 'Your KYC is under review' : 'Complete your KYC')"
      [secureText]="k()?.complete ? 'Your documents are verified. You can now apply for loans and access all services.' : (k()?.stage === 'in_review' ? 'We have your documents and are verifying them. This usually takes 1–2 working days.' : 'Upload the documents below. It takes about two minutes.')" />

    @if (error()) {
      <div class="fw-alert fw-alert--error" role="alert">{{ error() }} <button class="link" type="button" (click)="load()">Retry</button></div>
    } @else if (!k()) {
      <div class="fw-skeleton" style="height:260px"></div>
    } @else {
      @if (k(); as kyc) {
        <div class="row1">
          <section class="panel steps">
            <div class="step" [class.done]="true"><span class="dot"><span class="material-icons">{{ kyc.stage === 'upload' ? 'looks_one' : 'check' }}</span></span><b>Upload Documents</b><em [class]="'pill ' + (kyc.stage === 'upload' ? 'pill--pending' : 'pill--ok')">{{ kyc.stage === 'upload' ? kyc.uploaded + ' of ' + kyc.total + ' uploaded' : 'Completed' }}</em></div>
            <div class="step"><span class="dot" [class.dot--on]="kyc.stage !== 'upload'"><span class="material-icons">{{ kyc.stage === 'verified' ? 'check' : 'looks_two' }}</span></span><b>Verification in Progress</b><em [class]="'pill ' + (kyc.stage === 'verified' ? 'pill--ok' : kyc.stage === 'in_review' ? 'pill--info' : '')">{{ kyc.stage === 'verified' ? 'Completed' : kyc.stage === 'in_review' ? 'In progress' : 'Pending' }}</em></div>
            <div class="step"><span class="dot" [class.dot--ok]="kyc.complete"><span class="material-icons">{{ kyc.complete ? 'verified' : 'lock' }}</span></span><b>KYC Verified</b><em [class]="'pill ' + (kyc.complete ? 'pill--ok' : '')">{{ kyc.complete ? 'Completed' : 'Pending' }}</em></div>
          </section>
          <section class="panel safe"><span class="material-icons">shield</span><div><p class="script" aria-hidden="true">Safe. Secure. Trusted.</p><small>Your documents are encrypted and protected with bank-grade security.</small></div></section>
        </div>

        @if (message(); as m) { <div class="fw-alert" [class.fw-alert--error]="m.err" [class.fw-alert--success]="!m.err" role="status">{{ m.text }}</div> }

        <div class="row2">
          <section class="panel">
            <div class="ph"><div><h2>Upload &amp; Manage Documents</h2><p class="sub">Please upload clear and valid documents. Only JPEG, PNG or PDF files are allowed (max 5 MB per file).</p></div>
              @if (kyc.complete) { <span class="pill pill--ok big"><span class="material-icons">check_circle</span>All Documents Verified</span> }</div>
            <div class="cards">
              @for (t of kyc.types; track t.type) {
                <article class="card" [class.card--ok]="t.status === 'verified'" [class.card--bad]="t.status === 'rejected'">
                  <div class="card__h"><span class="material-icons">description</span><div><b>{{ t.label }}@if (t.required) { <i>*</i> } @else { <small> (Optional)</small> }</b><small>{{ hint(t) }}</small></div></div>
                  <div class="card__prev">
                    @if (t.document; as d) {
                      @if (previews()[d.id]; as src) { <img [src]="src" [alt]="t.label + ' preview'" /> } @else { <span class="material-icons">{{ d.mime_type === 'application/pdf' ? 'picture_as_pdf' : 'image' }}</span> }
                      @if (t.status === 'verified') { <span class="tick material-icons">check_circle</span> }
                    } @else { <span class="material-icons empty">cloud_upload</span><small>Not uploaded yet</small> }
                  </div>
                  @if (t.document; as d) {
                    <div class="card__file"><span class="material-icons">insert_drive_file</span><span><b>{{ d.file_name }}</b><small>Uploaded on {{ d.uploaded_at | date: 'd MMM y' }}@if (d.reference) { · {{ d.reference }} }</small></span></div>
                    @if (d.remarks) { <div class="reason">Reason: {{ d.remarks }}</div> }
                  }
                  @if (needsNumber(t) && t.status !== 'verified') {
                    <div class="num"><label [for]="'n-' + t.type">{{ t.type === 'pan' ? 'PAN number' : 'Aadhaar number' }} (optional)</label>
                      <input [id]="'n-' + t.type" class="in" [value]="numbers()[t.type] ?? ''" (input)="setNumber(t.type, $event)" [placeholder]="t.type === 'pan' ? 'ABCDE1234F' : '1234 5678 9012'" [maxLength]="t.type === 'pan' ? 10 : 14" /></div>
                  }
                  <div class="card__act">
                    <span [class]="'pill pill--' + t.status">{{ stateLabel(t) }}</span>
                    @if (t.document) { <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="view(t.document.id)">View</button> }
                    @if (t.status !== 'verified') {
                      <label class="fw-btn fw-btn--sm up" [class.fw-btn--primary]="!t.document" [class.fw-btn--ghost]="!!t.document" [class.busy]="busy() === t.type">{{ busy() === t.type ? 'Uploading…' : t.document ? 'Replace' : 'Upload' }}
                        <input type="file" [attr.accept]="accept(t.type)" [disabled]="busy() !== null" (change)="pick(t, $event)" [attr.aria-label]="'Upload ' + t.label" /></label>
                    }
                  </div>
                </article>
              }
            </div>
          </section>

          <aside class="side">
            <section class="panel guide"><h3><span class="material-icons">lightbulb</span> KYC Guidelines</h3>
              <ul><li><span class="material-icons">check_circle</span>Upload clear and readable documents</li><li><span class="material-icons">check_circle</span>Ensure all details are visible</li><li><span class="material-icons">check_circle</span>File size should be less than 5 MB</li><li><span class="material-icons">check_circle</span>Only JPEG, PNG or PDF files are allowed</li><li><span class="material-icons">check_circle</span>Make sure documents are valid and not expired</li></ul></section>
            <section class="panel help"><h3><span class="material-icons">support_agent</span> Need Help?</h3><p class="sub">Our support team is here to help you with your KYC verification.</p>
              <a [href]="site.phoneHref"><span class="material-icons">phone</span>{{ site.phone }}</a><small class="muted">{{ site.hours }}</small>
              <a [href]="site.whatsappHref" target="_blank" rel="noopener" class="wa"><span class="material-icons">chat</span>Chat on WhatsApp</a></section>
          </aside>
        </div>

        <section class="banner" [class.banner--ok]="kyc.complete">
          <span class="material-icons">{{ kyc.complete ? 'check_circle' : 'info' }}</span>
          <div><b>{{ kyc.complete ? 'Your KYC is Verified' : kyc.stage === 'in_review' ? 'Your documents are being verified' : 'Complete your KYC to continue' }}</b>
            <small>{{ kyc.complete ? 'Thank you! Your documents have been successfully verified. You can now apply for loans and access all features.' : kyc.stage === 'in_review' ? 'We will notify you as soon as verification is complete.' : 'Upload the required documents marked with * to get verified.' }}</small></div>
          <a class="fw-btn fw-btn--ghost" routerLink="/account/profile/overview">KYC &amp; Profile Overview</a>
        </section>
      }
    }
  `,
  styles: [
    `
      .row1 { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 16px; margin-bottom: 16px; }
      .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center; position: relative; }
      .step { display: grid; justify-items: center; gap: 6px; position: relative; } .step:not(:last-child)::after { content: ''; position: absolute; top: 22px; left: calc(50% + 28px); right: calc(-50% + 28px); height: 3px; background: #d7dfec; }
      .dot { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: #cdd6e4; color: #fff; } .step.done .dot, .dot--on { background: var(--fw-blue); } .dot--ok { background: #16a34a; }
      .step b { font-size: 0.86rem; }
      .safe { display: flex; gap: 14px; align-items: center; background: linear-gradient(120deg, #eaf2ff, #dbe8fb); } .safe > .material-icons { font-size: 44px; color: var(--fw-blue); } .safe .script { font-family: Lora, serif; font-style: italic; font-size: 1.25rem; color: var(--fw-navy-2); margin: 0 0 4px; } .safe small { color: var(--fw-muted); }
      .row2 { display: grid; grid-template-columns: minmax(0, 1.9fr) minmax(260px, 1fr); gap: 16px; margin-bottom: 16px; align-items: start; }
      .big { display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; } .big .material-icons { font-size: 18px; }
      .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
      .card { border: 1px solid var(--fw-line); border-radius: 12px; padding: 12px; display: grid; gap: 10px; align-content: start; min-width: 0; } .card--ok { border-color: #bbe5c8; background: #f8fdf9; } .card--bad { border-color: #f5b9b9; background: #fff8f8; }
      .card__h { display: flex; gap: 8px; align-items: flex-start; } .card__h > .material-icons { color: var(--fw-blue); } .card__h div { display: grid; line-height: 1.3; min-width: 0; } .card__h b { font-size: 0.86rem; } .card__h b i { color: #dc2626; font-style: normal; } .card__h small { color: var(--fw-muted); font-size: 0.72rem; }
      .card__prev { height: 130px; border: 1px dashed var(--fw-line-strong); border-radius: 10px; display: grid; place-items: center; align-content: center; gap: 4px; position: relative; overflow: hidden; background: #f7faff; } .card__prev img { width: 100%; height: 100%; object-fit: cover; } .card__prev .material-icons { font-size: 42px; color: var(--fw-blue); } .card__prev .empty { color: #9fb3d1; } .card__prev small { color: var(--fw-muted); font-size: 0.72rem; }
      .tick { position: absolute; top: 6px; right: 6px; background: #fff; border-radius: 50%; color: #16a34a !important; font-size: 26px !important; }
      .card__file { display: flex; gap: 8px; align-items: center; font-size: 0.78rem; } .card__file .material-icons { color: var(--fw-blue); font-size: 20px; } .card__file span:last-child { display: grid; min-width: 0; } .card__file b { overflow-wrap: anywhere; font-weight: 500; } .card__file small { color: var(--fw-muted); font-size: 0.7rem; }
      .reason { font-size: 0.74rem; color: #b91c1c; background: #fef2f2; border-radius: 8px; padding: 6px 8px; }
      .num label { font-size: 0.72rem; color: var(--fw-muted); } .num .in { height: 36px; font-size: 0.82rem; }
      .card__act { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; } .card__act .pill { margin-right: auto; }
      .up { position: relative; overflow: hidden; } .up input { position: absolute; inset: 0; opacity: 0; cursor: pointer; } .up.busy { opacity: 0.6; }
      .side { display: grid; gap: 16px; } .guide h3, .help h3 { display: flex; gap: 6px; align-items: center; } .guide h3 .material-icons { color: #f59e0b; } .help h3 .material-icons { color: var(--fw-blue); }
      .guide ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 0.82rem; } .guide li { display: flex; gap: 8px; align-items: flex-start; } .guide li .material-icons { color: #16a34a; font-size: 18px; }
      .help a { display: flex; gap: 8px; align-items: center; text-decoration: none; color: var(--fw-ink); font-weight: 600; font-size: 0.88rem; margin: 4px 0; } .help a .material-icons { color: var(--fw-blue); font-size: 20px; } .help .wa { color: #15803d; } .help .wa .material-icons { color: #22c55e; }
      .banner { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; background: #fff8e6; border: 1px solid #f6e0a3; border-radius: 14px; padding: 16px 20px; } .banner--ok { background: #eefaf2; border-color: #c9ecd5; } .banner > .material-icons { font-size: 38px; color: #d97706; } .banner--ok > .material-icons { color: #16a34a; } .banner div { display: grid; flex: 1; min-width: 220px; } .banner small { color: var(--fw-muted); font-size: 0.82rem; }
      @media (max-width: 1280px) { .row2, .row1 { grid-template-columns: minmax(0, 1fr); } .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 700px) { .cards { grid-template-columns: minmax(0, 1fr); } .steps { grid-template-columns: 1fr; text-align: left; } .step { grid-template-columns: 44px 1fr auto; justify-items: start; align-items: center; gap: 0 10px; } .step:not(:last-child)::after { display: none; } }
    `,
  ],
  styleUrls: ['../../website/website-ui.scss', './profile.scss'],
})
export class ProfileKycComponent {
  private readonly svc = inject(CustomerProfileService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly site = WEBSITE;
  protected readonly k = signal<KycSummary | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal<string | null>(null);
  protected readonly message = signal<{ text: string; err: boolean } | null>(null);
  protected readonly numbers = signal<Record<string, string | undefined>>({});
  protected readonly previews = signal<Record<number, string>>({});
  private readonly loaded = new Set<number>();

  constructor() {
    this.load();
    this.svc.prefill().subscribe({ next: (d) => { if (d.pan) this.numbers.update((n) => ({ pan: d.pan ?? undefined, ...n })); }, error: () => undefined });
    this.destroyRef.onDestroy(() => Object.values(this.previews()).forEach((u) => URL.revokeObjectURL(u)));
  }

  protected load(): void {
    this.error.set(null);
    this.svc.kyc().subscribe({
      next: (k) => this.apply(k),
      error: (e: { message?: string }) => this.error.set(e?.message ?? 'We could not load your KYC details.'),
    });
  }

  private apply(k: KycSummary): void {
    this.k.set(k);
    for (const t of k.types) {
      const d = t.document;
      if (d && d.mime_type.startsWith('image/') && !this.loaded.has(d.id)) {
        this.loaded.add(d.id);
        this.svc.kycBlob(d.id).subscribe({ next: (b) => this.previews.update((p) => ({ ...p, [d.id]: URL.createObjectURL(b) })), error: () => undefined });
      }
    }
  }

  protected hint(t: KycType): string {
    return HINTS[t.type] ?? '';
  }

  protected needsNumber(t: KycType): boolean {
    return t.type === 'pan' || t.type === 'aadhaar';
  }

  protected setNumber(type: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.numbers.update((n) => ({ ...n, [type]: type === 'pan' ? v.toUpperCase() : v }));
  }

  protected stateLabel(t: KycType): string {
    return ({ verified: 'Verified', pending: 'Under review', rejected: 'Rejected', not_uploaded: t.required ? 'Pending' : 'Optional' } as Record<string, string>)[t.status];
  }

  protected view(id: number): void {
    this.svc.viewKyc(id);
  }

  protected readonly accept = acceptFor;

  protected pick(t: KycType, e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const blocked = typeError(t.type, file);
    if (blocked) return this.say(blocked, true);
    if (!ALLOWED.includes(file.type)) return this.say(`“${file.name}” isn’t supported. Please upload a PDF, JPG or PNG.`, true);
    if (file.size > MAX_BYTES) return this.say(`“${file.name}” is ${(file.size / 1048576).toFixed(1)} MB — the limit is 5 MB.`, true);
    this.busy.set(t.type);
    this.message.set(null);
    this.svc.uploadKyc(t.type, file, this.numbers()[t.type]?.trim() || undefined).subscribe({
      next: (r) => { this.busy.set(null); this.apply(r.kyc); this.say(`${t.label} uploaded. It is now under review.`, false); },
      error: (err: { message?: string; errors?: Record<string, string[]> }) => {
        this.busy.set(null);
        this.say(Object.values(err?.errors ?? {}).flat()[0] ?? err?.message ?? 'The upload failed. Please try again.', true);
      },
    });
  }

  private say(text: string, err: boolean): void {
    this.message.set({ text, err });
  }
}
