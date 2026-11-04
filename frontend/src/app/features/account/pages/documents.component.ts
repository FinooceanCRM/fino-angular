import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CustomerApplication, CustomerDocument, CustomerRequiredDocument } from '@core/models/customer-portal.model';
import { CustomerPortalService } from '@core/services/customer-portal.service';

import { WEBSITE } from '../../website/website.config';
import { acceptFor, isPdfOnly, typeError } from '../document-rules';
import { BreadcrumbComponent } from '@shared/components/breadcrumb.component';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

/** Document type (API value) → the group it belongs to in tabs and the "Document Type" column. */
const GROUP: Record<string, string> = {
  aadhaar: 'identity', pan: 'identity', address_proof: 'address', income_proof: 'income',
  bank_statement: 'bank', property_documents: 'property', other: 'other',
};

const GROUPS: { key: string; tab: string; label: string }[] = [
  { key: 'identity', tab: 'Identity Proof', label: 'Identity Proof' },
  { key: 'address', tab: 'Address Proof', label: 'Address Proof' },
  { key: 'income', tab: 'Income Proof', label: 'Income Proof' },
  { key: 'bank', tab: 'Bank Details', label: 'Bank Statement' },
  { key: 'property', tab: 'Property Documents', label: 'Property Document' },
  { key: 'other', tab: 'Other Documents', label: 'Other Document' },
];

