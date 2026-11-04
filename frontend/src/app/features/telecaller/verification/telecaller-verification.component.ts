import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  DeskBank,
  DeskDocument,
  DeskKyc,
  DeskMessage,
  DeskTab,
  VerificationSummary,
} from '@core/models/telecaller-verification.model';
import { TelecallerVerificationService } from '@core/services/telecaller-verification.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

const TABS: { key: DeskTab; label: string; icon: string; count: keyof VerificationSummary }[] = [
  { key: 'documents', label: 'Application documents', icon: 'description', count: 'documents' },
  { key: 'kyc', label: 'KYC documents', icon: 'badge', count: 'kyc' },
  { key: 'bank-accounts', label: 'Bank accounts', icon: 'account_balance', count: 'bank_accounts' },
  { key: 'messages', label: 'Website messages', icon: 'mail', count: 'messages' },
];

const DOC_LABELS: Record<string, string> = {
  pan: 'PAN card',
  aadhaar: 'Aadhaar card',
  address_proof: 'Address proof',
  income_proof: 'Income proof',
  bank_statement: 'Bank statement',
};

/**
 * Verification desk: every document, KYC file, bank account and website message a customer has submitted and a
 * telecaller still has to check. New inquiries themselves live in the Customer Inquiries queue (linked below).
 */
