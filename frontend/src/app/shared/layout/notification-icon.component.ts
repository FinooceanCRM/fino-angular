import { DatePipe } from '@angular/common';
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
  notificationCategory,
  notificationIcon,
} from '@core/models/notification.model';
import { NotificationService } from '@core/services/notification.service';

const MAX_VISIBLE = 8;

/**
 * Topbar bell + dropdown — the Notification Center available to every
 * authenticated role. Backed by the real `NotificationService` (the same
 * data as the full `/notifications` page and the dashboard panel), mirroring
 * Super Admin's dropdown structure but wired to the real API instead of that
 * module's mock `NotificationDataProvider`.
 */
@Component({
  selector: 'app-notification-icon',
  standalone: true,
  imports: [
    DatePipe,
    MatBadgeModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './notification-icon.component.html',
  styleUrl: './notification-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationIconComponent {
  protected readonly notifications = inject(NotificationService);

  protected readonly notificationIcon = notificationIcon;
  protected readonly notificationCategory = notificationCategory;
  protected readonly categoryLabel = NOTIFICATION_CATEGORY_LABEL;
  protected readonly categories = Object.entries(NOTIFICATION_CATEGORY_LABEL) as [NotificationCategory, string][];

  protected readonly unreadCount = this.notifications.unreadCount;
  protected readonly activeCategory = signal<NotificationCategory | ''>('');

  private readonly items = signal<AppNotification[]>([]);

  protected readonly visibleItems = computed(() => {
    const category = this.activeCategory();
    const items = category ? this.items().filter((item) => notificationCategory(item.type) === category) : this.items();
    return items.slice(0, MAX_VISIBLE);
  });

  constructor() {
    this.refresh();
  }

  protected setCategory(category: NotificationCategory | ''): void {
    this.activeCategory.set(category);
  }

  protected markRead(item: AppNotification, event: Event): void {
    event.stopPropagation();
    if (item.is_read) {
      return;
    }
    this.notifications.markRead(item.id).subscribe({ next: () => this.refresh() });
  }

  protected markAllRead(): void {
    this.notifications.markAllRead().subscribe({ next: () => this.refresh() });
  }

  private refresh(): void {
    this.notifications.list().subscribe({
      next: (items) => this.items.set(items),
      error: () => undefined,
    });
  }
}