/** My Documents — layout follows images/12_Dashboard/04_My_Documents.png. */
@Component({
  selector: 'app-account-documents',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb variant="portal" [withBack]="true" />
    <header class="head">
      <div><h1>My Documents</h1><p>Manage, upload and track your documents securely.</p></div>
      <p class="script" aria-hidden="true">Secure Documents<br />Faster Approvals<br />A Brighter Tomorrow</p>
      <div class="secure"><span class="material-icons">verified_user</span><div><b>Your Data is Safe with Us</b><small>We use industry-standard encryption to protect your information.</small></div></div>
    </header>

    <div class="tabs" role="tablist">
      <button type="button" role="tab" [attr.aria-selected]="tab() === 'all'" [class.on]="tab() === 'all'" (click)="tab.set('all')">All Documents</button>
      @for (g of groups; track g.key) {
        <button type="button" role="tab" [attr.aria-selected]="tab() === g.key" [class.on]="tab() === g.key" (click)="tab.set(g.key)">{{ g.tab }}</button>
      }
    </div>

    @if (error()) {
      <div class="fw-alert fw-alert--error" role="alert">{{ error() }} <button class="retry" type="button" (click)="load()">Retry</button></div>
    } @else if (loading()) {
      <div class="fw-skeleton" style="height:260px;margin-bottom:14px"></div>
      <div class="fw-skeleton" style="height:240px"></div>
    } @else if (apps().length === 0) {
      <section class="panel empty">
        <span class="material-icons">folder_open</span>
        <h2>No documents yet</h2>
        <p>Once you apply for a loan you can upload your documents here.</p>
        <a class="fw-btn fw-btn--primary" routerLink="/account/apply">Apply for a Loan</a>
      </section>
    } @else {
      <div class="top">
        <section class="panel drop" [class.drag]="dragging()" (dragover)="over($event)" (dragleave)="dragging.set(false)" (drop)="dropped($event)">
          <div class="drop__sel">
            @if (apps().length > 1) {
              <label>Application
                <select [value]="appId()" (change)="pickApp(+$any($event.target).value)" aria-label="Application">
                  @for (a of apps(); track a.id) { <option [value]="a.id" [selected]="a.id === appId()">{{ a.loan_type_label }} · {{ a.reference }}</option> }
                </select></label>
            }
            <label>Document type
              <select [value]="type()" (change)="type.set($any($event.target).value)" aria-label="Document type">
                @for (d of checklist(); track d.type) { <option [value]="d.type" [selected]="d.type === type()" [disabled]="d.status === 'verified'">{{ d.label }}{{ d.status === 'verified' ? ' (verified)' : '' }}</option> }
              </select></label>
          </div>
          <span class="material-icons cloud">cloud_upload</span>
          <h2>Upload Documents</h2>
          <p>Drag &amp; drop a file here or <button type="button" class="link" (click)="chooser.click()">click to browse</button></p>
          <small>{{ pdfOnly() ? 'Income proof, bank statements and passbook: PDF only (Max size: 5 MB)' : 'Supported formats: PDF, JPG, PNG (Max size: 5 MB)' }}</small>
          <input #chooser type="file" hidden [attr.accept]="accept()" (change)="chosen($event)" />
          <button type="button" class="fw-btn fw-btn--primary" [disabled]="uploading() || !canUpload()" (click)="chooser.click()">{{ uploading() ? 'Uploading…' : 'Choose File' }}</button>
          @if (message(); as m) { <div class="msg" [class.msg--err]="m.error" role="status">{{ m.text }}</div> }
        </section>

        <section class="panel check">
          <div class="ph"><h2>Documents Checklist</h2><button type="button" class="more" (click)="jump()">View All →</button></div>
          <p class="sub">Upload the required documents to complete your application.</p>
          @for (d of checklist(); track d.type) {
            <div class="crow">
              <span class="material-icons ck" [class.ck--ok]="d.status === 'verified' || d.status === 'pending'" [class.ck--bad]="d.status === 'rejected'">{{ d.status === 'rejected' ? 'cancel' : 'check_circle' }}</span>
              <span class="cname">{{ d.label }}@if (d.required === false) { <em>optional</em> }</span>
              <span class="cstat" [class]="'cstat cstat--' + d.status">{{ stateLabel(d.status) }}</span>
              @if (d.status === 'not_uploaded' || d.status === 'rejected') {
                <button type="button" class="fw-btn fw-btn--ghost fw-btn--sm" (click)="uploadNow(d, chooser)">Upload Now</button>
              } @else { <span></span> }
            </div>
            @if (d.status === 'rejected' && d.remarks) { <div class="reason">Reason: {{ d.remarks }}</div> }
          }
        </section>
      </div>

      <div class="bottom">
        <section class="panel table" id="uploaded">
          <div class="ph">
            <h2>Uploaded Documents</h2>
            <div class="tools">
              <label class="search"><span class="material-icons">search</span><input type="search" placeholder="Search documents..." aria-label="Search documents" [value]="term()" (input)="term.set($any($event.target).value)" /></label>
              <select aria-label="Filter by type" [value]="typeFilter()" (change)="typeFilter.set($any($event.target).value)">
                <option value="all">All Types</option>
                @for (g of groups; track g.key) { <option [value]="g.key" [selected]="typeFilter() === g.key">{{ g.label }}</option> }
              </select>
            </div>
          </div>
          @if (rows().length === 0) {
            <div class="none">@if (docs().length === 0) { You haven’t uploaded any documents yet. } @else { No documents match your search. <button type="button" class="link" (click)="clear()">Clear filters</button> }</div>
          } @else {
            <div class="scroll">
              <table>
                <thead><tr><th>Document Name</th><th>Document Type</th><th>Uploaded On</th><th>File</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  @for (d of rows(); track d.id) {
                    <tr>
                      <td><b>{{ d.label }}</b><small>{{ d.reference }}</small></td>
                      <td>{{ groupLabel(d.type) }}</td>
                      <td>{{ d.uploaded_at | date: 'd MMM y' }}</td>
                      <td><span class="file"><span class="material-icons">description</span>{{ d.file_name }}</span></td>
                      <td><span class="pill" [class]="'pill pill--' + d.status">{{ rowStatus(d.status) }}</span>@if (d.remarks) { <small class="rej">{{ d.remarks }}</small> }</td>
                      <td class="act">
                        <button type="button" class="linkbtn" (click)="view(d)">View</button>
                        <button type="button" class="linkbtn" (click)="download(d)" aria-label="Download {{ d.label }}"><span class="material-icons">download</span></button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>

        <aside class="side">
          <section class="panel helpbox">
            <span class="material-icons">support_agent</span>
            <div><h3>Need Help Uploading Documents?</h3><p>Our support team is here to assist you. Get quick help from our experts.</p></div>
            <a class="fw-btn fw-btn--primary fw-btn--block" routerLink="/account/help">Talk to an Expert <span class="material-icons">arrow_forward</span></a>
            <a class="phone" [href]="site.phoneHref">{{ site.phone }}</a>
          </section>
          <section class="panel tips">
            <h3><span class="material-icons">lightbulb</span> Important Guidelines</h3>
            <ul>
              <li><span class="material-icons">check</span>Upload clear and readable documents</li>
              <li><span class="material-icons">check</span>Ensure all details are visible</li>
              <li><span class="material-icons">check</span>Use original documents (no screenshots)</li>
              <li><span class="material-icons">check</span>Accepted formats: PDF, JPG, PNG</li>
              <li><span class="material-icons">check</span>Maximum file size: 5 MB</li>
            </ul>
          </section>
        </aside>
      </div>
    }

    <section class="trust">
      <div><span class="material-icons">bolt</span><span><b>Faster Approvals</b><small>Complete your documents early for quicker processing</small></span></div>
      <div><span class="material-icons">lock</span><span><b>100% Secure</b><small>Your data is encrypted and confidential</small></span></div>
      <div><span class="material-icons">folder_special</span><span><b>Easy Document Management</b><small>Access your documents anytime, anywhere</small></span></div>
      <div><span class="material-icons">support_agent</span><span><b>Dedicated Support</b><small>Our team is always here to help</small></span></div>
    </section>
  `,
  styles: [
    `
      .crumbs { display: flex; gap: 8px; font-size: 0.82rem; color: var(--fw-muted); margin-bottom: 8px; } .crumbs a { color: inherit; text-decoration: none; }
      .head { display: grid; grid-template-columns: 1fr auto auto; gap: 24px; align-items: center; margin-bottom: 16px; }
      h1 { margin: 0 0 4px; font-size: clamp(1.7rem, 3vw, 2.2rem); color: var(--fw-navy); } .head p { margin: 0; color: var(--fw-muted); font-size: 0.92rem; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.15rem; line-height: 1.25; color: var(--fw-navy-2); text-align: left; }
      .secure { display: flex; gap: 12px; align-items: center; background: var(--fw-blue-soft); border: 1px solid #dbe8fb; border-radius: 12px; padding: 12px 16px; max-width: 320px; }
      .secure .material-icons { font-size: 34px; color: var(--fw-blue); } .secure div { display: grid; } .secure small { color: var(--fw-muted); font-size: 0.74rem; }
      .tabs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
      .tabs button { border: 1px solid var(--fw-line); background: #fff; border-radius: 10px; padding: 10px 18px; font: 500 0.84rem Poppins, sans-serif; cursor: pointer; color: var(--fw-ink); }
      .tabs button.on { background: var(--fw-blue); color: #fff; border-color: var(--fw-blue); }
      .panel { background: #fff; border: 1px solid var(--fw-line); border-radius: 14px; padding: 18px; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.04); }
      .top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 16px; margin-bottom: 16px; }
      .drop { border: 2px dashed #93b7f5; background: #f7faff; display: grid; justify-items: center; align-content: center; gap: 8px; text-align: center; padding: 20px; transition: background 0.15s, border-color 0.15s; }
      .drop.drag { background: #e6f0ff; border-color: var(--fw-blue); }
      .drop__sel { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; width: 100%; } .drop__sel label { display: grid; gap: 2px; text-align: left; font-size: 0.72rem; color: var(--fw-muted); flex: 1 1 150px; min-width: 0; } .drop__sel select { width: 100%; }
      select { border: 1px solid var(--fw-line-strong); border-radius: 8px; padding: 8px 10px; font: 400 0.84rem Poppins, sans-serif; background: #fff; color: var(--fw-ink); max-width: 100%; }
      .cloud { font-size: 56px; color: var(--fw-blue); } .drop h2 { margin: 0; font-size: 1.3rem; } .drop p { margin: 0; font-size: 0.86rem; } .drop small { color: var(--fw-muted); font-size: 0.78rem; }
      .link { background: none; border: 0; color: var(--fw-blue); font-weight: 600; cursor: pointer; padding: 0; font: inherit; text-decoration: underline; }
      .msg { font-size: 0.82rem; padding: 8px 12px; border-radius: 8px; background: #dcfce7; color: #15803d; max-width: 100%; } .msg--err { background: #fee2e2; color: #b91c1c; }
      .check .ph, .table .ph { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; } .ph h2 { margin: 0; font-size: 1.1rem; }
      .more { background: none; border: 0; color: var(--fw-blue); font-weight: 600; font-size: 0.82rem; cursor: pointer; } .sub { margin: 0 0 10px; color: var(--fw-muted); font-size: 0.82rem; }
      .crow { display: grid; grid-template-columns: 24px 1fr auto 96px; gap: 10px; align-items: center; padding: 8px 0; border-top: 1px solid var(--fw-line); font-size: 0.86rem; }
      .ck { color: #b3bfd1; font-size: 22px; } .ck--ok { color: #16a34a; } .ck--bad { color: #dc2626; }
      .cname em { font-style: normal; font-size: 0.68rem; color: var(--fw-muted); background: #eef2f8; border-radius: 6px; padding: 1px 6px; margin-left: 6px; }
      .cstat { font-size: 0.8rem; font-weight: 500; } .cstat--verified { color: #15803d; } .cstat--pending { color: #2563eb; } .cstat--rejected { color: #dc2626; } .cstat--not_uploaded { color: #d97706; }
      .reason { grid-column: 1 / -1; font-size: 0.76rem; color: #b91c1c; background: #fef2f2; border-radius: 8px; padding: 6px 10px; margin: 0 0 4px 34px; }
      .bottom { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(260px, 1fr); gap: 16px; margin-bottom: 16px; align-items: start; }
      .tools { display: flex; gap: 10px; flex-wrap: wrap; } .search { display: flex; align-items: center; gap: 6px; border: 1px solid var(--fw-line-strong); border-radius: 10px; padding: 0 10px; } .search input { border: 0; outline: 0; height: 36px; font: 400 0.84rem Poppins, sans-serif; width: 170px; background: transparent; } .search .material-icons { color: var(--fw-blue); font-size: 20px; }
      .scroll { overflow-x: auto; } table { width: 100%; border-collapse: collapse; font-size: 0.84rem; min-width: 720px; }
      th { text-align: left; color: var(--fw-muted); font-weight: 600; font-size: 0.76rem; padding: 10px 8px; border-bottom: 1px solid var(--fw-line); background: #f8fafd; } td:first-child b, td:nth-child(3) { white-space: nowrap; } td { padding: 12px 8px; border-bottom: 1px solid var(--fw-line); vertical-align: middle; } td small { display: block; color: var(--fw-muted); font-size: 0.7rem; }
      .file { display: inline-flex; align-items: center; gap: 6px; } .file .material-icons { color: var(--fw-blue); font-size: 18px; }
      .pill { display: inline-block; font-size: 0.72rem; font-weight: 600; border-radius: 8px; padding: 3px 10px; white-space: nowrap; } .pill--verified { background: #dcfce7; color: #15803d; } .pill--pending { background: #fef3c7; color: #b45309; } .pill--rejected { background: #fee2e2; color: #b91c1c; } .rej { color: #b91c1c !important; max-width: 190px; margin-top: 4px; }
      .act { white-space: nowrap; } .linkbtn { background: none; border: 0; color: var(--fw-blue); font-weight: 600; cursor: pointer; font: 600 0.82rem Poppins, sans-serif; padding: 4px 6px; } .linkbtn .material-icons { font-size: 18px; vertical-align: middle; }
      .none { text-align: center; color: var(--fw-muted); padding: 26px 10px; font-size: 0.88rem; }
      .side { display: grid; gap: 16px; } .helpbox { background: var(--fw-blue-soft); display: grid; gap: 10px; } .helpbox > .material-icons { font-size: 34px; color: var(--fw-blue); } .helpbox h3 { margin: 0 0 4px; font-size: 1.02rem; } .helpbox p { margin: 0; font-size: 0.82rem; color: var(--fw-muted); } .phone { text-align: center; font-weight: 600; color: var(--fw-navy); text-decoration: none; font-size: 0.9rem; }
      .tips { background: #fffaeb; border-color: #fde7a3; } .tips h3 { margin: 0 0 8px; font-size: 1rem; display: flex; gap: 6px; align-items: center; } .tips h3 .material-icons { color: #f59e0b; } .tips ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 0.82rem; } .tips li { display: flex; gap: 8px; align-items: center; } .tips li .material-icons { color: #16a34a; font-size: 18px; }
      .trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; background: var(--fw-blue-soft); border: 1px solid #dbe8fb; border-radius: 14px; padding: 16px; }
      .trust > div { display: flex; gap: 10px; align-items: center; } .trust .material-icons { color: var(--fw-blue); font-size: 30px; } .trust span:last-child { display: grid; line-height: 1.25; } .trust small { color: var(--fw-muted); font-size: 0.72rem; }
      .empty { text-align: center; display: grid; justify-items: center; gap: 8px; padding: 36px 20px; } .empty .material-icons { font-size: 48px; color: var(--fw-blue); } .empty h2 { margin: 0; }
      .retry { margin-left: 8px; background: none; border: 0; text-decoration: underline; cursor: pointer; color: inherit; }
      .fw-btn { white-space: nowrap; }
      @media (max-width: 1100px) { .head { grid-template-columns: 1fr; } .script, .secure { display: none; } .top, .bottom { grid-template-columns: minmax(0, 1fr); } .trust { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 600px) { .crow { grid-template-columns: 24px 1fr auto; } .crow .fw-btn { grid-column: 2 / -1; justify-self: start; } .trust { grid-template-columns: 1fr; } }
      @media (max-width: 700px) { .tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } .tabs button { padding: 11px 8px; font-size: 0.8rem; text-align: center; } .tabs button:first-child { grid-column: 1 / -1; } }
    `,
  ],
  styleUrl: '../../website/website-ui.scss',
})
export class AccountDocumentsComponent {
  private readonly portal = inject(CustomerPortalService);

  protected readonly site = WEBSITE;
  protected readonly groups = GROUPS;

  protected readonly apps = signal<CustomerApplication[]>([]);
  protected readonly appId = signal(0);
  protected readonly detail = signal<CustomerApplication | null>(null);
  protected readonly docs = signal<CustomerDocument[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly tab = signal('all');
  protected readonly term = signal('');
  protected readonly typeFilter = signal('all');
  protected readonly type = signal('');
  protected readonly dragging = signal(false);
  protected readonly uploading = signal(false);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  protected readonly checklist = computed<CustomerRequiredDocument[]>(() => this.detail()?.documents ?? []);
  protected readonly canUpload = computed(() => {
    const t = this.checklist().find((d) => d.type === this.type());
    return !!t && t.status !== 'verified';
  });

  protected readonly rows = computed(() => {
    const term = this.term().trim().toLowerCase();
    const tab = this.tab();
    const filter = this.typeFilter();
    return this.docs().filter((d) => {
      const g = GROUP[d.type] ?? 'other';
      if (tab !== 'all' && g !== tab) return false;
      if (filter !== 'all' && g !== filter) return false;
      return !term || [d.label, d.file_name, d.reference ?? ''].some((s) => s.toLowerCase().includes(term));
    });
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.loading.set(true);
    this.portal.documents().subscribe({
      next: (d) => {
        this.docs.set(d);
        this.loadApps(d);
      },
      error: (e: { message?: string }) => { this.error.set(e?.message ?? 'We could not load your documents.'); this.loading.set(false); },
    });
  }

  /** Opens on the application that needs attention: one with a rejected document, else the one uploaded to most recently. */
  private loadApps(docs: CustomerDocument[]): void {
    this.portal.applications(1, 50).subscribe({
      next: (p) => {
        this.apps.set(p.items);
        if (p.items.length === 0) { this.loading.set(false); return; }
        const wanted = this.appId() || docs.find((d) => d.status === 'rejected')?.lead_id || docs[0]?.lead_id;
        this.pickApp(p.items.some((a) => a.id === wanted) ? (wanted as number) : p.items[0].id, true);
      },
      error: (e: { message?: string }) => { this.error.set(e?.message ?? 'We could not load your applications.'); this.loading.set(false); },
    });
  }

  protected pickApp(id: number, first = false): void {
    this.appId.set(id);
    this.portal.application(id).subscribe({
      next: (a) => {
        this.detail.set(a);
        const next = (a.documents ?? []).find((d) => d.required !== false && (d.status === 'not_uploaded' || d.status === 'rejected'))
          ?? (a.documents ?? []).find((d) => d.status !== 'verified');
        if (!this.type() || first || !(a.documents ?? []).some((d) => d.type === this.type())) this.type.set(next?.type ?? '');
        this.loading.set(false);
      },
      error: (e: { message?: string }) => { this.error.set(e?.message ?? 'We could not load this application.'); this.loading.set(false); },
    });
  }

  protected readonly pdfOnly = computed(() => isPdfOnly(this.type()));
  protected readonly accept = computed(() => acceptFor(this.type()));

  protected uploadNow(d: CustomerRequiredDocument, input: HTMLInputElement): void {
    this.type.set(d.type);
    this.message.set(null);
    input.click();
  }

  protected over(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(true);
  }

  protected dropped(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.send(file);
  }

  protected chosen(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.send(file);
  }

  /** Checks type and size in the browser first, so the customer gets an instant, specific message. */
  private send(file: File): void {
    const t = this.type();
    if (!t || !this.canUpload()) {
      this.message.set({ text: 'Choose a document type that is not already verified.', error: true });
      return;
    }
    const blocked = typeError(t, file);
    if (blocked) {
      this.message.set({ text: blocked, error: true });
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      this.message.set({ text: `“${file.name}” isn’t supported. Please upload a PDF, JPG or PNG.`, error: true });
      return;
    }
    if (file.size > MAX_BYTES) {
      this.message.set({ text: `“${file.name}” is ${(file.size / 1048576).toFixed(1)} MB — the limit is 5 MB.`, error: true });
      return;
    }
    this.uploading.set(true);
    this.message.set(null);
    this.portal.uploadDocument(this.appId(), t, file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.message.set({ text: `Uploaded “${file.name}”. It’s now under review.`, error: false });
        this.portal.documents().subscribe((d) => this.docs.set(d));
        this.pickApp(this.appId());
      },
      error: (err: { message?: string; errors?: Record<string, string[]> }) => {
        this.uploading.set(false);
        const first = err?.errors ? Object.values(err.errors)[0]?.[0] : null;
        this.message.set({ text: first ?? err?.message ?? 'The upload failed. Please try again.', error: true });
      },
    });
  }

  protected jump(): void {
    document.getElementById('uploaded')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected clear(): void {
    this.term.set('');
    this.typeFilter.set('all');
    this.tab.set('all');
  }

  protected view(d: CustomerDocument): void {
    this.portal.viewDocument(d);
  }

  protected download(d: CustomerDocument): void {
    this.portal.downloadDocument(d);
  }

  protected groupLabel(type: string): string {
    return GROUPS.find((g) => g.key === (GROUP[type] ?? 'other'))?.label ?? 'Other Document';
  }

  protected stateLabel(s: string): string {
    return ({ verified: 'Verified', pending: 'Under review', rejected: 'Rejected', not_uploaded: 'Pending' } as Record<string, string>)[s] ?? s;
  }

  protected rowStatus(s: string): string {
    return ({ verified: 'Verified', pending: 'Under Review', rejected: 'Rejected' } as Record<string, string>)[s] ?? s;
  }
}
