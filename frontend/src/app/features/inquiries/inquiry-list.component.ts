import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router, RouterLink } from '@angular/router';

import { HScrollDirective } from '../website/shared/h-scroll.directive';
import { Inquiry, InquiryFilters, InquiryMeta, InquiryStats } from '@core/models/inquiry.model';
import { AuthService } from '@core/services/auth.service';
import { InquiryService } from '@core/services/inquiry.service';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { ErrorStateComponent } from '@shared/components/error-state.component';
import { LoadingComponent } from '@shared/components/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { PaginationComponent } from '@shared/components/pagination.component';
import { SearchInputComponent } from '@shared/components/search-input.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import { BAND_LABELS, bandColour, inquiryColour } from './inquiry-ui';

/**
 * Customer Inquiries queue (website + customer-portal leads). Telecaller and
 * Super Admin only — the route guard is UX; the API enforces the same rule.
 */
@Component({
  selector: 'app-inquiry-list',
  standalone: true,
  imports: [HScrollDirective,
    FormsModule, RouterLink, DatePipe, CurrencyPipe, PageHeaderComponent, PaginationComponent,
    SearchInputComponent, StatusPillComponent, EmptyStateComponent, ErrorStateComponent, LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Customer Inquiries" subtitle="Leads submitted through the public website and the customer portal." icon="contact_phone">
      <div page-header-actions>
        @if (isAdmin()) { <a class="btn" routerLink="/inquiries/routing"><span class="material-icons">alt_route</span> Routing rules</a> }
      </div>
    </app-page-header>

    @if (stats(); as s) {
      <div class="stats m-hscroll" appHScroll data-no-dots style="--m-bleed: 12px; --m-card-w: 42%">
        <button type="button" class="stat" (click)="quick({})"><span>All inquiries</span><strong>{{ s.total }}</strong></button>
        <button type="button" class="stat" (click)="quick({ inquiry_status: 'new' })"><span>New</span><strong>{{ s.by_status['new'] }}</strong></button>
        <button type="button" class="stat" (click)="quick({ assignment: 'unassigned' })"><span>Not with a manager</span><strong>{{ s.unassigned }}</strong></button>
        <button type="button" class="stat" [class.alert]="s.follow_ups_due > 0" (click)="quick({ follow_up_due: true })"><span>Follow-ups due</span><strong>{{ s.follow_ups_due }}</strong></button>
        <button type="button" class="stat" (click)="quick({ mine: true })"><span>Mine</span><strong>{{ s.mine }}</strong></button>
      </div>
    }

    <form class="filters" (ngSubmit)="apply()">
      <app-search-input class="grow" label="Search" placeholder="Name, phone, email or reference" [initialValue]="draft.search ?? ''" (search)="draft.search = $event; apply()" />
      <label>Loan type
        <select name="loan_type" [(ngModel)]="draft.loan_type" (ngModelChange)="apply()">
          <option value="">All</option>
          @for (t of meta()?.loan_types ?? []; track t.value) { <option [value]="t.value">{{ t.label }}</option> }
        </select>
      </label>
      <label>Status
        <select name="status" [(ngModel)]="draft.inquiry_status" (ngModelChange)="apply()">
          <option value="">All</option>
          @for (t of meta()?.statuses ?? []; track t.value) { <option [value]="t.value">{{ t.label }}</option> }
        </select>
      </label>
      <label>Source
        <select name="source" [(ngModel)]="draft.source" (ngModelChange)="apply()">
          <option value="">All</option>
          @for (t of meta()?.sources ?? []; track t.value) { <option [value]="t.value">{{ t.label }}</option> }
        </select>
      </label>
      @if ((meta()?.offers ?? []).length > 0) {
        <label>Offer
          <select name="offer" [(ngModel)]="draft.offer_id" (ngModelChange)="apply()">
            <option value="">All</option>
            @for (o of meta()?.offers ?? []; track o.id) { <option [value]="o.id">{{ o.name }}</option> }
          </select>
        </label>
      }
      <label>Manager
        <select name="assignment" [(ngModel)]="draft.assignment" (ngModelChange)="apply()">
          <option value="">Any</option><option value="unassigned">Not assigned</option><option value="assigned">Assigned</option>
        </select>
      </label>
      <label>From <input type="date" name="from" [(ngModel)]="draft.date_from" (ngModelChange)="apply()" /></label>
      <label>To <input type="date" name="to" [(ngModel)]="draft.date_to" (ngModelChange)="apply()" /></label>
      <button type="button" class="btn ghost" (click)="reset()">Clear</button>
    </form>

    @if (error()) {
      <app-error-state [message]="error()!" />
    } @else if (loading() && rows().length === 0) {
      <app-loading />
    } @else if (rows().length === 0) {
      <app-empty-state icon="inbox" message="No inquiries match these filters." />
    } @else {
      <div class="table-wrap" [class.busy]="loading()">
        <table>
          <thead>
            <tr>
              <th>Inquiry</th><th>Customer</th><th>Loan</th>
              <th><button type="button" class="sort" (click)="sort('loan_amount')">Amount {{ arrow('loan_amount') }}</button></th>
              <th>Source</th>
              <th><button type="button" class="sort" (click)="sort('created_at')">Submitted {{ arrow('created_at') }}</button></th>
              <th>Eligibility</th><th>Status</th><th>Owner</th><th>Manager</th>
              <th><button type="button" class="sort" (click)="sort('last_contacted_at')">Last contact {{ arrow('last_contacted_at') }}</button></th>
              <th><button type="button" class="sort" (click)="sort('next_follow_up_at')">Next follow-up {{ arrow('next_follow_up_at') }}</button></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.id) {
              <tr (click)="open(r)" tabindex="0" (keydown.enter)="open(r)">
                <td><b>{{ r.reference }}</b>@if (r.resubmission_count > 0) { <span class="dup" title="Customer re-submitted">×{{ r.resubmission_count + 1 }}</span> }</td>
                <td>{{ r.applicant_name }}<small><a class="call" [href]="'tel:' + r.applicant_phone" (click)="$event.stopPropagation()" [attr.aria-label]="'Call ' + r.applicant_name">☎ {{ r.applicant_phone }}</a></small></td>
                <td>{{ r.product_name ?? r.loan_type_label }}</td>
                <td>@if (r.offer) { — } @else { {{ r.loan_amount | currency: 'INR' : 'symbol' : '1.0-0' }} }</td>
                <td><app-status-pill [label]="r.source_label ?? r.source" [colour]="r.source === 'customer_portal' || r.offer ? 'accent' : 'primary'" /></td>
                <td>{{ r.created_at | date: 'd MMM y, h:mm a' }}</td>
                <td>@if (r.eligibility_band) { <app-status-pill [label]="bandLabels[r.eligibility_band]" [colour]="bandColour(r.eligibility_band)" /> } @else { — }</td>
                <td><app-status-pill [label]="r.inquiry_status_label ?? r.inquiry_status" [colour]="colour(r.inquiry_status)" /></td>
                <td>{{ r.assigned_telecaller?.name ?? '—' }}</td>
                <td>{{ r.assigned_manager?.name ?? '—' }}</td>
                <td>{{ r.last_contacted_at ? (r.last_contacted_at | date: 'd MMM, h:mm a') : '—' }}</td>
                <td [class.due]="isDue(r)">{{ r.next_follow_up_at ? (r.next_follow_up_at | date: 'd MMM, h:mm a') : '—' }}</td>
                <td><a class="btn sm" [routerLink]="['/inquiries', r.id]" (click)="$event.stopPropagation()">Open</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [length]="total()" [pageSize]="perPage()" [pageIndex]="page() - 1" itemLabel="inquiries" (pageChange)="paged($event)" />
    }
  `,
  styles: [
    `
      .call { color: inherit; text-decoration: none; white-space: nowrap; } .call:hover { color: var(--app-primary, #1c6df0); text-decoration: underline; }
      :host { display: block; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--app-space-3, 12px); margin-bottom: var(--app-space-4, 16px); }
      .stat { text-align: left; background: var(--tide-color-surface, #fff); border: 1px solid var(--tide-color-border-subtle, #dfe7ea); border-radius: var(--app-radius-md, 10px); padding: 12px 14px; display: grid; gap: 2px; cursor: pointer; font: inherit; color: inherit; }
      .stat:hover { border-color: var(--tide-color-secondary, #17a398); }
      .stat span { font-size: 0.78rem; color: var(--app-status-default-fg, #566); } .stat strong { font-size: 1.5rem; color: var(--tide-color-primary, #0a2a43); }
      .stat.alert strong { color: var(--tide-color-error, #c0392b); }
      .filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-bottom: var(--app-space-4, 16px); }
      .filters label { display: grid; gap: 4px; font-size: 0.75rem; color: var(--app-status-default-fg, #566); }
      @media (max-width: 720px) { .filters { gap: 10px; } .filters label { flex: 1 1 calc(50% - 5px); min-width: 0; } .filters label:first-child { flex-basis: 100%; } .filters select, .filters input { width: 100%; } }
      .filters select, .filters input { height: 38px; border: 1px solid var(--tide-color-border-subtle, #cfd9dd); border-radius: 8px; padding: 0 10px; background: #fff; font: inherit; }
      .grow { flex: 1 1 260px; }
      .btn { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border-radius: 8px; border: 1px solid var(--tide-color-primary, #0a2a43); background: var(--tide-color-primary, #0a2a43); color: #fff; text-decoration: none; cursor: pointer; font-weight: 500; font-size: 0.85rem; font-family: inherit; }
      .btn.ghost { background: transparent; color: var(--tide-color-primary, #0a2a43); } .btn.sm { height: 30px; padding: 0 10px; }
      .btn .material-icons { font-size: 18px; }
      .table-wrap { overflow-x: auto; background: var(--tide-color-surface, #fff); border: 1px solid var(--tide-color-border-subtle, #dfe7ea); border-radius: var(--app-radius-md, 10px); }
      .table-wrap.busy { opacity: 0.6; }
      table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
      th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--tide-color-border-subtle, #eef2f3); white-space: nowrap; }
      th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.4px; color: var(--app-status-default-fg, #566); background: #f7fafa; }
      tbody tr { cursor: pointer; } tbody tr:hover { background: #f4fbfa; }
      td small { display: block; color: var(--app-status-default-fg, #667); }
      .sort { background: none; border: 0; font: inherit; text-transform: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; padding: 0; }
      .dup { margin-left: 6px; font-size: 0.7rem; background: #fff0d1; color: #8a5200; border-radius: 99px; padding: 1px 6px; }
      .due { color: var(--tide-color-error, #c0392b); font-weight: 600; }
      /* Phone: each inquiry is a card instead of a wide table. */
      @media (max-width: 720px) {
        .table-wrap { overflow: visible; border: 0; background: transparent; box-shadow: none; }
        table, tbody { display: block; width: 100%; }
        thead { display: none; }
        tbody tr { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 12px; align-items: center; background: #fff; border: 1px solid var(--tide-color-border-subtle, #d9e2e6); border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
        tbody td { display: block; padding: 0; border: 0; min-width: 0; font-size: 0.84rem; }
        tbody td:nth-child(1) { grid-column: 1; grid-row: 1; } tbody td:nth-child(8) { grid-column: 2; grid-row: 1; justify-self: end; }
        tbody td:nth-child(2) { grid-column: 1 / -1; grid-row: 2; } tbody td:nth-child(2) small { display: block; margin-top: 2px; }
        tbody td:nth-child(3) { grid-column: 1; grid-row: 3; color: var(--app-status-default-fg, #566); } tbody td:nth-child(5) { grid-column: 2; grid-row: 3; justify-self: end; }
        tbody td:nth-child(6) { grid-column: 1; grid-row: 4; font-size: 0.76rem; color: var(--app-status-default-fg, #566); } tbody td:nth-child(12) { grid-column: 2; grid-row: 4; justify-self: end; font-size: 0.76rem; }
        tbody td:nth-child(12)::before { content: 'Follow-up: '; color: var(--app-status-default-fg, #566); }
        tbody td:nth-child(9) { grid-column: 1; grid-row: 5; font-size: 0.76rem; } tbody td:nth-child(9)::before { content: 'Owner: '; color: var(--app-status-default-fg, #566); }
        tbody td:nth-child(13) { grid-column: 2; grid-row: 5; justify-self: end; }
        tbody td:nth-child(4), tbody td:nth-child(7), tbody td:nth-child(10), tbody td:nth-child(11) { display: none; }
      }
    `,
  ],
})
export class InquiryListComponent {
  private readonly api = inject(InquiryService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly bandLabels = BAND_LABELS;
  protected readonly bandColour = bandColour;
  protected readonly colour = inquiryColour;

  protected readonly isAdmin = computed(() => this.auth.role() === 'super_admin');
  protected readonly meta = signal<InquiryMeta | null>(null);
  protected readonly stats = signal<InquiryStats | null>(null);
  protected readonly rows = signal<Inquiry[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly perPage = signal(15);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly sortKey = signal<string>('created_at');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');

  protected draft: InquiryFilters = {};

  constructor() {
    this.api.meta().subscribe({ next: (m) => this.meta.set(m), error: () => undefined });
    this.refreshStats();
    this.load();
  }

  private refreshStats(): void {
    this.api.stats().subscribe({ next: (s) => this.stats.set(s), error: () => undefined });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list({ ...this.draft, sort: this.sortKey(), dir: this.sortDir(), page: this.page(), per_page: this.perPage() })
      .subscribe({
        next: (p) => { this.rows.set(p.items); this.total.set(p.total); this.loading.set(false); },
        error: (e: { message?: string }) => { this.error.set(e?.message ?? 'We could not load inquiries.'); this.loading.set(false); },
      });
  }

  protected apply(): void {
    this.page.set(1);
    this.load();
  }

  protected reset(): void {
    this.draft = {};
    this.apply();
  }

  protected quick(filters: Partial<InquiryFilters>): void {
    this.draft = { ...filters };
    this.apply();
  }

  protected sort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('desc');
    }
    this.load();
  }

  protected arrow(key: string): string {
    return this.sortKey() === key ? (this.sortDir() === 'asc' ? '▲' : '▼') : '';
  }

  protected paged(e: PageEvent): void {
    this.page.set(e.pageIndex + 1);
    this.perPage.set(e.pageSize);
    this.load();
  }

  protected isDue(r: Inquiry): boolean {
    return !!r.next_follow_up_at && new Date(r.next_follow_up_at).getTime() <= Date.now() && r.inquiry_status !== 'assigned';
  }

  protected open(r: Inquiry): void {
    void this.router.navigate(['/inquiries', r.id]);
  }
}
