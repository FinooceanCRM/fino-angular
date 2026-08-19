import { Injectable, computed, signal } from '@angular/core';

import { AppNotification } from '../models/notification.model';

function minutesAgoIso(minutes: number): string {
  const reference = new Date('2026-08-15T10:00:00+05:30');
  reference.setMinutes(reference.getMinutes() - minutes);
  return reference.toISOString();
}

const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 1, category: 'leads', icon: 'track_changes', title: 'Lead approved', body: 'LD-2408101024 (Radhika Iyer) was approved by the credit team.', is_read: false, created_at: minutesAgoIso(8) },
  { id: 2, category: 'users', icon: 'person_add', title: 'New user created', body: 'Priya Nair was added as Relationship Manager.', is_read: false, created_at: minutesAgoIso(22) },
  { id: 3, category: 'commission', icon: 'payments', title: 'Payout completed', body: 'PO-2026-1017 to CreditScore Guide is now processing.', is_read: false, created_at: minutesAgoIso(45) },
  { id: 4, category: 'documents', icon: 'description', title: 'Document uploaded', body: 'KYC document uploaded for lead LD-2408001432.', is_read: false, created_at: minutesAgoIso(70) },
  { id: 5, category: 'banking', icon: 'account_balance', title: 'Bank product deactivated', body: 'Axis Bank — Drive Easy was deactivated.', is_read: true, created_at: minutesAgoIso(130) },
  { id: 6, category: 'leads', icon: 'person_add', title: 'Lead assigned', body: 'LD-2408101017 (Harshad Patel) was assigned to Farhan Ali.', is_read: true, created_at: minutesAgoIso(200) },
  { id: 7, category: 'system', icon: 'build', title: 'System maintenance scheduled', body: 'Platform maintenance is scheduled for 20 Aug 2026, 12:00–2:00 AM IST.', is_read: true, created_at: minutesAgoIso(320) },
  { id: 8, category: 'banking', icon: 'account_balance_wallet', title: 'Banker reassigned', body: 'LD-2408001415 was reassigned to Vivek Joshi.', is_read: true, created_at: minutesAgoIso(410) },
  { id: 9, category: 'commission', icon: 'task_alt', title: 'Commission accrued', body: 'Suresh Patil accrued ₹42,000 in connector commission.', is_read: true, created_at: minutesAgoIso(560) },
  { id: 10, category: 'users', icon: 'block', title: 'User deactivated', body: 'Kavita Joshi (Manager) was deactivated.', is_read: true, created_at: minutesAgoIso(720) },
  { id: 11, category: 'leads', icon: 'cancel', title: 'Lead rejected', body: 'LD-2408001389 (Fatima Sheikh) did not meet minimum eligibility criteria.', is_read: true, created_at: minutesAgoIso(900) },
  { id: 12, category: 'documents', icon: 'description', title: 'Document uploaded', body: 'Income proof uploaded for lead LD-2407009981.', is_read: true, created_at: minutesAgoIso(1080) },
  { id: 13, category: 'system', icon: 'security', title: 'New login detected', body: 'A new sign-in to the Super Admin account from Mumbai, India.', is_read: true, created_at: minutesAgoIso(1300) },
  { id: 14, category: 'banking', icon: 'bolt', title: 'Matching engine run', body: 'LD-2408001402 matched with 4 bank products.', is_read: true, created_at: minutesAgoIso(1500) },
  { id: 15, category: 'commission', icon: 'payments', title: 'Payout completed', body: 'PO-2026-1011 to Growth Partners Media (₹1,50,000) was paid.', is_read: true, created_at: minutesAgoIso(1800) },
  { id: 16, category: 'users', icon: 'person_add', title: 'New user created', body: 'Rohan Bose was added as Banker.', is_read: true, created_at: minutesAgoIso(2200) },
  { id: 17, category: 'leads', icon: 'paid', title: 'Loan disbursed', body: 'LD-2408001402 (Sneha Kulkarni) — ₹35.4L disbursed.', is_read: true, created_at: minutesAgoIso(2600) },
  { id: 18, category: 'system', icon: 'bar_chart', title: 'Report generated', body: 'Monthly performance report generated for July 2026.', is_read: true, created_at: minutesAgoIso(3000) },
];

/** Centralized state for platform notifications. Root-provided so the Dashboard's panel and the full Notification Center share one list. */
@Injectable({ providedIn: 'root' })
export class NotificationDataProvider {
  private readonly _notifications = signal<AppNotification[]>(SEED_NOTIFICATIONS);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() => this._notifications().filter((n) => !n.is_read).length);

  markRead(id: number): void {
    this._notifications.update((current) => current.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  markAllRead(): void {
    this._notifications.update((current) => current.map((n) => ({ ...n, is_read: true })));
  }
}
