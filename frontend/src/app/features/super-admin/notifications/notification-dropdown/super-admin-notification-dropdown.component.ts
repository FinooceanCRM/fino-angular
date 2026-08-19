import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import {
  AppNotification,
  NOTIFICATION_CATEGORY_LABEL,
  NotificationCategory,
} from '../../data/models/notification.model';
import { NotificationDataProvider } from '../../data/providers/notification-data.provider';

const MAX_VISIBLE = 8;
const NOW = new Date('2026-08-15T10:00:00+05:30');

/**
 * Bell-icon dropdown for the Super Admin module. Reads/writes the same
 * `NotificationDataProvider` signal state as the full Notification Center
 * page, so marking an item read here is reflected there immediately.
 */
@Component({
  selector: 'app-super-admin-notification-dropdown',
  standalone: true,
  imports: [
    RouterLink,
    MatBadgeModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './super-admin-notification-dropdown.component.html',
  styleUrl: './super-admin-notification-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminNotificationDropdownComponent {
  private readonly notificationData = inject(NotificationDataProvider);

  protected readonly categoryLabel = NOTIFICATION_CATEGORY_LABEL;
  protected readonly categories = Object.entries(NOTIFICATION_CATEGORY_LABEL) as [NotificationCategory, string][];

  protected readonly unreadCount = this.notificationData.unreadCount;
  protected readonly activeCategory = signal<NotificationCategory | ''>('');

  private readonly sorted = computed(() =>
    [...this.notificationData.notifications()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
  );

  protected readonly visibleItems = computed(() => {
    const category = this.activeCategory();
    const items = category ? this.sorted().filter((n) => n.category === category) : this.sorted();
    return items.slice(0, MAX_VISIBLE);
  });

  protected setCategory(category: NotificationCategory | ''): void {
    this.activeCategory.set(category);
  }

  protected markRead(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    this.notificationData.markRead(notification.id);
  }

  protected markAllRead(): void {
    this.notificationData.markAllRead();
  }

  protected relativeTime(iso: string): string {
    const minutes = Math.round((NOW.getTime() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
}
