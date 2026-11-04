import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { CustomerNotification } from '@core/models/customer-portal.model';
import { CustomerPortalService } from '@core/services/customer-portal.service';
import { BreadcrumbComponent } from '@shared/components/breadcrumb.component';

@Component({
  selector: 'app-account-notifications',
  standalone: true,
  imports: [BreadcrumbComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb variant="portal" [withBack]="true" />
    <div class="head">
      <div><h1 class="fw-h2">Notifications</h1><p class="fw-muted">Updates about your applications and documents.</p></div>
      @if (unread() > 0) { <button class="fw-btn fw-btn--ghost fw-btn--sm" type="button" (click)="readAll()">Mark all as read</button> }
    </div>

    @if (error()) {
      <div class="fw-alert fw-alert--error" role="alert">{{ error() }}</div>
    } @else if (loading()) {
      @for (i of [1,2,3]; track i) { <div class="fw-skeleton" style="height:64px;margin-bottom:10px"></div> }
    } @else if (items().length === 0) {
      <div class="fw-card empty"><span class="material-icons">notifications_none</span><h2 class="fw-h3">You’re all caught up</h2><p class="fw-muted">New updates will appear here.</p></div>
    } @else {
      <div class="fw-card list">
        @for (n of items(); track n.id) {
          <button type="button" class="n" [class.unread]="!n.is_read" (click)="open(n)">
            <span class="material-icons">{{ icon(n.type) }}</span>
            <span class="body"><strong>{{ n.title }}</strong><span class="fw-small fw-muted">{{ n.body }}</span></span>
            <span class="fw-small fw-muted">{{ n.created_at | date: 'd MMM, h:mm a' }}</span>
          </button>
        }
      </div>
    }
  `,
  styles: [
    `
      .crumbs { display: flex; gap: 8px; font-size: 0.82rem; color: var(--fw-muted); margin-bottom: 8px; } .crumbs a { color: inherit; text-decoration: none; } .crumbs a:hover { text-decoration: underline; }
      .head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 14px; } .head p { margin: 0; }
      .list { padding: 0; overflow: hidden; }
      .n { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; width: 100%; text-align: left; padding: 14px 18px; background: #fff; border: 0; border-top: 1px solid var(--fw-line); cursor: pointer; font: inherit; color: inherit; }
      .n:first-child { border-top: 0; } .n:hover { background: var(--fw-blue-soft); }
      .n.unread { background: #f3f8ff; } .n.unread strong::after { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--fw-blue); margin-left: 8px; }
      .n .material-icons { color: var(--fw-blue); } .body { display: grid; gap: 2px; }
      .empty { text-align: center; display: grid; justify-items: center; gap: 8px; padding: 36px 20px; } .empty .material-icons { font-size: 48px; color: var(--fw-blue); }
    `,
  ],
  styleUrl: '../../website/website-ui.scss',
})
export class AccountNotificationsComponent {
  private readonly portal = inject(CustomerPortalService);
  private readonly router = inject(Router);

  protected readonly items = signal<CustomerNotification[]>([]);
  protected readonly unread = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  private load(): void {
    this.portal.notifications().subscribe({
      next: (p) => { this.items.set(p.items); this.unread.set(p.unread ?? 0); this.loading.set(false); },
      error: (e: { message?: string }) => { this.error.set(e?.message ?? 'We could not load your notifications.'); this.loading.set(false); },
    });
  }

  protected icon(type: string): string {
    if (type.includes('document')) return 'description';
    if (type.includes('status')) return 'track_changes';
    if (type.includes('welcome')) return 'waving_hand';
    return 'notifications_none';
  }

  protected open(n: CustomerNotification): void {
    const leadId = Number(n.data?.['lead_id']);
    const go = () => { if (leadId) void this.router.navigate(['/account/applications', leadId]); };

    if (n.is_read) return go();
    this.portal.markRead(n.id).subscribe({
      next: () => { this.items.update((l) => l.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))); this.unread.update((u) => Math.max(0, u - 1)); go(); },
      error: () => go(),
    });
  }

  protected readAll(): void {
    this.portal.markAllRead().subscribe({
      next: () => { this.items.update((l) => l.map((x) => ({ ...x, is_read: true }))); this.unread.set(0); },
    });
  }
}
