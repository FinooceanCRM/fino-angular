import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AssignableManager, InquiryDetail } from '@core/models/inquiry.model';
import { AuthService } from '@core/services/auth.service';
import { InquiryService } from '@core/services/inquiry.service';
import { ErrorStateComponent } from '@shared/components/error-state.component';
import { LoadingComponent } from '@shared/components/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import { BAND_LABELS, bandColour, inquiryColour, localToIso } from './inquiry-ui';
import { BackButtonComponent } from '@shared/components/back-button.component';

const SETTABLE = [
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow-up scheduled' },
  { value: 'interested', label: 'Interested' },
  { value: 'converted', label: 'Converted' },
  { value: 'not_reachable', label: 'Not reachable' },
  { value: 'not_interested', label: 'Not interested' },
];

/** One inquiry: customer data, eligibility, follow-ups, Manager assignment and history. */
@Component({
  selector: 'app-inquiry-detail',
  standalone: true,
  imports: [BackButtonComponent, FormsModule, DatePipe, CurrencyPipe, PageHeaderComponent, StatusPillComponent, LoadingComponent, ErrorStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-back-button variant="material" class="back" fallback="/inquiries" />

    @if (error() && !d()) {
      <app-error-state [message]="error()!" />
    } @else if (!d()) {
      <app-loading />
    } @else {
      @if (d(); as q) {
        <app-page-header [title]="q.applicant_name" [subtitle]="q.reference + ' · ' + (q.product_name ?? q.loan_type_label ?? '')" icon="person">
          <div page-header-actions class="pills">
            <app-status-pill [label]="q.source_label ?? q.source" [colour]="q.source === 'customer_portal' ? 'accent' : 'primary'" />
            <app-status-pill [label]="q.inquiry_status_label ?? q.inquiry_status" [colour]="colour(q.inquiry_status)" />
          </div>
        </app-page-header>

        @if (message()) { <div class="note ok" role="status">{{ message() }}</div> }
        @if (error()) { <div class="note bad" role="alert">{{ error() }}</div> }
        @if (blockedBy(); as owner) { <div class="note warn">This inquiry is being handled by <b>{{ owner }}</b>. You can view it but not change it.</div> }
        @if (q.resubmission_count > 0) { <div class="note warn">The customer submitted this inquiry again {{ q.resubmission_count }} time(s). No duplicate lead was created.</div> }
        @if (q.possible_duplicates.length) {
          <div class="note warn">
            Other leads share this phone number:
            @for (p of q.possible_duplicates; track p.id) { <span class="chip">{{ p.reference }} · {{ p.status }}</span> }
            — nothing has been merged; review before assigning.
          </div>
        }

        <div class="grid">
          <div class="col">
            <section class="card">
              <h2>Customer</h2>
              <dl>
                <dt>Name</dt><dd>{{ q.applicant_name }}</dd>
                <dt>Phone</dt><dd><a class="callnow" [href]="'tel:' + q.applicant_phone">☎ Call {{ q.applicant_phone }}</a></dd>
                <dt>Email</dt><dd>{{ q.applicant_email ?? '—' }}</dd>
                <dt>City</dt><dd>{{ q.city ?? '—' }}</dd>
                <dt>Account</dt><dd>{{ q.has_account ? 'Registered customer' : 'Anonymous website visitor' }}</dd>
                <dt>Submitted</dt><dd>{{ q.created_at | date: 'd MMM y, h:mm a' }}</dd>
                <dt>Consent given</dt><dd>{{ q.consent_at ? (q.consent_at | date: 'd MMM y, h:mm a') : '—' }}</dd>
              </dl>
            </section>

            @if (q.offer; as o) {
              <section class="card">
                <h2>{{ o.kind === 'callback' ? 'Website details' : 'Offer lead' }}</h2>
                <dl>
                  @if (o.kind !== 'callback') { <dt>Offer</dt><dd>{{ o.name ?? '—' }}</dd> }
                  <dt>Lead source</dt><dd>{{ q.source_label }}</dd>
                  @if (o.kind !== 'callback') { <dt>Interested in</dt><dd>{{ o.interested_service ?? 'Not specified' }}</dd>
                  <dt>Message</dt><dd>{{ o.message ?? '—' }}</dd> }
                  <dt>Account status</dt><dd>{{ o.account_status === 'registered' ? 'Registered customer' : 'Guest visitor' }}</dd>
                  @if (o.kind !== 'callback') { <dt>Marketing consent</dt><dd>{{ o.marketing_consent ? 'Yes — may receive offers' : 'No — contact about this offer only' }}</dd> }
                  <dt>Visitor ID</dt><dd><small>{{ o.visitor_id ?? '—' }}</small></dd>
                </dl>
              </section>
            } @else {
            <section class="card">
              <h2>Loan request</h2>
              <dl>
                <dt>Product</dt><dd>{{ q.product_name ?? q.loan_type_label }}</dd>
                <dt>Department</dt><dd>{{ q.department ?? '—' }}</dd>
                <dt>Amount</dt><dd>{{ q.loan_amount | currency: 'INR' : 'symbol' : '1.0-0' }}</dd>
                <dt>Tenure</dt><dd>{{ q.tenure_months ? q.tenure_months / 12 + ' years' : '—' }}</dd>
                <dt>Employment</dt><dd>{{ q.employment_type ?? '—' }}</dd>
                <dt>Monthly income</dt><dd>{{ q.monthly_income !== null ? (q.monthly_income | currency: 'INR' : 'symbol' : '1.0-0') : '—' }}</dd>
                <dt>Existing EMIs</dt><dd>{{ q.existing_emi !== null ? (q.existing_emi | currency: 'INR' : 'symbol' : '1.0-0') : '—' }}</dd>
                <dt>CRM status</dt><dd>{{ q.lead_status_label }}</dd>
              </dl>
            </section>
            }

            @if (q.eligibility; as e) {
              <section class="card">
                <h2>Eligibility (indicative)</h2>
                <p><app-status-pill [label]="bandLabels[e.band]" [colour]="bandColour(e.band)" /> {{ e.headline }}</p>
                <dl>
                  <dt>Estimated EMI</dt><dd>{{ e.estimated_emi | currency: 'INR' : 'symbol' : '1.0-0' }}</dd>
                  <dt>Indicative max</dt><dd>{{ e.indicative_max_amount | currency: 'INR' : 'symbol' : '1.0-0' }}</dd>
                </dl>
                @for (r of e.reasons; track r) { <p class="reason">⚠ {{ r }}</p> }
                <h3>Assumptions</h3>
                <ul>@for (a of e.assumptions; track a) { <li>{{ a }}</li> }</ul>
                <p class="muted">{{ e.disclaimer }}</p>
              </section>
            }
          </div>

          <div class="col">
            <section class="card">
              <h2>Ownership</h2>
              <dl>
                <dt>Telecaller</dt><dd>{{ q.assigned_telecaller?.name ?? 'Unclaimed' }}</dd>
                <dt>Manager</dt><dd>{{ q.assigned_manager?.name ?? 'Not assigned' }}</dd>
                <dt>Last contact</dt><dd>{{ q.last_contacted_at ? (q.last_contacted_at | date: 'd MMM, h:mm a') : '—' }}</dd>
                <dt>Next follow-up</dt><dd>{{ q.next_follow_up_at ? (q.next_follow_up_at | date: 'd MMM, h:mm a') : '—' }}</dd>
              </dl>
              @if (q.assignments.length) {
                <h3>Assignment history</h3>
                <ul class="hist">
                  @for (a of q.assignments; track a.id) {
                    <li><b>{{ a.assignee?.name }}</b> — by {{ a.assigned_by?.name ?? 'system' }}, {{ a.assigned_at | date: 'd MMM y, h:mm a' }}
                      @if (a.released_at) { <span class="muted"> (replaced {{ a.released_at | date: 'd MMM' }})</span> } @else { <span class="chip ok">current</span> }
                      @if (a.remarks) { <em>“{{ a.remarks }}”</em> }
                    </li>
                  }
                </ul>
              }
            </section>

            @if (canWork()) {
              <section class="card">
                <h2>Log a call or note</h2>
                <div class="f">
                  <select name="atype" [(ngModel)]="actType"><option value="contact">Customer contact</option><option value="note">Internal note</option></select>
                  <textarea name="abody" rows="3" [(ngModel)]="actBody" placeholder="What was discussed?" maxlength="2000"></textarea>
                  <label>Next follow-up (optional) <input type="datetime-local" name="afu" [(ngModel)]="actFollowUp" /></label>
                  <button class="btn" type="button" [disabled]="busy() || actBody.trim().length < 2" (click)="logActivity()">Save</button>
                </div>
              </section>

              <section class="card">
                <h2>Update status</h2>
                <div class="f">
                  <select name="st" [(ngModel)]="newStatus"><option value="">Select status</option>@for (s of settable; track s.value) { <option [value]="s.value">{{ s.label }}</option> }</select>
                  @if (newStatus === 'follow_up') { <label>Follow up at <input type="datetime-local" name="sfu" [(ngModel)]="statusFollowUp" /></label> }
                  <input name="sr" [(ngModel)]="statusRemarks" placeholder="Remarks (optional)" maxlength="2000" />
                  <button class="btn" type="button" [disabled]="busy() || !newStatus || (newStatus === 'follow_up' && !statusFollowUp)" (click)="saveStatus()">Update</button>
                </div>
              </section>

              <section class="card">
                <h2>{{ q.assigned_manager ? 'Reassign manager' : 'Assign to manager' }}</h2>
                <div class="f">
                  <select name="mgr" [(ngModel)]="managerId" (focus)="loadManagers()">
                    <option [ngValue]="null">Select a manager</option>
                    @for (m of managers(); track m.id) { <option [ngValue]="m.id">{{ m.name }} · {{ m.open_leads }} open{{ m.matches_rule ? ' · routed for this loan type' : '' }}</option> }
                  </select>
                  @if (managersLoaded() && managers().length === 0) { <span class="muted">No active manager is configured for this loan type. Ask a Super Admin to set routing rules.</span> }
                  <input name="reason" [(ngModel)]="assignReason" [placeholder]="q.assigned_manager ? 'Reason for reassigning (required)' : 'Reason (optional)'" maxlength="500" />
                  <button class="btn" type="button" [disabled]="busy() || !managerId || (!!q.assigned_manager && !assignReason.trim())" (click)="assign()">{{ q.assigned_manager ? 'Reassign' : 'Assign' }}</button>
                </div>
              </section>
            } @else if (q.assigned_manager && !blockedBy()) {
              <section class="card"><p class="muted">This inquiry has been assigned to {{ q.assigned_manager.name }} and continues in the lead workflow.</p></section>
            }

            <section class="card">
              <h2>Activity</h2>
              <ul class="tl">
                @for (a of q.activities; track a.id) {
                  <li>
                    <b>{{ label(a.type) }}</b> <span class="muted">{{ a.user?.name ?? 'System' }} · {{ a.created_at | date: 'd MMM y, h:mm a' }}</span>
                    @if (a.body) { <div>{{ a.body }}</div> }
                  </li>
                }
              </ul>
            </section>
          </div>
        </div>
      }
    }
  `,
  styles: [
    `
      .callnow { display: inline-block; background: #16a34a; color: #fff !important; text-decoration: none; font-weight: 600; padding: 6px 14px; border-radius: 999px; } .callnow:hover { background: #15803d; }
      :host { display: block; }
      .back { display: inline-flex; align-items: center; gap: 4px; color: var(--tide-color-secondary-hover, #108a7f); text-decoration: none; margin-bottom: 8px; font-size: 0.9rem; }
      .pills { display: flex; gap: 8px; }
      .note { padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; font-size: 0.88rem; }
      .note.ok { background: #e8f7ee; color: #0f5b2c; } .note.bad { background: #fdecea; color: #8a1f14; } .note.warn { background: #fff6e0; color: #7a4b00; }
      .chip { display: inline-block; background: #fff; border: 1px solid #f0d9a0; border-radius: 99px; padding: 1px 8px; margin: 0 4px; font-size: 0.75rem; } .chip.ok { background: #e8f7ee; border-color: #b6e2c6; color: #0f5b2c; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; } .col { display: grid; gap: 16px; }
      .card { background: var(--tide-color-surface, #fff); border: 1px solid var(--tide-color-border-subtle, #dfe7ea); border-radius: var(--app-radius-md, 10px); padding: 16px; }
      h2 { font-size: 1rem; margin: 0 0 10px; color: var(--tide-color-primary, #0a2a43); } h3 { font-size: 0.85rem; margin: 12px 0 4px; }
      dl { display: grid; grid-template-columns: 130px 1fr; gap: 6px 12px; margin: 0; font-size: 0.88rem; } dt { color: var(--app-status-default-fg, #566); } dd { margin: 0; font-weight: 500; }
      ul { margin: 0; padding-left: 18px; font-size: 0.85rem; line-height: 1.7; } .tl, .hist { list-style: none; padding: 0; display: grid; gap: 10px; }
      .tl li, .hist li { border-left: 3px solid #dfe7ea; padding-left: 10px; } .hist em { display: block; color: #566; }
      .muted { color: var(--app-status-default-fg, #667); font-size: 0.8rem; } .reason { color: #7a4b00; margin: 4px 0; font-size: 0.85rem; }
      .f { display: grid; gap: 10px; } .f label { display: grid; gap: 4px; font-size: 0.78rem; color: #566; }
      select, input, textarea { border: 1px solid #cfd9dd; border-radius: 8px; padding: 8px 10px; font: inherit; background: #fff; }
      .btn { justify-self: start; height: 36px; padding: 0 16px; border-radius: 8px; border: 0; background: var(--tide-color-primary, #0a2a43); color: #fff; cursor: pointer; font-family: inherit; }
      .btn[disabled] { opacity: 0.5; cursor: not-allowed; }
      @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
    `,
  ],
})
export class InquiryDetailComponent {
  private readonly api = inject(InquiryService);
  private readonly auth = inject(AuthService);

  /** Bound from the route (`:id`). */
  readonly id = input.required<string>();

  protected readonly bandLabels = BAND_LABELS;
  protected readonly bandColour = bandColour;
  protected readonly colour = inquiryColour;
  protected readonly settable = SETTABLE;

  protected readonly d = signal<InquiryDetail | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly managers = signal<AssignableManager[]>([]);
  protected readonly managersLoaded = signal(false);

  protected actType: 'note' | 'contact' = 'contact';
  protected actBody = '';
  protected actFollowUp = '';
  protected newStatus = '';
  protected statusRemarks = '';
  protected statusFollowUp = '';
  protected managerId: number | null = null;
  protected assignReason = '';

  private readonly me = computed(() => this.auth.user());
  private readonly isAdmin = computed(() => this.auth.role() === 'super_admin');

  /** Another Telecaller owns it → read-only for this user. */
  protected readonly blockedBy = computed(() => {
    const q = this.d();
    const owner = q?.assigned_telecaller;
    return !this.isAdmin() && owner && owner.id !== this.me()?.id ? owner.name : null;
  });

  /** Actions are available unless someone else owns it, or it already sits with a Manager (Telecaller). */
  protected readonly canWork = computed(() => {
    const q = this.d();
    if (!q || this.blockedBy()) return false;
    return this.isAdmin() || q.inquiry_status !== 'assigned';
  });

  constructor() {
    // Re-load whenever the route id changes (inputs are bound after construction).
    effect(() => {
      this.id();
      untracked(() => this.reload());
    });
  }

  protected label(type: string): string {
    return ({ note: 'Note', contact: 'Customer contact', status: 'Status change', assignment: 'Manager assignment', resubmission: 'Re-submitted', created: 'Inquiry received' } as Record<string, string>)[type] ?? type;
  }

  private reload(): void {
    this.api.detail(Number(this.id())).subscribe({
      next: (q) => { this.d.set(q); this.managersLoaded.set(false); },
      error: (e: { status?: number; message?: string }) =>
        this.error.set(e?.status === 404 ? 'That inquiry could not be found.' : e?.message ?? 'We could not load this inquiry.'),
    });
  }

  private run(label: string, call: () => import('rxjs').Observable<unknown>, after?: () => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    call().subscribe({
      next: () => { this.busy.set(false); this.message.set(label); after?.(); this.reload(); },
      error: (e: { status?: number; message?: string; errors?: Record<string, string[]> }) => {
        this.busy.set(false);
        this.error.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'That action could not be completed.');
        if (e?.status === 409) this.reload(); // someone else changed it — show fresh state
      },
    });
  }

  protected logActivity(): void {
    const id = Number(this.id());
    this.run('Saved.', () => this.api.addActivity(id, { type: this.actType, body: this.actBody.trim(), next_follow_up_at: localToIso(this.actFollowUp) }), () => {
      this.actBody = ''; this.actFollowUp = '';
    });
  }

  protected saveStatus(): void {
    const id = Number(this.id());
    this.run('Status updated.', () => this.api.updateStatus(id, {
      inquiry_status: this.newStatus,
      remarks: this.statusRemarks.trim() || undefined,
      next_follow_up_at: this.newStatus === 'follow_up' ? localToIso(this.statusFollowUp) : null,
    }), () => { this.newStatus = ''; this.statusRemarks = ''; this.statusFollowUp = ''; });
  }

  protected loadManagers(): void {
    if (this.managersLoaded()) return;
    this.api.managers(Number(this.id())).subscribe({
      next: (m) => { this.managers.set(m); this.managersLoaded.set(true); },
      error: () => this.managersLoaded.set(true),
    });
  }

  protected assign(): void {
    if (!this.managerId) return;
    const id = Number(this.id());
    const mgr = this.managerId;
    this.run('Assigned to manager.', () => this.api.assign(id, mgr, this.assignReason.trim() || undefined), () => {
      this.managerId = null; this.assignReason = '';
    });
  }
}