@Component({
  selector: 'app-telecaller-verification',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet, RouterLink, MatButtonModule, MatButtonToggleModule, MatIconModule, MatProgressBarModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Verification desk" subtitle="Everything customers have submitted that needs a check before it is trusted." />

    <a class="desk__inq" routerLink="/inquiries">
      <mat-icon>inbox</mat-icon>
      <span><b>{{ summary()?.new_inquiries ?? 0 }} new customer inquiries</b> waiting for a first call</span>
      <mat-icon>arrow_forward</mat-icon>
    </a>

    <mat-button-toggle-group class="desk__tabs" [value]="tab()" (change)="select($event.value)" aria-label="What to verify">
      @for (t of tabs; track t.key) {
        <mat-button-toggle [value]="t.key"><mat-icon>{{ t.icon }}</mat-icon> {{ t.label }} ({{ summary()?.[t.count] ?? 0 }})</mat-button-toggle>
      }
    </mat-button-toggle-group>

    @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
    @if (error(); as message) { <p class="desk__error" role="alert">{{ message }}</p> }

    @switch (tab()) {
      @case ('documents') {
        @for (d of documents(); track d.id) {
          <article class="row">
            <div class="row__main">
              <b>{{ docLabel(d.type) }}</b>
              <span>{{ d.lead.applicant_name }} · {{ d.lead.applicant_phone ?? '—' }}</span>
              <small>{{ d.lead.reference }} · {{ d.file_name }} · {{ d.uploaded_at | date: 'd MMM, h:mm a' }}</small>
            </div>
            <ng-container *ngTemplateOutlet="actions; context: { id: d.id, view: 'documents' }" />
          </article>
        } @empty { <p class="desk__empty">Nothing to verify here. 🎉</p> }
      }
      @case ('kyc') {
        @for (k of kyc(); track k.id) {
          <article class="row">
            <div class="row__main">
              <b>{{ k.label }}@if (k.reference) { · {{ k.reference }} }</b>
              <span>{{ k.customer.name }} · {{ k.customer.phone ?? '—' }}</span>
              <small>{{ k.file_name }} · {{ k.uploaded_at | date: 'd MMM, h:mm a' }}</small>
            </div>
            <ng-container *ngTemplateOutlet="actions; context: { id: k.id, view: 'kyc' }" />
          </article>
        } @empty { <p class="desk__empty">No KYC documents waiting.</p> }
      }
      @case ('bank-accounts') {
        @for (b of banks(); track b.id) {
          <article class="row">
            <div class="row__main">
              <b>{{ b.bank_name }} · {{ b.account_masked }}</b>
              <span>{{ b.holder_name }} · IFSC {{ b.ifsc }}</span>
              <small>{{ b.customer.name }} · {{ b.customer.phone ?? '—' }} · {{ b.added_at | date: 'd MMM, h:mm a' }}</small>
            </div>
            <div class="row__act">
              <button mat-flat-button type="button" [disabled]="busy()" (click)="verifyBank(b)"><mat-icon>verified</mat-icon> Verify</button>
            </div>
          </article>
        } @empty { <p class="desk__empty">No bank accounts waiting.</p> }
      }
      @case ('messages') {
        @for (m of messages(); track m.id) {
          <article class="row">
            <div class="row__main">
              <b>{{ m.name }} · {{ m.inquiry_type }}</b>
              <span><a [href]="'tel:' + m.phone">{{ m.phone }}</a> · <a [href]="'mailto:' + m.email">{{ m.email }}</a></span>
              <p>{{ m.message }}</p>
              <small>{{ m.received_at | date: 'd MMM, h:mm a' }}</small>
            </div>
            <div class="row__act">
              <button mat-flat-button type="button" [disabled]="busy()" (click)="handle(m)"><mat-icon>done_all</mat-icon> Mark handled</button>
            </div>
          </article>
        } @empty { <p class="desk__empty">No new website messages.</p> }
      }
    }

    <ng-template #actions let-id="id" let-view="view">
      <div class="row__act">
        @if (rejecting() === view + id) {
          <input class="row__reason" #reason type="text" placeholder="Reason shown to the customer" maxlength="255" (keydown.enter)="reject(view, id, reason.value)" />
          <button mat-flat-button color="warn" type="button" [disabled]="busy()" (click)="reject(view, id, reason.value)">Send</button>
          <button mat-button type="button" (click)="rejecting.set(null)">Cancel</button>
        } @else {
          <button mat-stroked-button type="button" (click)="open(view, id)"><mat-icon>visibility</mat-icon> View</button>
          <button mat-flat-button type="button" [disabled]="busy()" (click)="verify(view, id)"><mat-icon>verified</mat-icon> Verify</button>
          <button mat-stroked-button color="warn" type="button" (click)="rejecting.set(view + id)"><mat-icon>block</mat-icon> Reject</button>
        }
      </div>
    </ng-template>
  `,
  styles: [
    `
      :host { display: block; }
      .desk__inq { display: flex; align-items: center; gap: 10px; padding: 12px 16px; margin-bottom: 14px; border-radius: 12px; text-decoration: none; color: inherit; background: var(--mat-sys-primary-container); }
      .desk__inq span { flex: 1; }
      .desk__tabs { display: flex; flex-wrap: wrap; margin-bottom: 14px; }
      .desk__error { color: var(--mat-sys-error); }
      .desk__empty { padding: 28px; text-align: center; opacity: 0.7; }
      .row { display: flex; gap: 16px; align-items: center; justify-content: space-between; padding: 14px 16px; margin-bottom: 10px; border-radius: 12px; border: 1px solid var(--mat-sys-outline-variant); background: var(--mat-sys-surface-container-lowest, #fff); }
      .row__main { display: grid; gap: 2px; min-width: 0; }
      .row__main span, .row__main small { opacity: 0.75; }
      .row__main p { margin: 4px 0 0; white-space: pre-wrap; }
      .row__act { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
      .row__reason { min-width: 220px; padding: 8px 10px; border: 1px solid var(--mat-sys-outline); border-radius: 8px; font: inherit; }
      @media (max-width: 720px) { .row { flex-direction: column; align-items: stretch; } .row__act { justify-content: flex-start; } .row__reason { flex: 1; min-width: 0; } }
    `,
  ],
})
export class TelecallerVerificationComponent implements OnInit {
  private readonly desk = inject(TelecallerVerificationService);
  private readonly snack = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);

  protected readonly tabs = TABS;
  protected readonly tab = signal<DeskTab>('documents');
  protected readonly summary = signal<VerificationSummary | null>(null);
  protected readonly documents = signal<DeskDocument[]>([]);
  protected readonly kyc = signal<DeskKyc[]>([]);
  protected readonly banks = signal<DeskBank[]>([]);
  protected readonly messages = signal<DeskMessage[]>([]);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** `view + id` of the row whose rejection reason is being typed. */
  protected readonly rejecting = signal<string | null>(null);

  ngOnInit(): void {
    const wanted = this.route.snapshot.queryParamMap.get('tab') as DeskTab | null;
    if (wanted && TABS.some((t) => t.key === wanted)) this.tab.set(wanted);
    this.refresh();
  }

  protected select(tab: DeskTab): void {
    this.tab.set(tab);
    this.rejecting.set(null);
    this.load();
  }

  protected docLabel(type: string): string {
    return DOC_LABELS[type] ?? type;
  }

  private refresh(): void {
    this.desk.summary().subscribe({ next: (s) => this.summary.set(s), error: () => undefined });
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    const done = { error: () => { this.loading.set(false); this.error.set('Unable to load this list.'); } };
    switch (this.tab()) {
      case 'documents': this.desk.documents().subscribe({ next: (r) => { this.documents.set(r); this.loading.set(false); }, ...done }); break;
      case 'kyc': this.desk.kyc().subscribe({ next: (r) => { this.kyc.set(r); this.loading.set(false); }, ...done }); break;
      case 'bank-accounts': this.desk.banks().subscribe({ next: (r) => { this.banks.set(r); this.loading.set(false); }, ...done }); break;
      case 'messages': this.desk.messages().subscribe({ next: (r) => { this.messages.set(r); this.loading.set(false); }, ...done }); break;
    }
  }

  protected open(view: 'documents' | 'kyc', id: number): void {
    this.desk.open(view, id);
  }

  protected verify(view: 'documents' | 'kyc', id: number): void {
    this.act(view === 'documents' ? this.desk.verifyDocument(id) : this.desk.verifyKyc(id), 'Verified. The customer has been told.');
  }

  protected reject(view: 'documents' | 'kyc', id: number, reason: string): void {
    const text = reason.trim();
    if (text.length < 3) {
      this.snack.open('Please give a short reason for the customer.', 'OK', { duration: 3000 });
      return;
    }
    this.act(view === 'documents' ? this.desk.rejectDocument(id, text) : this.desk.rejectKyc(id, text), 'Rejected. The customer has been told why.');
  }

  protected verifyBank(b: DeskBank): void {
    this.act(this.desk.verifyBank(b.id), 'Bank account verified.');
  }

  protected handle(m: DeskMessage): void {
    this.act(this.desk.handleMessage(m.id), 'Marked as handled.');
  }

  private act(request: ReturnType<TelecallerVerificationService['verifyBank']>, ok: string): void {
    this.busy.set(true);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.rejecting.set(null);
        this.snack.open(ok, 'OK', { duration: 2500 });
        this.refresh();
      },
      error: (e: { message?: string }) => {
        this.busy.set(false);
        this.snack.open(e?.message ?? 'That did not work. Please try again.', 'OK', { duration: 4000 });
      },
    });
  }
}
